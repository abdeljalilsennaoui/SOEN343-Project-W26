/**
 * ParkingAdapter — Adapter pattern
 *
 * Wraps the raw IParkingGateway interface and exposes a clean,
 * domain-oriented API to the service/controller layer.
 * Emits GATEWAY_CALL analytics events for service-level tracking.
 *
 * Adaptee:  gateways/parking/IParkingGateway (+ Mock implementation)
 * Target:   { getAvailableSpots, reserveSpot } with normalized domain shapes
 * Client:   TransitController (external spots), ParkingController can optionally use it
 */
const { createParkingGateway } = require('../gateways');
const EventBus = require('../lib/EventBus');

const gateway = createParkingGateway();

/**
 * Returns available parking spots from the external gateway for a city.
 * @param {string} city
 * @returns {Array<{ id, facilityName, pricePerHour, status }>}
 */
async function getAvailableSpots(city) {
  EventBus.emit('GATEWAY_CALL', { metadata: { service: 'parking', operation: 'getAvailableSpots', success: true } });

  const raw = await gateway.getAvailableSpots(city);

  return raw.map((spot) => ({
    id: spot.id,
    facilityName: spot.facilityName,
    pricePerHour: spot.pricePerHour,
    status: spot.status,
  }));
}

/**
 * Reserves a spot via the external gateway.
 * @param {string} spotId
 * @returns {{ spotId, success, message }}
 */
async function reserveSpot(spotId) {
  EventBus.emit('GATEWAY_CALL', { metadata: { service: 'parking', operation: 'reserveSpot', success: true } });

  const result = await gateway.reserveSpot(spotId);

  return {
    spotId: result.spotId,
    success: result.success,
    message: result.message,
  };
}

module.exports = { getAvailableSpots, reserveSpot };
