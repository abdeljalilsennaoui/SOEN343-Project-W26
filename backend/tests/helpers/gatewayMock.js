/**
 * Factory for the MobilityDataGateway mock factory function.
 * Pass this as the second argument to jest.mock().
 *
 * Usage:
 *   jest.mock('../../src/mvc/MobilityDataGateway', gatewayMockFactory);
 */
function gatewayMockFactory() {
  return {
    findMobilityOption: jest.fn(),
    findMobilityOptions: jest.fn(),
    findActiveAndDraftBookings: jest.fn(),
    findBooking: jest.fn(),
    findBookingsByUser: jest.fn(),
    findAllBookings: jest.fn(),
    findActiveRideShares: jest.fn(),
    saveBooking: jest.fn(),
    updateBooking: jest.fn(),
    saveReceipt: jest.fn(),
    findReceiptByBooking: jest.fn(),
    findVehicles: jest.fn(),
    findAllVehicles: jest.fn(),
    findVehicle: jest.fn(),
    saveVehicle: jest.fn(),
    updateVehicle: jest.fn(),
    deactivateVehicle: jest.fn(),
    saveMobilityOption: jest.fn(),
    removeMobilityOption: jest.fn(),
    findParkingFacilities: jest.fn(),
    findFacilityWithSpots: jest.fn(),
    findAvailableSpots: jest.fn(),
    reserveSpot: jest.fn(),
    releaseSpot: jest.fn(),
    findNearbyParkings: jest.fn(),
    findUser: jest.fn(),
    saveUser: jest.fn(),
    getRentalAnalytics: jest.fn(),
    getGatewayAnalytics: jest.fn(),
  };
}

module.exports = gatewayMockFactory;
