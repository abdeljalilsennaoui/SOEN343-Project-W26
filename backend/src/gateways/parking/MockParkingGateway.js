const IParkingGateway = require('./IParkingGateway');

class MockParkingGateway extends IParkingGateway {
  async getAvailableSpots(city) {
    return [
      { id: 'spot-1', facilityName: `${city} Central Parking`, pricePerHour: 3.5, status: 'AVAILABLE' },
      { id: 'spot-2', facilityName: `${city} Mall Parking`, pricePerHour: 2.0, status: 'AVAILABLE' },
      { id: 'spot-3', facilityName: `${city} Airport Parking`, pricePerHour: 5.0, status: 'AVAILABLE' },
    ];
  }

  async reserveSpot(spotId) {
    return {
      spotId,
      success: true,
      message: `Spot ${spotId} reserved successfully`,
    };
  }
}

module.exports = MockParkingGateway;
