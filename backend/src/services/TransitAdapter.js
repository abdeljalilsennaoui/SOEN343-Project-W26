/**
 * TransitAdapter — Adapter pattern
 *
 * Wraps the raw ITransitGateway interface and exposes a clean,
 * domain-oriented API to the service/controller layer.
 * If the underlying gateway changes its response shape, only this
 * file changes — no controller or route is touched.
 *
 * Adaptee:  gateways/transit/ITransitGateway (+ Mock implementation)
 * Target:   { getSchedule, getNearbyStops } with normalized domain shapes
 * Client:   TransitController
 */
const { createTransitGateway } = require('../gateways');
const EventBus = require('../lib/EventBus');

const gateway = createTransitGateway();

/**
 * Returns transit schedule for a city, optionally filtered by line.
 * Emits TRANSIT_QUERY and GATEWAY_CALL analytics events.
 * @param {string} city
 * @param {string|null} line
 * @returns {Array<{ city, line, type, nextArrivals, status }>}
 */
async function getSchedule(city, line = null) {
  EventBus.emit('GATEWAY_CALL', { metadata: { service: 'transit', operation: 'getSchedule', success: true } });
  EventBus.emit('TRANSIT_QUERY', { city, metadata: { line } });

  const raw = await gateway.getSchedule(city, line);

  return raw.map((entry) => {

    if (entry.trips) {
      return {
        city:       entry.city,
        line:       entry.line,
        name:       entry.name,
        type:       entry.type,
        color:      entry.color,
        tripsCount: entry.tripsCount,
        trips:      entry.trips,
      };
    }

    return {
      city:         entry.city,
      line:         entry.line,
      name:         entry.name,
      type:         entry.type,
      color:        entry.color,
      nextArrivals: entry.nextArrivals,
      status:       entry.status,
    };
  });
}

/**
 * Returns nearby transit stops for given coordinates.
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Array<{ id, name, distanceKm, coordinates: { lat, lng } }>}
 */
async function getNearbyStops(latitude, longitude) {
  EventBus.emit('GATEWAY_CALL', { metadata: { service: 'transit', operation: 'getNearbyStops', success: true } });

  const raw = await gateway.getNearbyStops(latitude, longitude);

  return raw.map((stop) => ({
    id: stop.id,
    name: stop.name,
    distanceKm: stop.distance,
    coordinates: { lat: stop.latitude, lng: stop.longitude },
  }));
}

module.exports = { getSchedule, getNearbyStops };
