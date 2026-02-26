const { v4: uuidv4 } = require('uuid');
const { ReservationStatus } = require('./enums');
const ApiError = require('./ApiError');
const Vehicle = require('./Vehicle');
const db = require('../lib/firestore');

const col = db.collection('reservations');

async function create({ userId, vehicleId, status, startTime }) {
  const id = uuidv4();
  const reservation = { id, userId, vehicleId, status, startTime, endTime: null };
  await col.doc(id).set(reservation);
  return reservation;
}

async function findById(id) {
  const snap = await col.doc(id).get();
  return snap.exists ? snap.data() : null;
}

async function findByUserId(userId) {
  const snap = await col.where('userId', '==', userId).get();
  return snap.docs.map((d) => d.data());
}

async function update(id, updates) {
  const reservation = await findById(id);
  if (!reservation) return null;
  const updated = { ...reservation, ...updates };
  await col.doc(id).set(updated);
  return updated;
}

async function createReservation(userId, vehicleId) {
  await Vehicle.reserveVehicle(vehicleId);
  return create({
    userId,
    vehicleId,
    status: ReservationStatus.ACTIVE,
    startTime: new Date().toISOString(),
  });
}

async function getReservation(id) {
  const reservation = await findById(id);
  if (!reservation) throw ApiError.notFound(`Reservation ${id} not found`);
  return reservation;
}

async function getUserReservations(userId) {
  return findByUserId(userId);
}

async function completeReservation(id) {
  const reservation = await findById(id);
  if (!reservation) throw ApiError.notFound(`Reservation ${id} not found`);
  if (reservation.status === ReservationStatus.COMPLETED) {
    throw ApiError.conflict(`Reservation ${id} is already completed`);
  }
  await Vehicle.releaseVehicle(reservation.vehicleId);
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
