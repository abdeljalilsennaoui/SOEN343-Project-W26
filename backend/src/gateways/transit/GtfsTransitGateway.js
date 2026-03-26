const ITransitGateway = require('./ITransitGateway');
const https = require('https');
const AdmZip = require('adm-zip');

const GTFS_URL = 'https://www.stm.info/sites/default/files/gtfs/gtfs_stm.zip';

const ROUTE_TYPE_MAP = { '0': 'TRAM', '1': 'METRO', '3': 'BUS' };

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];

      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { fields.push(current.trim()); current = ''; }
      else { current += ch; }
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCsv(text) {
  const lines = text.trim().split('\n');
  const headers = parseCsvLine(lines[0].replace(/\r/g, ''));
  return lines.slice(1)
    .filter(Boolean)
    .map((line) => {
      const values = parseCsvLine(line.replace(/\r/g, ''));
      return Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? '')]));
    });
}

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

class GtfsTransitGateway extends ITransitGateway {
  constructor() {
    super();
    this.routesById = new Map();
    this.stopsById = new Map();
    this.arrivalsByRoute = new Map();
    this.tripsById = new Map();
    this.stopTimesByTrip = new Map();
    this.ready = false;
    this._load();
  }

  async _load() {
    try {
      const buffer = await downloadBuffer(GTFS_URL);
      const zip = new AdmZip(buffer);

      const get = (name) => zip.getEntry(name)?.getData().toString('utf8');

      const routesTxt = get('routes.txt');
      const stopsTxt = get('stops.txt');
      const tripsTxt = get('trips.txt');
      const stopTimesTxt = get('stop_times.txt');

      if (!routesTxt || !stopsTxt || !tripsTxt || !stopTimesTxt) {
        throw new Error('Missing required GTFS files');
      }

      for (const r of parseCsv(routesTxt)) {
        this.routesById.set(r.route_id, {
          route_id: r.route_id,
          short_name: r.route_short_name,
          long_name: r.route_long_name,
          type: ROUTE_TYPE_MAP[r.route_type] ?? 'BUS',
          color: r.route_color ? `#${r.route_color}` : null,
        });
      }

      for (const s of parseCsv(stopsTxt)) {
        this.stopsById.set(s.stop_id, {
          stop_id: s.stop_id,
          stop_name: s.stop_name,
          stop_lat: parseFloat(s.stop_lat),
          stop_lon: parseFloat(s.stop_lon),
        });
      }

      const tripToRoute = new Map();
      for (const t of parseCsv(tripsTxt)) {
        tripToRoute.set(t.trip_id, t.route_id);
      }

      const arrivalsMap = new Map();
      for (const st of parseCsv(stopTimesTxt)) {
        const routeId = tripToRoute.get(st.trip_id);
        if (!routeId || !st.departure_time) continue;
        if (!arrivalsMap.has(routeId)) arrivalsMap.set(routeId, new Set());
        arrivalsMap.get(routeId).add(timeToMinutes(st.departure_time));
      }

      for (const [routeId, minutesSet] of arrivalsMap) {
        this.arrivalsByRoute.set(routeId, [...minutesSet].sort((a, b) => a - b));
      }

      this.tripsById = new Map();
      for (const t of parseCsv(tripsTxt)) {
        this.tripsById.set(t.trip_id, {
          trip_id: t.trip_id,
          route_id: t.route_id,
          service_id: t.service_id,
          direction_id: t.direction_id,
          headsign: t.trip_headsign ?? '',
        });
      }

      this.stopTimesByTrip = new Map();
      for (const st of parseCsv(stopTimesTxt)) {
        if (!this.stopTimesByTrip.has(st.trip_id)) {
          this.stopTimesByTrip.set(st.trip_id, []);
        }
        this.stopTimesByTrip.get(st.trip_id).push({
          stop_id: st.stop_id,
          departure_time: st.departure_time,
          stop_sequence: parseInt(st.stop_sequence, 10),
        });
      }

      for (const stops of this.stopTimesByTrip.values()) {
        stops.sort((a, b) => a.stop_sequence - b.stop_sequence);
      }

      this.ready = true;
    } catch (err) {
      console.error('[GtfsTransitGateway] Failed to load GTFS data:', err.message);
    }
  }

  async _waitForLoad(timeoutMs = 60000) {
    if (this.ready) return;
    const start = Date.now();
    while (!this.ready && Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!this.ready) throw new Error('GTFS data not available — download may have failed');
  }

  async getSchedule(city, line = null) {
    await this._waitForLoad();

    const route = [...this.routesById.values()].find(
      (r) =>
        r.short_name?.toLowerCase() === String(line).toLowerCase() ||
        r.long_name?.toLowerCase().includes(String(line).toLowerCase()),
    );
    if (!route) throw new Error(`Line "${line}" not found`);

    const seen = new Set();
    const trips = [];

    for (const trip of this.tripsById.values()) {
      if (trip.route_id !== route.route_id)
        continue;

      const stopTimes = this.stopTimesByTrip.get(trip.trip_id) ?? [];

      if (!stopTimes.length)
        continue;

      const departsAt = stopTimes[0].departure_time.slice(0, 5);
      const direction = trip.headsign || `Direction ${trip.direction_id === '0' ? 'A' : 'B'}`;
      const key = `${direction}|${departsAt}`;

      if (seen.has(key))
        continue;

      seen.add(key);

      trips.push({
        tripId: trip.trip_id,
        direction,
        departsAt,
        departsMinutes: timeToMinutes(stopTimes[0].departure_time),
        stops: stopTimes.map((st) => ({
          name: this.stopsById.get(st.stop_id)?.stop_name ?? st.stop_id,
          time: st.departure_time.slice(0, 5),
        })),
      });
    }

    trips.sort((a, b) => a.departsMinutes - b.departsMinutes);

    return [{
      city,
      line: route.short_name,
      name: route.long_name,
      type: route.type,
      color: route.color,
      tripsCount: trips.length,
      trips,
    }];
  }


  async getNearbyStops(latitude, longitude, radiusKm = 0.5) {
    await this._waitForLoad();

    const radiusMeters = radiusKm * 1000;
    const toRad = (d) => (d * Math.PI) / 180;
    const R = 6371000;

    const results = [];
    for (const stop of this.stopsById.values()) {
      const dLat = toRad(stop.stop_lat - latitude);
      const dLng = toRad(stop.stop_lon - longitude);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(latitude)) * Math.cos(toRad(stop.stop_lat)) * Math.sin(dLng / 2) ** 2;
      const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (distance <= radiusMeters) {
        results.push({
          id: stop.stop_id,
          name: stop.stop_name,
          distance: Math.round(distance) / 1000,
          latitude: stop.stop_lat,
          longitude: stop.stop_lon,
        });
      }
    }

    results.sort((a, b) => a.distance - b.distance);
    return results.slice(0, 50);
  }
}

module.exports = GtfsTransitGateway;