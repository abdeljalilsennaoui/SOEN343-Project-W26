/**
 * MobilityService — MVC Model (Business Logic)
 *
 * Contains all business logic for the SUMMS mobility system.
 * This is the heart of the Model layer — it enforces domain rules,
 * coordinates the rental lifecycle, provider operations, external service
 * access, and analytics.
 *
 * MobilityService never constructs HTTP responses and never imports
 * controllers or presenters — it is fully decoupled from the View layer.
 *
 * Flow: MobilityRequestHandler → [MobilityService] → MobilityDataGateway
 */
const MobilityDataGateway = require('./MobilityDataGateway');
const AvailabilityService = require('../services/AvailabilityService');
const PricingService = require('../services/PricingService');
const BookingStateMachine = require('../lib/BookingStateMachine');
const EventBus = require('../lib/EventBus');
const { createPaymentGateway, createTransitGateway } = require('../gateways');
const ApiError = require('../models/ApiError');
const { BookingStatus, ReceiptStatus, VehicleStatus, TripMode, UserRole } = require('../models/enums');
const { v4: uuidv4 } = require('uuid');

// Visitor Pattern — typed event objects (each carries accept() for double dispatch)
const ReservationCreatedEvent = require('../analytics/events/ReservationCreatedEvent');
const BookingConfirmedEvent = require('../analytics/events/BookingConfirmedEvent');
const PaymentProcessedEvent = require('../analytics/events/PaymentProcessedEvent');
const VehicleReturnedEvent = require('../analytics/events/VehicleReturnedEvent');
const ParkingReservedEvent = require('../analytics/events/ParkingReservedEvent');
const ParkingReleasedEvent = require('../analytics/events/ParkingReleasedEvent');
const TransitQueryEvent = require('../analytics/events/TransitQueryEvent');
const GatewayCallEvent = require('../analytics/events/GatewayCallEvent');
const RideJoinedEvent = require('../analytics/events/RideJoinedEvent');

const paymentGateway = createPaymentGateway();
const transitGateway = createTransitGateway();

const PROVIDER_TYPES = [TripMode.CAR_SHARING, TripMode.BIKE_SHARING, TripMode.SCOOTER_SHARING];

class MobilityService {

  // ── Rental Lifecycle ──────────────────────────────────────────────────────

  /**
   * List vehicles, optionally filtered by city and type.
   */
  async getVehicles({ city, type } = {}) {
    return MobilityDataGateway.findVehicles({ city, type });
  }

  /**
   * Search available mobility options matching the given criteria.
   * Returns all options sorted: available first, then by price ascending.
   */
  async searchVehicles({ city, type, maxPrice, startTime, endTime }) {
    const options = await MobilityDataGateway.findMobilityOptions({ city, type });

    // Single Firestore read for all bookings instead of N reads (one per option)
    const availMap = await AvailabilityService.checkAvailabilityBatch(options, startTime, endTime);

    const results = options.map((option) => {
      const avail = availMap.get(option.id) || { available: false, remaining: 0, capacity: 1, conflicting: 0 };
      const estimatedPrice = PricingService.calculatePrice(option, startTime, endTime);
      return {
        optionId: option.id,
        type: option.type,
        city: option.city,
        availability: avail.available,
        remaining: avail.remaining,
        capacity: avail.capacity,
        estimatedPrice,
        shortDescription: option.description,
      };
    });

    const filtered = maxPrice !== undefined ? results.filter((r) => r.estimatedPrice <= maxPrice) : results;
    filtered.sort((a, b) => (a.availability !== b.availability ? (a.availability ? -1 : 1) : a.estimatedPrice - b.estimatedPrice));
    return filtered;
  }

  /**
   * Create a DRAFT booking (reservation) for a commuter.
   */
  async createReservation({ userId, optionId, startTime, endTime, pickupLocation, rideSharing = false, maxPassengers = 0 }) {
    const option = await MobilityDataGateway.findMobilityOption(optionId);
    if (!option) throw new ApiError('OPTION_NOT_FOUND', `Mobility option ${optionId} not found`, 404);

    if (rideSharing && option.type !== TripMode.CAR_SHARING) {
      throw ApiError.badRequest('Ride sharing is only available for CAR_SHARING bookings.');
    }

    const avail = await AvailabilityService.checkAvailability(option, startTime, endTime);
    if (!avail.available) {
      throw new ApiError('BOOKING_NOT_AVAILABLE', `No units available (${avail.conflicting}/${avail.capacity} booked for this time window).`, 409);
    }

    const totalPrice = PricingService.calculatePrice(option, startTime, endTime);
    const clampedMax = Math.min(Math.max(0, maxPassengers), 3);
    const booking = await MobilityDataGateway.saveBooking({
      userId, optionId, startTime, endTime, pickupLocation, totalPrice,
      rideSharing, maxPassengers: clampedMax, passengers: [],
    });

    EventBus.emit('RESERVATION_CREATED', new ReservationCreatedEvent({
      city: option.city,
      vehicleType: option.type,
      optionId,
      userId,
      providerId: option.providerId || null,
    }));
    return booking;
  }

  /**
   * Process payment and confirm a DRAFT booking → ACTIVE.
   */
  async processPayment(draftId, userId, paymentDetails) {
    const booking = await MobilityDataGateway.findBooking(draftId);
    if (!booking) throw new ApiError('BOOKING_NOT_FOUND', `Booking ${draftId} not found`, 404);
    if (booking.userId !== userId) throw new ApiError('FORBIDDEN', 'You are not authorized to confirm this booking.', 403);

    // State pattern: validate DRAFT → ACTIVE is a legal transition before proceeding
    new BookingStateMachine(booking.status).toActive();

    const option = await MobilityDataGateway.findMobilityOption(booking.optionId);
    if (!option || !(await AvailabilityService.isAvailable(option, booking.startTime, booking.endTime, draftId))) {
      throw new ApiError('BOOKING_NOT_AVAILABLE', 'Selected option is no longer available.', 409);
    }

    const gatewayResult = await paymentGateway.charge(booking.totalPrice, paymentDetails);

    if (!gatewayResult.success) {
      // State pattern: validate DRAFT → FAILED is a legal transition
      new BookingStateMachine(booking.status).toFailed();
      await MobilityDataGateway.updateBooking(draftId, { status: BookingStatus.FAILED });
      await MobilityDataGateway.saveReceipt({ bookingId: draftId, amount: booking.totalPrice, providerRef: gatewayResult.transactionId, status: ReceiptStatus.FAILED });
      throw new ApiError('PAYMENT_FAILED', gatewayResult.message || 'Payment was declined.', 402);
    }

    const updatedBooking = await MobilityDataGateway.updateBooking(draftId, { status: BookingStatus.ACTIVE });
    const receipt = await MobilityDataGateway.saveReceipt({ bookingId: draftId, amount: booking.totalPrice, providerRef: gatewayResult.transactionId, status: ReceiptStatus.SUCCESS });

    EventBus.emit('BOOKING_CONFIRMED', new BookingConfirmedEvent({ city: option.city, bookingId: draftId, type: option.type, amount: booking.totalPrice }));
    EventBus.emit('PAYMENT_PROCESSED', new PaymentProcessedEvent({ city: option.city, bookingId: draftId, amount: booking.totalPrice }));

    return { booking: updatedBooking, receipt };
  }

  /**
   * Mark a booking COMPLETE — vehicle returned.
   */
  async returnVehicle(bookingId, userId) {
    const booking = await MobilityDataGateway.findBooking(bookingId);
    if (!booking) throw new ApiError('BOOKING_NOT_FOUND', `Booking ${bookingId} not found`, 404);
    if (booking.userId !== userId) throw new ApiError('FORBIDDEN', 'You are not authorized to complete this booking.', 403);
    if (booking.status === BookingStatus.COMPLETE) return booking;

    // State pattern: validate ACTIVE → COMPLETE is a legal transition
    new BookingStateMachine(booking.status).toComplete();
    const completed = await MobilityDataGateway.updateBooking(bookingId, { status: BookingStatus.COMPLETE });
    EventBus.emit('VEHICLE_RETURNED', new VehicleReturnedEvent({ city: null, bookingId }));
    return completed;
  }

  /**
   * Retrieve all bookings belonging to a user.
   */
  async getMyBookings(userId) {
    return MobilityDataGateway.findBookingsByUser(userId);
  }

  // ── Provider Vehicle Management ───────────────────────────────────────────

  /**
   * Add a new vehicle for a mobility provider.
   */
  async addVehicle(providerId, { city, type, pricePerMin, lat, lng, description }) {
    if (!PROVIDER_TYPES.includes(type)) {
      throw ApiError.badRequest(`Invalid vehicle type: ${type}. Must be one of: ${PROVIDER_TYPES.join(', ')}`);
    }
    const vehicle = await MobilityDataGateway.saveVehicle({ city, type, pricePerMin, providerId, lat, lng, description: description || '' });
    // Create a matching mobilityOption so the vehicle appears in search and on the map.
    // capacity=1 means one concurrent booking per provider-added vehicle.
    await MobilityDataGateway.saveMobilityOption({
      id: vehicle.id,
      type,
      city,
      basePrice: pricePerMin,
      capacity: 1,
      description: description || `${type.replace('_', ' ')} in ${city}`,
      providerId,
    });
    return vehicle;
  }

  /**
   * Update fields of an existing vehicle. Enforces ownership.
   */
  async updateVehicle(vehicleId, providerId, fields, role) {
    const vehicle = await MobilityDataGateway.findVehicle(vehicleId);
    if (!vehicle) throw ApiError.notFound(`Vehicle ${vehicleId} not found`);
    const isAdmin = role === UserRole.CITY_ADMINISTRATOR || role === UserRole.SYSTEM_ADMINISTRATOR;
    if (!isAdmin && vehicle.providerId !== providerId) throw ApiError.forbidden('You do not own this vehicle');
    return MobilityDataGateway.updateVehicle(vehicleId, fields);
  }

  /**
   * Deactivate (soft-delete) a vehicle. Enforces ownership.
   */
  async removeVehicle(vehicleId, providerId, role) {
    const vehicle = await MobilityDataGateway.findVehicle(vehicleId);
    if (!vehicle) throw ApiError.notFound(`Vehicle ${vehicleId} not found`);
    const isAdmin = role === UserRole.CITY_ADMINISTRATOR || role === UserRole.SYSTEM_ADMINISTRATOR;
    if (!isAdmin && vehicle.providerId !== providerId) throw ApiError.forbidden('You do not own this vehicle');
    if (vehicle.status === VehicleStatus.OUT_OF_SERVICE) return vehicle;
    // Remove the paired mobilityOption so it disappears from search.
    await MobilityDataGateway.removeMobilityOption(vehicleId).catch(() => {});
    return MobilityDataGateway.deactivateVehicle(vehicleId);
  }

  /**
   * List all vehicles owned by a specific provider.
   */
  async getProviderVehicles(providerId, role) {
    if (role === UserRole.CITY_ADMINISTRATOR || role === UserRole.SYSTEM_ADMINISTRATOR) {
      return MobilityDataGateway.findAllVehicles();
    }
    return MobilityDataGateway.findAllVehicles({ providerId });
  }

  // ── Parking Access ────────────────────────────────────────────────────────

  async getParkingFacilities(city) {
    EventBus.emit('GATEWAY_CALL', new GatewayCallEvent({ service: 'parking', operation: 'getFacilities', success: true }));
    return MobilityDataGateway.findParkingFacilities(city);
  }

  async getFacilityWithSpots(facilityId) {
    EventBus.emit('GATEWAY_CALL', new GatewayCallEvent({ service: 'parking', operation: 'getFacilitySpots', success: true }));
    return MobilityDataGateway.findFacilityWithSpots(facilityId);
  }

  async getAvailableSpots(city) {
    EventBus.emit('GATEWAY_CALL', new GatewayCallEvent({ service: 'parking', operation: 'getAvailableSpots', success: true }));
    return MobilityDataGateway.findAvailableSpots(city);
  }

  async reserveParkingSpot(spotId) {
    const spot = await MobilityDataGateway.reserveSpot(spotId);
    EventBus.emit('PARKING_RESERVED', new ParkingReservedEvent({ city: spot.city || null, spotId }));
    return spot;
  }

  async releaseParkingSpot(spotId) {
    const spot = await MobilityDataGateway.releaseSpot(spotId);
    EventBus.emit('PARKING_RELEASED', new ParkingReleasedEvent({ city: spot.city || null, spotId }));
    return spot;
  }

  async getNearbyParkings(center, radius, maxResults) {
    const spots = await MobilityDataGateway.findNearbyParkings(center, radius, maxResults);
    return spots;
  }

  // ── Transit Access ────────────────────────────────────────────────────────

  async getTransitSchedule(city, line = null) {
    EventBus.emit('TRANSIT_QUERY', new TransitQueryEvent({ city, line }));
    EventBus.emit('GATEWAY_CALL', new GatewayCallEvent({ service: 'transit', operation: 'getSchedule', success: true }));

    const raw = await transitGateway.getSchedule(city, line);

    return raw.map((e) => {
      if (e.trips) {
        return {
          city: e.city,
          line: e.line,
          name: e.name,
          type: e.type,
          color: e.color,
          tripsCount: e.tripsCount,
          trips: e.trips,
        };
      }

      return {
        city: e.city,
        line: e.line,
        name: e.name,
        type: e.type,
        color: e.color,
        nextArrivals: e.nextArrivals,
        status: e.status,
      };
    });
  }

  async getNearbyStops(lat, lng) {
    EventBus.emit('GATEWAY_CALL', new GatewayCallEvent({ service: 'transit', operation: 'getNearbyStops', success: true }));
    const raw = await transitGateway.getNearbyStops(lat, lng);
    return raw.map((s) => ({ id: s.id, name: s.name, distanceKm: s.distance, coordinates: { lat: s.latitude, lng: s.longitude } }));
  }

  // ── Analytics ─────────────────────────────────────────────────────────────

  async getRentalAnalytics(userId, role) {
    return MobilityDataGateway.getRentalAnalytics(userId, role);
  }

  async getGatewayAnalytics() {
    return MobilityDataGateway.getGatewayAnalytics();
  }

  // ── Ride Sharing ──────────────────────────────────────────────────────────

  async getActiveRideShares() {
    return MobilityDataGateway.findActiveRideShares();
  }

  async joinRide(bookingId, userId) {
    const booking = await MobilityDataGateway.findBooking(bookingId);
    if (!booking) throw new ApiError('BOOKING_NOT_FOUND', `Booking ${bookingId} not found`, 404);
    if (booking.status !== BookingStatus.ACTIVE) throw ApiError.badRequest('This ride is not currently active.');
    if (!booking.rideSharing) throw ApiError.badRequest('This booking does not offer ride sharing.');
    if (booking.userId === userId) throw ApiError.forbidden('Driver cannot join their own ride.');
    if (booking.passengers.includes(userId)) throw ApiError.conflict('You have already joined this ride.');
    if (booking.passengers.length >= booking.maxPassengers) throw ApiError.conflict('This ride is full.');

    const updated = await MobilityDataGateway.updateBooking(bookingId, {
      passengers: [...booking.passengers, userId],
    });

    EventBus.emit('RIDE_JOINED', new RideJoinedEvent({ bookingId, passengerId: userId }));
    return updated;
  }

  async leaveRide(bookingId, userId) {
    const booking = await MobilityDataGateway.findBooking(bookingId);
    if (!booking) throw new ApiError('BOOKING_NOT_FOUND', `Booking ${bookingId} not found`, 404);
    if (!booking.passengers.includes(userId)) throw ApiError.badRequest('You are not a passenger on this ride.');

    return MobilityDataGateway.updateBooking(bookingId, {
      passengers: booking.passengers.filter((id) => id !== userId),
    });
  }
}

module.exports = new MobilityService();
