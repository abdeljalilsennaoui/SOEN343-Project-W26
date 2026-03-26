/**
 * MobilityDataGateway — MVC Model (Data Access Interface)
 *
 * Acts as the single interface between MobilityService and the persistence layer.
 * All database access goes through this class — no service or handler touches
 * Firestore models directly.
 *
 * Delegates to individual Firestore model modules and applies MobilityDataMapper
 * to normalize raw records into domain entities.
 *
 * Flow: MobilityService → [MobilityDataGateway] → MobilityDataMapper → SUMMSDatabase
 */
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const MobilityOption = require('../models/MobilityOption');
const Parking = require('../models/Parking');
const PaymentReceipt = require('../models/PaymentReceipt');
const AnalyticsReport = require('../models/AnalyticsReport');
const MobilityDataMapper = require('./MobilityDataMapper');
const ParkingAdapter = require('../services/ParkingAdapter');

class MobilityDataGateway {
  // ── Bookings ──────────────────────────────────────────────────────────────

  async findBooking(id) {
    const doc = await Booking.findById(id);
    return doc ? MobilityDataMapper.toBooking(doc) : null;
  }

  async findBookingsByUser(userId) {
    const docs = await Booking.findByUserId(userId);
    return docs.map(MobilityDataMapper.toBooking);
  }

  async findAllBookings() {
    const docs = await Booking.findAll();
    return docs.map(MobilityDataMapper.toBooking);
  }

  async saveBooking(data) {
    return Booking.create(data);
  }

  async updateBooking(id, updates) {
    return Booking.update(id, updates);
  }

  // ── Vehicles ──────────────────────────────────────────────────────────────

  async findVehicles(filters = {}) {
    const docs = await Vehicle.getAvailableVehicles(filters.city, filters.type);
    return docs.map(MobilityDataMapper.toVehicle);
  }

  async findAllVehicles(filters = {}) {
    const docs = await Vehicle.findAll(filters);
    return docs.map(MobilityDataMapper.toVehicle);
  }

  async findVehicle(id) {
    const doc = await Vehicle.findById(id);
    return doc ? MobilityDataMapper.toVehicle(doc) : null;
  }

  async saveVehicle(data) {
    return Vehicle.create(data);
  }

  async updateVehicle(id, fields) {
    return Vehicle.update(id, fields);
  }

  async deactivateVehicle(id) {
    return Vehicle.deactivate(id);
  }

  // ── Users ─────────────────────────────────────────────────────────────────

  async findUser(uid) {
    const doc = await User.findByUid(uid);
    return doc ? MobilityDataMapper.toUser(doc) : null;
  }

  async saveUser(uid, data) {
    return User.upsert(uid, data);
  }

  // ── Mobility Options ──────────────────────────────────────────────────────

  async findMobilityOptions(filters = {}) {
    const docs = await MobilityOption.findAll(filters);
    return docs.map(MobilityDataMapper.toMobilityOption);
  }

  async findMobilityOption(id) {
    const doc = await MobilityOption.findById(id);
    return doc ? MobilityDataMapper.toMobilityOption(doc) : null;
  }

  // ── Parking ───────────────────────────────────────────────────────────────

  async findParkingFacilities(city) {
    return Parking.findAllFacilities(city);
  }

  async findFacilityWithSpots(facilityId) {
    const facility = await Parking.findFacilityById(facilityId);
    if (!facility) return null;
    const spots = await Parking.findSpotsByFacility(facilityId);
    return { facility, spots };
  }

  async findAvailableSpots(city) {
    return Parking.getAvailableSpots(city);
  }

  async reserveSpot(spotId) {
    return Parking.reserveSpot(spotId);
  }

  async releaseSpot(spotId) {
    return Parking.releaseSpot(spotId);
  }

  async findNearbyParkings(center, radius, maxResults) {
    return ParkingAdapter.getNearbySpots(center, radius, maxResults);
  }

  // ── Payment Receipts ──────────────────────────────────────────────────────

  async saveReceipt(data) {
    return PaymentReceipt.create(data);
  }

  async findReceiptByBooking(bookingId) {
    return PaymentReceipt.findByBookingId(bookingId);
  }

  // ── Analytics ─────────────────────────────────────────────────────────────

  async getRentalAnalytics() {
    return AnalyticsReport.getRentalAnalytics();
  }

  async getGatewayAnalytics() {
    return AnalyticsReport.getGatewayAnalytics();
  }
}

module.exports = new MobilityDataGateway();
