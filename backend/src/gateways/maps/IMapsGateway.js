/**
 * Maps Gateway Interface
 * Defines the contract for mapping and navigation services.
 * Implement this interface to integrate Google Maps API or similar.
 *
 * @interface IMapsGateway
 * @method geocode(address) - Convert address to coordinates
 * @method getDirections(from, to) - Get directions between two points
 */
class IMapsGateway {
  async geocode(_address) {
    throw new Error('IMapsGateway.geocode() must be implemented');
  }

  async getDirections(_from, _to) {
    throw new Error('IMapsGateway.getDirections() must be implemented');
  }
}

module.exports = IMapsGateway;
