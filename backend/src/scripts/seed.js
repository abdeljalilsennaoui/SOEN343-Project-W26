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

// ─── Vehicles + Mobility Options (seeded together so IDs match) ───────────────

async function seedVehicles() {
  const vehiclesCol = db.collection('vehicles');
  const optionsCol = db.collection('mobilityOptions');

  const existing = await vehiclesCol.limit(1).get();
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
  const descriptions = {
    [TripMode.BIKE_SHARING]: 'Electric bike — ideal for short urban trips',
    [TripMode.SCOOTER_SHARING]: 'Electric scooter — fast and convenient',
    [TripMode.CAR_SHARING]: 'Compact car — great for longer distances',
  };
  const cityCenters = {
    Montreal: { lat: 45.5017, lng: -73.5673 },
    Toronto: { lat: 43.6532, lng: -79.3832 },
    Vancouver: { lat: 49.2827, lng: -123.1207 },
  };

  function computeCoords(city, indexInCity = 0, vehicleType = TripMode.BIKE_SHARING) {
    const center = cityCenters[city] ?? cityCenters.Montreal;
    const typeOffset = {
      [TripMode.BIKE_SHARING]: -0.004,
      [TripMode.SCOOTER_SHARING]: 0,
      [TripMode.CAR_SHARING]: 0.004,
    };
    const ringOffset = (indexInCity % 6) * 0.002;
    return {
      lat: Number((center.lat + typeOffset[vehicleType] + ringOffset).toFixed(6)),
      lng: Number((center.lng + typeOffset[vehicleType] - ringOffset).toFixed(6)),
    };
  }

  const batch = db.batch();
  let count = 0;

  for (const city of cities) {
    for (const type of types) {
      for (let i = 0; i < 3; i++) {
        // Same ID for vehicle and option — 1:1 link, capacity=1 so counts match pins.
        const id = uuidv4();
        const { lat, lng } = computeCoords(city, i, type);

        batch.set(vehiclesCol.doc(id), {
          id, type, city,
          status: VehicleStatus.AVAILABLE,
          pricePerMin: prices[type],
          providerId: null,
          lat, lng,
        });

        batch.set(optionsCol.doc(id), {
          id, type, city,
          basePrice: prices[type],
          capacity: 1,
          description: `${descriptions[type]} in ${city} (#${i + 1})`,
          blockedPeriods: [],
        });

        count++;
      }
    }
  }

  await batch.commit();
  console.log(`vehicles + options: seeded ${count} pairs.`);
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
  await seedParking();
  console.log('Seed complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
