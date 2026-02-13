const MockPaymentGateway = require('./payment/MockPaymentGateway');
const MockWeatherGateway = require('./weather/MockWeatherGateway');
const MockMapsGateway = require('./maps/MockMapsGateway');
const MockParkingGateway = require('./parking/MockParkingGateway');
const MockTransitGateway = require('./transit/MockTransitGateway');

function createPaymentGateway() {
  return new MockPaymentGateway();
}

function createWeatherGateway() {
  return new MockWeatherGateway();
}

function createMapsGateway() {
  return new MockMapsGateway();
}

function createParkingGateway() {
  return new MockParkingGateway();
}

function createTransitGateway() {
  return new MockTransitGateway();
}

module.exports = {
  createPaymentGateway,
  createWeatherGateway,
  createMapsGateway,
  createParkingGateway,
  createTransitGateway,
};
