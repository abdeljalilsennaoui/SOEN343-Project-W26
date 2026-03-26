const { v4: uuidv4 } = require('uuid');
const { BookingStatus } = require('./enums');
const db = require('../lib/firestore');

const col = db.collection('bookings');

async function create({ userId, optionId, startTime, endTime, pickupLocation, totalPrice }) {
  const now = new Date().toISOString();
  const id = uuidv4();
  const booking = {
    id,
    userId,
    optionId,
    startTime,
    endTime,
    pickupLocation,
    totalPrice,
    status: BookingStatus.DRAFT,
    createdAt: now,
    updatedAt: now,
  };
  await col.doc(id).set(booking);
  return booking;
}

async function findById(id) {
  const snap = await col.doc(id).get();
  return snap.exists ? snap.data() : null;
}

async function findByUserId(userId) {
  const snap = await col.where('userId', '==', userId).get();
  return snap.docs.map((d) => d.data());
}

async function findAll() {
  const snap = await col.get();
  return snap.docs.map((d) => d.data());
}

async function findActiveAndDraft() {
  const [draftSnap, activeSnap] = await Promise.all([
    col.where('status', '==', 'DRAFT').get(),
    col.where('status', '==', 'ACTIVE').get(),
  ]);
  return [...draftSnap.docs, ...activeSnap.docs].map((d) => d.data());
}

async function update(id, updates) {
  const booking = await findById(id);
  if (!booking) return null;
  const updated = { ...booking, ...updates, updatedAt: new Date().toISOString() };
  await col.doc(id).set(updated);
  return updated;
}

module.exports = {
  create,
  findById,
  findByUserId,
  findAll,
  findActiveAndDraft,
  update,
};
