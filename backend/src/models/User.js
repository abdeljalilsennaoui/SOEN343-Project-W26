const admin = require('../lib/firebaseAdmin');
const db = require('../lib/firestore');

const col = db.collection('users');

/**
 * Returns the user document for the given Firebase UID, or null if not found.
 * @param {string} uid
 * @returns {Promise<object|null>}
 */
async function findByUid(uid) {
  const snap = await col.doc(uid).get();
  return snap.exists ? snap.data() : null;
}

/**
 * Creates or updates a user document.
 * Uses merge: true so partial updates (e.g. role-only) are safe.
 * On first create, caller must supply all required fields.
 * @param {string} uid
 * @param {object} data
 * @returns {Promise<void>}
 */
async function upsert(uid, data) {
  await col.doc(uid).set(data, { merge: true });
}

/**
 * Builds the initial user payload for a newly registered user.
 * createdAt uses a Firestore server timestamp for reliable ordering.
 * @param {string} uid
 * @param {string} email
 * @param {string} displayName
 * @param {string} role  — UserRole value
 * @returns {object}
 */
function buildNewUser(uid, email, displayName, role) {
  return {
    uid,
    email: email || '',
    displayName: displayName || '',
    role,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

module.exports = { findByUid, upsert, buildNewUser };
