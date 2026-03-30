/**
 * Quick fix: update a user's role by email.
 * Usage: EMAIL=bixi@gmail.com ROLE=MOBILITY_PROVIDER node src/scripts/fixRole.js
 */
require('dotenv').config();
const db = require('../lib/firestore');

const email = process.env.EMAIL;
const role = process.env.ROLE;

if (!email || !role) {
  console.error('Usage: EMAIL=user@example.com ROLE=MOBILITY_PROVIDER node src/scripts/fixRole.js');
  process.exit(1);
}

(async () => {
  const snap = await db.collection('users').where('email', '==', email).get();
  if (snap.empty) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }
  const doc = snap.docs[0];
  await doc.ref.update({ role });
  console.log(`Updated ${email} (uid: ${doc.id}) → role: ${role}`);
  process.exit(0);
})();
