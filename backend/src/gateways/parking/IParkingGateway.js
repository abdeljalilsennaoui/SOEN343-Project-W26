/**
 * Parking Gateway Interface
 * Defines the contract for parking information services.
 * Implement this interface to integrate a real parking data provider.
 *
 * @interface IParkingGateway
 * @method getAvailableSpots(city) - Get available parking spots in a city
 * @method reserveSpot(spotId) - Reserve a parking spot
 */
class IParkingGateway {
  async getAvailableSpots(_city) {
    throw new Error('IParkingGateway.getAvailableSpots() must be implemented');
  }

  async reserveSpot(_spotId) {
    throw new Error('IParkingGateway.reserveSpot() must be implemented');
  }
}

module.exports = IParkingGateway;
