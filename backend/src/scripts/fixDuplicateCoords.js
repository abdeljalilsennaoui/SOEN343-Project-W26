/**
 * Fix vehicles with duplicate lat/lng in Firestore.
 *
 * Vehicles that share the exact same coordinates (same lat AND lng) get a
 * small position offset applied so each one appears as its own distinct pin
 * on the map (~33 m per step).
 *
 * Run with:
 *   cd backend && node src/scripts/fixDuplicateCoords.js
 */

require('dotenv').config();

const admin = require('../lib/firebaseAdmin');
const db = admin.firestore();

// ~33 m offset per duplicate at Montreal latitude
const STEP = 0.0003;

async function fixDuplicateCoords() {
  const snap = await db.collection('vehicles').get();
  const vehicles = snap.docs.map((d) => ({ docId: d.id, ...d.data() }));

  // Group by rounded position key (4 decimal places ≈ 11 m precision)
  const groups = {};
  for (const v of vehicles) {
    const lat = Number(v.lat);
    const lng = Number(v.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push({ ...v, lat, lng });
  }

  const batch = db.batch();
  let updateCount = 0;

  for (const [key, group] of Object.entries(groups)) {
    if (group.length < 2) continue;

    console.log(`Found ${group.length} vehicles stacked at ${key}:`);
    group.forEach((v, i) => console.log(`  [${i}] id=${v.docId} type=${v.type} city=${v.city}`));

    // Keep the first vehicle in place; offset the rest
    for (let i = 1; i < group.length; i++) {
      const v = group[i];
      const newLat = Number((v.lat + i * STEP).toFixed(6));
      const newLng = Number((v.lng + i * STEP).toFixed(6));
      console.log(`  → moving [${i}] to (${newLat}, ${newLng})`);
      batch.update(db.collection('vehicles').doc(v.docId), { lat: newLat, lng: newLng });
      updateCount++;
    }
  }

  if (updateCount === 0) {
    console.log('No duplicate coordinates found — nothing to update.');
    process.exit(0);
  }

  await batch.commit();
  console.log(`\nDone. Updated ${updateCount} vehicle(s).`);
  process.exit(0);
}

fixDuplicateCoords().catch((err) => {
  console.error(err);
  process.exit(1);
});
