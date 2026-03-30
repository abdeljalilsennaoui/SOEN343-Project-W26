/**
 * Reset script — clears vehicles, mobilityOptions, bookings, paymentReceipts,
 * then re-seeds vehicles + mobilityOptions + parking from scratch.
 *
 * Usage: node src/scripts/reset.js
 */
require('dotenv').config();

const admin = require('../lib/firebaseAdmin');
const db = admin.firestore();
const { v4: uuidv4 } = require('uuid');
const { TripMode, VehicleStatus, ParkingStatus } = require('../models/enums');

async function clearCollection(name) {
  const snap = await db.collection(name).get();
  if (snap.empty) { console.log(`${name}: already empty.`); return; }
  let batch = db.batch();
  let count = 0;
  for (const doc of snap.docs) {
    batch.delete(doc.ref);
    count++;
    if (count % 490 === 0) { await batch.commit(); batch = db.batch(); }
  }
  await batch.commit();
  console.log(`${name}: deleted ${count} docs.`);
}

async function seedVehiclesAndOptions() {
  const vehiclesCol = db.collection('vehicles');
  const optionsCol = db.collection('mobilityOptions');

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

  function computeCoords(city, indexInCity, vehicleType) {
    const center = cityCenters[city];
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
  console.log(`vehicles + mobilityOptions: seeded ${count} pairs (capacity=1 each).`);
}

async function seedParking() {
  const facilitiesCol = db.collection('parkingFacilities');
  const spotsCol = db.collection('parkingSpots');

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

async function main() {
  console.log('--- Clearing collections ---');
  await clearCollection('vehicles');
  await clearCollection('mobilityOptions');
  await clearCollection('bookings');
  await clearCollection('paymentReceipts');
  await clearCollection('parkingFacilities');
  await clearCollection('parkingSpots');

  console.log('\n--- Seeding fresh data ---');
  await seedVehiclesAndOptions();
  await seedParking();

  console.log('\nReset complete.');
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
