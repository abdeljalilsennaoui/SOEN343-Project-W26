const { v4: uuidv4 } = require('uuid');
const { ReservationStatus } = require('./enums');
const ApiError = require('./ApiError');
const Vehicle = require('./Vehicle');

/**
 * Reservation Model — data, storage, and business logic (MVC pattern)
 *
 * @typedef {Object} Reservation
 * @property {string} id
 * @property {string} userId
 * @property {string} vehicleId
 * @property {string} status - ReservationStatus enum value
 * @property {string} startTime - ISO date string
 * @property {string} [endTime] - ISO date string
 */

// In-memory storage
const reservations = new Map();

// Data access methods
function create({ userId, vehicleId, status, startTime }) {
  const id = uuidv4();
  const reservation = { id, userId, vehicleId, status, startTime, endTime: null };
  reservations.set(id, reservation);
  return reservation;
}

function findById(id) {
  return reservations.get(id) || null;
}

function findByUserId(userId) {
  return Array.from(reservations.values()).filter((r) => r.userId === userId);
}

function update(id, updates) {
  const reservation = reservations.get(id);
  if (!reservation) return null;
  const updated = { ...reservation, ...updates };
  reservations.set(id, updated);
  return updated;
}

// Business logic
function createReservation(userId, vehicleId) {
  Vehicle.reserveVehicle(vehicleId);

  return create({
    userId,
    vehicleId,
    status: ReservationStatus.ACTIVE,
    startTime: new Date().toISOString(),
  });
}

function getReservation(id) {
  const reservation = findById(id);
  if (!reservation) throw ApiError.notFound(`Reservation ${id} not found`);
  return reservation;
}

function getUserReservations(userId) {
  return findByUserId(userId);
}

function completeReservation(id) {
  const reservation = findById(id);
  if (!reservation) throw ApiError.notFound(`Reservation ${id} not found`);
  if (reservation.status === ReservationStatus.COMPLETED) {
    throw ApiError.conflict(`Reservation ${id} is already completed`);
  }

  Vehicle.releaseVehicle(reservation.vehicleId);

  return update(id, {
    status: ReservationStatus.COMPLETED,
    endTime: new Date().toISOString(),
  });
}

module.exports = {
  create,
  findById,
  findByUserId,
  update,
  createReservation,
  getReservation,
  getUserReservations,
  completeReservation,
};
