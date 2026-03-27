/**
 * Migration: rebuild mobilityOptions so each one has the same ID as its vehicle
 * and capacity=1. This makes the map badge counts match pin counts and enables
 * per-vehicle availability grey-out.
 *
 * Safe to re-run — always rebuilds from the current vehicles collection.
 * Usage: node src/scripts/migrateOptions.js
 */
require('dotenv').config();
const db = require('../lib/firestore');

async function main() {
  const vehiclesSnap = await db.collection('vehicles').get();
  const vehicles = vehiclesSnap.docs.map((d) => d.data());

  if (vehicles.length === 0) {
    console.log('No vehicles found — run seed.js first.');
    process.exit(0);
  }

  // Delete all existing mobilityOptions
  const optionsSnap = await db.collection('mobilityOptions').get();
  let deleteBatch = db.batch();
  let deleteCount = 0;
  for (const doc of optionsSnap.docs) {
    deleteBatch.delete(doc.ref);
    deleteCount++;
    if (deleteCount % 490 === 0) {
      await deleteBatch.commit();
      deleteBatch = db.batch();
    }
  }
  if (deleteCount % 490 !== 0) await deleteBatch.commit();
  console.log(`Deleted ${deleteCount} old mobilityOptions.`);

  // Recreate one option per vehicle — same ID, capacity=1
  const col = db.collection('mobilityOptions');
  let createBatch = db.batch();
  let createCount = 0;

  for (const v of vehicles) {
    if (!v.id || !v.type || !v.city) continue;
    createBatch.set(col.doc(v.id), {
      id: v.id,
      type: v.type,
      city: v.city,
      basePrice: v.pricePerMin ?? 0.15,
      capacity: 1,
      description: `${v.type.replace(/_/g, ' ')} in ${v.city}`,
      blockedPeriods: [],
      ...(v.providerId ? { providerId: v.providerId } : {}),
    });
    createCount++;
    if (createCount % 490 === 0) {
      await createBatch.commit();
      createBatch = db.batch();
    }
  }
  if (createCount % 490 !== 0) await createBatch.commit();
  console.log(`Created ${createCount} mobilityOptions (1 per vehicle, capacity=1).`);
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
