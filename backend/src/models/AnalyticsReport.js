const { v4: uuidv4 } = require('uuid');
const db = require('../lib/firestore');

const col = db.collection('analytics');

async function trackEvent(type, city, metadata = null) {
  const event = {
    id: uuidv4(),
    type,
    city,
    createdAt: new Date().toISOString(),
    metadata,
  };
  await col.doc(event.id).set(event);
  return event;
}

async function findByCity(city) {
  const snap = await col.where('city', '==', city).get();
  return snap.docs.map((d) => d.data());
}

async function findByType(type) {
  const snap = await col.where('type', '==', type).get();
  return snap.docs.map((d) => d.data());
}

async function findAll() {
  const snap = await col.get();
  return snap.docs.map((d) => d.data());
}

async function getRentalAnalytics() {
  const snap = await col.where('type', '==', 'RESERVATION_CREATED').get();
  const rentalEvents = snap.docs.map((d) => d.data());

  const totalRentals = rentalEvents.length;
  const rentalsByCity = {};
  const rentalsByType = {};

  for (const event of rentalEvents) {
    const city = event.city || 'unknown';
    const type = event.metadata?.vehicleType || 'unknown';
    rentalsByCity[city] = (rentalsByCity[city] || 0) + 1;
    rentalsByType[type] = (rentalsByType[type] || 0) + 1;
  }

  return { totalRentals, rentalsByCity, rentalsByType };
}

module.exports = {
  trackEvent,
  findByCity,
  findByType,
  findAll,
  getRentalAnalytics,
};
