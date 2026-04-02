/**
 * MobilityController — MVC Controller
 *
 * The central controller of the SUMMS system.
 * Receives HTTP requests from routes, creates a MobilityRequest, delegates
 * processing to MobilityRequestHandler, and forwards the MobilityResponse
 * to MobilityPresenter for formatting before sending to the View.
 *
 * Rules enforced here:
 * - No business logic — only request orchestration
 * - userId always taken from req.uid (Firebase token) — never from req.body
 * - All domain work delegated to MobilityRequestHandler → MobilityService
 *
 * Flow: Route → [MobilityController] → MobilityRequest
 *                                     → MobilityRequestHandler
 *                                     → MobilityResponse
 *                                     → MobilityPresenter → View
 */
const MobilityRequest = require('./MobilityRequest');
const MobilityRequestHandler = require('./MobilityRequestHandler');
const MobilityPresenter = require('./MobilityPresenter');

class MobilityController {
  /**
   * Internal helper: build a MobilityRequest, handle it, present the result.
   */
  async _dispatch(type, userId, payload, res, next) {
    try {
      const request = new MobilityRequest(type, userId, payload);
      const response = await MobilityRequestHandler.handle(request);
      const viewModel = MobilityPresenter.present(response);
      res.status(response.statusCode).json(viewModel);
    } catch (err) {
      next(err);
    }
  }

  // ── Vehicles ──────────────────────────────────────────────────────────────

  async getVehicles(req, res, next) {
    await this._dispatch(MobilityRequest.TYPES.GET_VEHICLES, req.uid, req.query, res, next);
  }

  // ── Rental Lifecycle ──────────────────────────────────────────────────────

  async searchOptions(req, res, next) {
    await this._dispatch(MobilityRequest.TYPES.SEARCH_OPTIONS, req.uid, req.query, res, next);
  }

  async createDraft(req, res, next) {
    await this._dispatch(MobilityRequest.TYPES.CREATE_BOOKING_DRAFT, req.uid, req.body, res, next);
  }

  async confirmDraft(req, res, next) {
    await this._dispatch(MobilityRequest.TYPES.CONFIRM_BOOKING, req.uid, {
      draftId: req.params.draftId,
      paymentDetails: req.body.paymentDetails,
    }, res, next);
  }

  async completeBooking(req, res, next) {
    await this._dispatch(MobilityRequest.TYPES.COMPLETE_BOOKING, req.uid, {
      bookingId: req.params.bookingId,
    }, res, next);
  }

  async getMyBookings(req, res, next) {
    await this._dispatch(MobilityRequest.TYPES.GET_MY_BOOKINGS, req.uid, {}, res, next);
  }

  // ── Provider Vehicle Management ───────────────────────────────────────────

  async getProviderVehicles(req, res, next) {
    await this._dispatch(MobilityRequest.TYPES.GET_PROVIDER_VEHICLES, req.uid, { role: req.role }, res, next);
  }

  async addVehicle(req, res, next) {
    await this._dispatch(MobilityRequest.TYPES.ADD_VEHICLE, req.uid, req.body, res, next);
  }

  async updateVehicle(req, res, next) {
    await this._dispatch(MobilityRequest.TYPES.UPDATE_VEHICLE, req.uid, {
      vehicleId: req.params.vehicleId,
      fields: req.body,
    }, res, next);
  }

  async deactivateVehicle(req, res, next) {
    await this._dispatch(MobilityRequest.TYPES.DEACTIVATE_VEHICLE, req.uid, {
      vehicleId: req.params.vehicleId,
    }, res, next);
  }

  // ── Parking ───────────────────────────────────────────────────────────────

  async getParkingFacilities(req, res, next) {
    await this._dispatch(MobilityRequest.TYPES.GET_PARKING_FACILITIES, req.uid, {
      city: req.query.city,
    }, res, next);
  }

  async getFacilitySpots(req, res, next) {
    await this._dispatch(MobilityRequest.TYPES.GET_FACILITY_SPOTS, req.uid, {
      facilityId: req.params.facilityId,
    }, res, next);
  }

  async getAvailableSpots(req, res, next) {
    await this._dispatch(MobilityRequest.TYPES.GET_AVAILABLE_SPOTS, req.uid, {
      city: req.query.city,
    }, res, next);
  }

  async reserveParkingSpot(req, res, next) {
    await this._dispatch(MobilityRequest.TYPES.RESERVE_PARKING_SPOT, req.uid, {
      spotId: req.body.spotId,
    }, res, next);
  }

  async releaseParkingSpot(req, res, next) {
    await this._dispatch(MobilityRequest.TYPES.RELEASE_PARKING_SPOT, req.uid, {
      spotId: req.body.spotId,
    }, res, next);
  }

  async getNearbyParkings(req, res, next) {
    await this._dispatch(MobilityRequest.TYPES.GET_NEARBY_PARKINGS, req.uid, {
      lat: Number(req.query.lat),
      lng: Number(req.query.lng),
      radius: Number(req.query.radius),
      maxResults: Number(req.query.maxResults),
    }, res, next);
  }

  // ── Transit ───────────────────────────────────────────────────────────────

  async getTransitSchedule(req, res, next) {
    await this._dispatch(MobilityRequest.TYPES.GET_TRANSIT_SCHEDULE, req.uid, {
      city: req.query.city,
      line: req.query.line || null,
    }, res, next);
  }

  async getNearbyStops(req, res, next) {
    await this._dispatch(MobilityRequest.TYPES.GET_NEARBY_STOPS, req.uid, {
      lat: parseFloat(req.query.lat),
      lng: parseFloat(req.query.lng),
    }, res, next);
  }

  // ── Analytics ─────────────────────────────────────────────────────────────

  async getRentalAnalytics(req, res, next) {
    await this._dispatch(MobilityRequest.TYPES.GET_RENTAL_ANALYTICS, req.uid, { role: req.role }, res, next);
  }

  async getGatewayAnalytics(req, res, next) {
    await this._dispatch(MobilityRequest.TYPES.GET_GATEWAY_ANALYTICS, req.uid, {}, res, next);
  }

  // ── Ride Sharing ──────────────────────────────────────────────────────────

  async listRideShares(req, res, next) {
    await this._dispatch(MobilityRequest.TYPES.LIST_RIDE_SHARES, req.uid, {}, res, next);
  }

  async joinRide(req, res, next) {
    await this._dispatch(MobilityRequest.TYPES.JOIN_RIDE, req.uid, {
      bookingId: req.params.bookingId,
    }, res, next);
  }

  async leaveRide(req, res, next) {
    await this._dispatch(MobilityRequest.TYPES.LEAVE_RIDE, req.uid, {
      bookingId: req.params.bookingId,
    }, res, next);
  }
}

module.exports = new MobilityController();
