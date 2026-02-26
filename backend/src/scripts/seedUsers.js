/**
 * Admin user seeding script — run with:
 *   node src/scripts/seedUsers.js
 *
 * Promotes an existing Firebase Auth user to a given role in Firestore.
 * The user must have logged in at least once (so a user doc already exists),
 * OR this script will create the doc if it is missing.
 *
 * Required env vars (add to backend/.env or pass inline):
 *   ADMIN_UID   — Firebase Auth UID of the user to promote
 *   ADMIN_ROLE  — Target role: COMMUTER | CITY_ADMINISTRATOR | SYSTEM_ADMINISTRATOR
 *
 * Example:
 *   ADMIN_UID=abc123 ADMIN_ROLE=CITY_ADMINISTRATOR node src/scripts/seedUsers.js
 */

require('dotenv').config();

const admin = require('../lib/firebaseAdmin');
const db = admin.firestore();
const { UserRole } = require('../models/enums');

const VALID_ROLES = Object.values(UserRole);

async function main() {
  const uid = process.env.ADMIN_UID;
  const role = process.env.ADMIN_ROLE;

  if (!uid) {
    console.error('Error: ADMIN_UID env var is required.');
    process.exit(1);
  }

  if (!role || !VALID_ROLES.includes(role)) {
    console.error(`Error: ADMIN_ROLE must be one of: ${VALID_ROLES.join(', ')}`);
    process.exit(1);
  }

  // Verify the UID exists in Firebase Auth before writing to Firestore.
  let authUser;
  try {
    authUser = await admin.auth().getUser(uid);
  } catch {
    console.error(`Error: Firebase Auth user with UID "${uid}" not found.`);
    process.exit(1);
  }

  const userRef = db.collection('users').doc(uid);
  const snap = await userRef.get();

  if (snap.exists) {
    const current = snap.data();
    await userRef.update({ role });
    console.log(
      `Updated user "${authUser.email}" (${uid}): ${current.role} → ${role}`,
    );
  } else {
    // User has never logged in; create the doc now.
    await userRef.set({
      uid,
      email: authUser.email || '',
      displayName: authUser.displayName || '',
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(
      `Created user doc for "${authUser.email}" (${uid}) with role: ${role}`,
    );
  }

  console.log('Done.');
  process.exit(0);
}

main().catch((err) => {
  console.error('seedUsers failed:', err);
  process.exit(1);
});
