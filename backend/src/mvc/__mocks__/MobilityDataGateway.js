/**
 * Manual Jest mock for MobilityDataGateway.
 * Placed adjacent to the real file so integration tests can call
 * jest.mock('../../src/mvc/MobilityDataGateway') without an inline factory.
 *
 * All methods are jest.fn() — tests set up return values with mockResolvedValue().
 */
module.exports = {
  // Bookings
  findBooking: jest.fn(),
  findBookingsByUser: jest.fn(),
  findAllBookings: jest.fn(),
  findActiveAndDraftBookings: jest.fn(),
  findActiveRideShares: jest.fn(),
  saveBooking: jest.fn(),
  updateBooking: jest.fn(),
  saveReceipt: jest.fn(),
  findReceiptByBooking: jest.fn(),

  // Vehicles
  findVehicles: jest.fn(),
  findAllVehicles: jest.fn(),
  findVehicle: jest.fn(),
  saveVehicle: jest.fn(),
  updateVehicle: jest.fn(),
  deactivateVehicle: jest.fn(),

  // Mobility options
  findMobilityOption: jest.fn(),
  findMobilityOptions: jest.fn(),
  saveMobilityOption: jest.fn(),
  removeMobilityOption: jest.fn(),

  // Users
  findUser: jest.fn(),
  saveUser: jest.fn(),

  // Parking
  findParkingFacilities: jest.fn(),
  findFacilityWithSpots: jest.fn(),
  findAvailableSpots: jest.fn(),
  reserveSpot: jest.fn(),
  releaseSpot: jest.fn(),
  findNearbyParkings: jest.fn(),

  // Analytics
  getRentalAnalytics: jest.fn(),
  getGatewayAnalytics: jest.fn(),
};
