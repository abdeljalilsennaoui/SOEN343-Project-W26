const IMapsGateway = require('./IMapsGateway');

class MockMapsGateway extends IMapsGateway {
  async geocode(address) {
    return {
      latitude: 45.5017 + Math.random() * 0.05,
      longitude: -73.5673 + Math.random() * 0.05,
      formattedAddress: address,
    };
  }

  async getDirections(from, to) {
    const distanceKm = Math.sqrt(
      Math.pow(to.latitude - from.latitude, 2) + Math.pow(to.longitude - from.longitude, 2),
    ) * 111;

    return {
      distanceKm: Math.round(distanceKm * 10) / 10,
      durationMin: Math.round(distanceKm * 3),
      steps: ['Head north', 'Turn right', 'Arrive at destination'],
    };
  }
}

module.exports = MockMapsGateway;
