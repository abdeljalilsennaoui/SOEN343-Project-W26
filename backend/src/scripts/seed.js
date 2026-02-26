/**
 * One-time seed script — run with:  node src/scripts/seed.js
 *
 * Populates Firestore with vehicles and mobility options.
 * Idempotent: skips seeding if documents already exist.
 */

require('dotenv').config();

const { v4: uuidv4 } = require('uuid');
const admin = require('../lib/firebaseAdmin');
const db = admin.firestore();

const { TripMode, VehicleStatus } = require('../models/enums');

// ─── Vehicles ─────────────────────────────────────────────────────────────────

async function seedVehicles() {
  const col = db.collection('vehicles');
  const existing = await col.limit(1).get();
  if (!existing.empty) {
    console.log('vehicles: already seeded, skipping.');
    return;
  }

  const cities = ['Montreal', 'Toronto', 'Vancouver'];
  const types = [TripMode.BIKE_SHARING, TripMode.SCOOTER_SHARING, TripMode.CAR_SHARING];
  const prices = {
    [TripMode.BIKE_SHARING]: 0.15,
    [TripMode.SCOOTER_SHARING]: 0.25,
    [TripMode.CAR_SHARING]: 0.50,
  };

  const batch = db.batch();
  let count = 0;

  for (const city of cities) {
    for (const type of types) {
      for (let i = 0; i < 3; i++) {
        const id = uuidv4();
        batch.set(col.doc(id), {
          id,
          type,
          city,
          status: VehicleStatus.AVAILABLE,
          pricePerMin: prices[type],
          providerId: null,
        });
        count++;
      }
    }
  }

  await batch.commit();
  console.log(`vehicles: seeded ${count} documents.`);
}

// ─── Mobility Options ─────────────────────────────────────────────────────────

async function seedMobilityOptions() {
  const col = db.collection('mobilityOptions');
  const existing = await col.limit(1).get();
  if (!existing.empty) {
    console.log('mobilityOptions: already seeded, skipping.');
    return;
  }

  const cities = ['Montreal', 'Toronto', 'Vancouver'];
  const types = [TripMode.BIKE_SHARING, TripMode.SCOOTER_SHARING, TripMode.CAR_SHARING];
  const prices = {
    [TripMode.BIKE_SHARING]: 0.1,
    [TripMode.SCOOTER_SHARING]: 0.2,
    [TripMode.CAR_SHARING]: 0.5,
  };
  const descriptions = {
    [TripMode.BIKE_SHARING]: 'Electric bike — ideal for short urban trips',
    [TripMode.SCOOTER_SHARING]: 'Electric scooter — fast and convenient',
    [TripMode.CAR_SHARING]: 'Compact car — great for longer distances',
  };

  const batch = db.batch();
  let count = 0;

  for (const city of cities) {
    for (const type of types) {
      for (let i = 0; i < 3; i++) {
        const id = uuidv4();
        batch.set(col.doc(id), {
          id,
          type,
          city,
          basePrice: prices[type],
          description: `${descriptions[type]} in ${city} (#${i + 1})`,
          blockedPeriods: [],
        });
        count++;
      }
    }
  }

  await batch.commit();
  console.log(`mobilityOptions: seeded ${count} documents.`);
}

// ─── Parking ──────────────────────────────────────────────────────────────────

async function seedParking() {
  const facilitiesCol = db.collection('parkingFacilities');
  const spotsCol = db.collection('parkingSpots');
  const existing = await facilitiesCol.limit(1).get();
  if (!existing.empty) {
    console.log('parking: already seeded, skipping.');
    return;
  }

  const { ParkingStatus } = require('../models/enums');

  const facilityData = [
    { name: 'Downtown Parking Garage', city: 'Montreal', address: '100 Rue Sainte-Catherine' },
    { name: 'Old Port Parking', city: 'Montreal', address: '333 Rue de la Commune' },
    { name: 'Bay Street Parking', city: 'Toronto', address: '200 Bay Street' },
    { name: 'Union Station Lot', city: 'Toronto', address: '65 Front Street' },
    { name: 'Robson Square Parking', city: 'Vancouver', address: '800 Robson Street' },
    { name: 'Waterfront Parkade', city: 'Vancouver', address: '200 Burrard Street' },
  ];

  const batch = db.batch();
  let facilityCount = 0;
  let spotCount = 0;

  for (const data of facilityData) {
    const facilityId = uuidv4();
    batch.set(facilitiesCol.doc(facilityId), { id: facilityId, ...data });
    facilityCount++;

    const pricePerHour = data.city === 'Toronto' ? 8.0 : data.city === 'Montreal' ? 6.0 : 7.0;
    for (let i = 1; i <= 5; i++) {
      const spotId = uuidv4();
      batch.set(spotsCol.doc(spotId), {
        id: spotId,
        facilityId,
        status: ParkingStatus.AVAILABLE,
        pricePerHour,
        spotNumber: `${String.fromCharCode(64 + Math.ceil(i / 5))}${i}`,
      });
      spotCount++;
    }
  }

  await batch.commit();
  console.log(`parking: seeded ${facilityCount} facilities, ${spotCount} spots.`);
}

// ─── Run ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Starting seed...');
  await seedVehicles();
  await seedMobilityOptions();
  await seedParking();
  console.log('Seed complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
