/**
 * One-time cleanup: delete all DRAFT bookings from Firestore.
 * Run with: node src/scripts/cleanDrafts.js
 */
require('dotenv').config();
const db = require('../lib/firestore');

async function main() {
  const snap = await db.collection('bookings').where('status', '==', 'DRAFT').get();
  if (snap.empty) {
    console.log('No draft bookings found.');
    return;
  }

  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`Deleted ${snap.size} draft booking(s).`);
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
