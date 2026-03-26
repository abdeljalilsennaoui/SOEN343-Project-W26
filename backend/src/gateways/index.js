/**
 * Gateway Factory — Factory Method pattern
 *
 * Centralizes gateway instantiation. Callers never use `new ConcreteGateway()`
 * directly — they call createGateway(type) or a typed helper.
 * Swapping a mock for a real implementation requires changing only this file.
 *
 * Participants: all gateway interface + implementation classes,
 *               services that consume gateways (TransitAdapter, ParkingAdapter,
 *               BookingService via createPaymentGateway).
 */
const MockPaymentGateway = require('./payment/MockPaymentGateway');
const MockWeatherGateway = require('./weather/MockWeatherGateway');
const MockMapsGateway = require('./maps/MockMapsGateway');
const MockParkingGateway = require('./parking/MockParkingGateway');
const MockTransitGateway = require('./transit/MockTransitGateway');
const OverpassParkingGateway = require('./parking/OverpassParkingGateway');
const TransitGateway = require('./transit/GtfTransitGateway');

const GATEWAY_MAP = {
  payment: () => new MockPaymentGateway(),
  weather: () => new MockWeatherGateway(),
  maps:    () => new MockMapsGateway(),
  parking: () => new MockParkingGateway(),
  transit: () => new MockTransitGateway(),
};

/**
 * Unified factory method. Throws if type is unknown.
 * @param {'payment'|'weather'|'maps'|'parking'|'transit'} type
 */
function createGateway(type) {
  const factory = GATEWAY_MAP[type];
  if (!factory) throw new Error(`Unknown gateway type: ${type}`);
  return factory();
}

// Typed helpers kept for backwards compatibility and clarity at call sites.
function createPaymentGateway() { return createGateway('payment'); }
function createWeatherGateway()  { return createGateway('weather'); }
function createMapsGateway()     { return createGateway('maps'); }
function createParkingGateway() {
  if (process.env.USE_MOCK_PARKING === 'true') {
    return new MockParkingGateway();
  }
  return new OverpassParkingGateway();
}
function createTransitGateway() {
  return process.env.USE_MOCK_TRANSIT === 'true'
    ? new MockTransitGateway()
    : new TransitGateway();
}

module.exports = {
  createGateway,
  createPaymentGateway,
  createWeatherGateway,
  createMapsGateway,
  createParkingGateway,
  createTransitGateway,
};
