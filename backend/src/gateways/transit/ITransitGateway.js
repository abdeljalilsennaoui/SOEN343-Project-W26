/**
 * Transit Gateway Interface
 * Defines the contract for public transportation data services.
 * Implement this interface to integrate a real transit API (e.g., STM).
 *
 * @interface ITransitGateway
 * @method getSchedule(city, line) - Get transit schedule
 * @method getNearbyStops(latitude, longitude) - Get nearby stops/stations
 */
class ITransitGateway {
  async getSchedule(_city, _line) {
    throw new Error('ITransitGateway.getSchedule() must be implemented');
  }

  async getNearbyStops(_latitude, _longitude) {
    throw new Error('ITransitGateway.getNearbyStops() must be implemented');
  }
}

module.exports = ITransitGateway;
