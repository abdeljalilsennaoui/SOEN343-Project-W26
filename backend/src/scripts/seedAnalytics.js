/**
 * Seed demo analytics events so the Analytics dashboard is populated
 * without requiring manual bookings first.
 *
 * Usage: node src/scripts/seedAnalytics.js
 * Safe to run multiple times — checks for existing data first.
 */
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const db = require('../lib/firestore');

const col = db.collection('analytics');

const CITIES = ['Montreal', 'Toronto', 'Vancouver'];
const VEHICLE_TYPES = ['BIKE_SHARING', 'SCOOTER_SHARING', 'CAR_SHARING'];
const SERVICES = ['payment', 'transit', 'parking'];

function event(type, city, metadata = {}) {
  return {
    id: uuidv4(),
    type,
    city,
    metadata,
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

async function seed() {
  const existing = await col.limit(1).get();
  if (!existing.empty) {
    console.log('analytics: already has data, skipping seed.');
    process.exit(0);
  }

  const batch = db.batch();
  let count = 0;

  // Rental events — RESERVATION_CREATED (shows on rental analytics)
  for (let i = 0; i < 18; i++) {
    const city = CITIES[i % CITIES.length];
    const type = VEHICLE_TYPES[i % VEHICLE_TYPES.length];
    const e = event('RESERVATION_CREATED', city, { vehicleType: type, optionId: uuidv4(), userId: 'demo' });
    batch.set(col.doc(e.id), e);
    count++;
  }

  // Booking confirmed events
  for (let i = 0; i < 12; i++) {
    const city = CITIES[i % CITIES.length];
    const type = VEHICLE_TYPES[i % VEHICLE_TYPES.length];
    const e = event('BOOKING_CONFIRMED', city, { bookingId: uuidv4(), type, amount: +(Math.random() * 20 + 5).toFixed(2) });
    batch.set(col.doc(e.id), e);
    count++;
  }

  // Payment processed events
  for (let i = 0; i < 12; i++) {
    const city = CITIES[i % CITIES.length];
    const e = event('PAYMENT_PROCESSED', city, { bookingId: uuidv4(), amount: +(Math.random() * 20 + 5).toFixed(2) });
    batch.set(col.doc(e.id), e);
    count++;
  }

  // Gateway call events — shows on gateway analytics
  for (let i = 0; i < 30; i++) {
    const service = SERVICES[i % SERVICES.length];
    const city = CITIES[i % CITIES.length];
    const e = event('GATEWAY_CALL', city, { service, operation: 'query', success: true });
    batch.set(col.doc(e.id), e);
    count++;
  }

  // Transit queries
  for (let i = 0; i < 8; i++) {
    const city = CITIES[i % CITIES.length];
    const e = event('TRANSIT_QUERY', city, { line: `${i + 1}` });
    batch.set(col.doc(e.id), e);
    count++;
  }

  // Parking reservations
  for (let i = 0; i < 6; i++) {
    const city = CITIES[i % CITIES.length];
    const e = event('PARKING_RESERVED', city, { spotId: uuidv4() });
    batch.set(col.doc(e.id), e);
    count++;
  }

  await batch.commit();
  console.log(`analytics: seeded ${count} events.`);
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
