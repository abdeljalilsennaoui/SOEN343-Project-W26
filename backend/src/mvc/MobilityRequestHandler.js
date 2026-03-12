/**
 * MobilityRequestHandler — MVC Model (Request Coordinator)
 *
 * Receives MobilityRequest objects from MobilityController and routes each
 * request to the appropriate MobilityService operation.
 * Returns a MobilityResponse to the controller.
 *
 * This class coordinates use case execution — it does not contain business
 * logic itself. All domain rules live in MobilityService.
 *
 * Flow: MobilityController → [MobilityRequestHandler] → MobilityService → MobilityResponse
 */
const MobilityService = require('./MobilityService');
const MobilityResponse = require('./MobilityResponse');

class MobilityRequestHandler {
  /**
   * Dispatch a MobilityRequest to the correct MobilityService method.
   * Returns a MobilityResponse in all cases (success or failure).
   *
   * @param {import('./MobilityRequest')} request
   * @returns {Promise<MobilityResponse>}
   */
  async handle(request) {
    const { type, userId, payload } = request;

    switch (type) {

      // ── Vehicles ────────────────────────────────────────────────────────
      case 'GET_VEHICLES':
        return MobilityResponse.ok(await MobilityService.getVehicles(payload));

      // ── Rental lifecycle ────────────────────────────────────────────────
      case 'SEARCH_OPTIONS':
        return MobilityResponse.ok(await MobilityService.searchVehicles(payload));

      case 'CREATE_BOOKING_DRAFT': {
        const draft = await MobilityService.createReservation({ userId, ...payload });
        return MobilityResponse.created(draft);
      }

      case 'CONFIRM_BOOKING':
        return MobilityResponse.ok(
          await MobilityService.processPayment(payload.draftId, userId, payload.paymentDetails)
        );

      case 'COMPLETE_BOOKING':
        return MobilityResponse.ok(
          await MobilityService.returnVehicle(payload.bookingId, userId)
        );

      case 'GET_MY_BOOKINGS':
        return MobilityResponse.ok(await MobilityService.getMyBookings(userId));

      // ── Provider vehicle management ─────────────────────────────────────
      case 'GET_PROVIDER_VEHICLES':
        return MobilityResponse.ok(await MobilityService.getProviderVehicles(userId));

      case 'ADD_VEHICLE': {
        const vehicle = await MobilityService.addVehicle(userId, payload);
        return MobilityResponse.created(vehicle);
      }

      case 'UPDATE_VEHICLE':
        return MobilityResponse.ok(
          await MobilityService.updateVehicle(payload.vehicleId, userId, payload.fields)
        );

      case 'DEACTIVATE_VEHICLE':
        return MobilityResponse.ok(
          await MobilityService.removeVehicle(payload.vehicleId, userId)
        );

      // ── Parking ─────────────────────────────────────────────────────────
      case 'GET_PARKING_FACILITIES':
        return MobilityResponse.ok(await MobilityService.getParkingFacilities(payload.city));

      case 'GET_FACILITY_SPOTS': {
        const result = await MobilityService.getFacilityWithSpots(payload.facilityId);
        if (!result) return MobilityResponse.fail({ code: 'NOT_FOUND', message: 'Facility not found' }, 404);
        return MobilityResponse.ok(result);
      }

      case 'GET_AVAILABLE_SPOTS':
        return MobilityResponse.ok(await MobilityService.getAvailableSpots(payload.city));

      case 'RESERVE_PARKING_SPOT':
        return MobilityResponse.ok(await MobilityService.reserveParkingSpot(payload.spotId));

      case 'RELEASE_PARKING_SPOT':
        return MobilityResponse.ok(await MobilityService.releaseParkingSpot(payload.spotId));

      // ── Transit ─────────────────────────────────────────────────────────
      case 'GET_TRANSIT_SCHEDULE':
        return MobilityResponse.ok(
          await MobilityService.getTransitSchedule(payload.city, payload.line || null)
        );

      case 'GET_NEARBY_STOPS':
        return MobilityResponse.ok(
          await MobilityService.getNearbyStops(payload.lat, payload.lng)
        );

      // ── Analytics ───────────────────────────────────────────────────────
      case 'GET_RENTAL_ANALYTICS':
        return MobilityResponse.ok(await MobilityService.getRentalAnalytics());

      case 'GET_GATEWAY_ANALYTICS':
        return MobilityResponse.ok(await MobilityService.getGatewayAnalytics());

      default:
        return MobilityResponse.fail(`Unknown request type: ${type}`, 400);
    }
  }
}

module.exports = new MobilityRequestHandler();
