/**
 * Migration: add capacity field to existing mobilityOptions.
 * Run with: node src/scripts/addCapacity.js
 *
 * Safe to re-run — only updates docs missing the capacity field.
 */
require('dotenv').config();
const db = require('../lib/firestore');

const CAPACITIES = {
  BIKE_SHARING: 8,
  SCOOTER_SHARING: 6,
  CAR_SHARING: 3,
};

async function main() {
  const col = db.collection('mobilityOptions');
  const snap = await col.get();

  const needsUpdate = snap.docs.filter((doc) => {
    const data = doc.data();
    return data.capacity === undefined || data.capacity === null;
  });

  if (needsUpdate.length === 0) {
    console.log('All mobility options already have capacity. Nothing to do.');
    return;
  }

  const batch = db.batch();
  for (const doc of needsUpdate) {
    const data = doc.data();
    const capacity = CAPACITIES[data.type] ?? 3;
    batch.update(doc.ref, { capacity });
  }

  await batch.commit();
  console.log(`Updated ${needsUpdate.length} mobility option(s) with capacity.`);
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
