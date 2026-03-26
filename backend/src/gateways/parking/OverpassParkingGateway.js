const IParkingGateway = require('./IParkingGateway');

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const DEFAULT_RADIUS = 1000;
const EARTH_RADIUS_METERS = 6371000;

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = EARTH_RADIUS_METERS;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

class OverpassParkingGateway extends IParkingGateway {
  async getAvailableSpots(center, radiusMeters = DEFAULT_RADIUS, maxResults = 120) {
    const query = `
      [out:json][timeout:15];
      (
        node["amenity"="parking"](around:${radiusMeters},${center.lat},${center.lng});
        way["amenity"="parking"](around:${radiusMeters},${center.lat},${center.lng});
      );
      out center tags;
    `.trim();

    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) throw new Error('Overpass API unavailable');

    const payload = await response.json();
    const elements = Array.isArray(payload.elements) ? payload.elements : [];

    return elements.map((el, index) => {
        const lat = el.lat ?? el.center?.lat;
        const lng = el.lon ?? el.center?.lon;
        if (!Number.isFinite(lat) || !Number.isFinite(lng))
            return null;

        const distanceMeters = haversineMeters(center.lat, center.lng, lat, lng);
        const name = el.tags?.name || el.tags?.['name:fr'] || `Parking #${index + 1}`;
        const fee =
          el.tags?.fee === 'yes' ? 'Not free' : el.tags?.fee === 'no' ? 'Free' : 'Unknown pricing';
        const capacity = el.tags?.capacity ? `${el.tags.capacity} spots` : null;

        return {
          id: `parking-${el.type}-${el.id}`,
          facilityName: name,
          pricePerHour: null,
          status: 'AVAILABLE',
          lat,
          lng,
          distanceMeters,
          notes: [fee, capacity].filter(Boolean).join(' · ') || 'Public parking nearby',
        };
      })
      .filter(Boolean)
      .slice(0, Math.max(1, maxResults));
  }

  async reserveSpot(_spotId) {
    throw new Error('reserveSpot not supported by Overpass gateway');
  }
}

module.exports = OverpassParkingGateway;