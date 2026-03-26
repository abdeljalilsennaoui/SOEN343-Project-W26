const admin = require('firebase-admin');
const path = require('path');

if (!admin.apps.length) {
  if (process.env.USE_EMULATOR === 'true') {
    // Only emulate Firestore — Auth stays real so Firebase ID tokens from
    // the browser are verified against production Firebase Auth, not the emulator.
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8090';
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!serviceAccountPath) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH is not set in backend/.env');
  }
  const serviceAccount = require(path.resolve(serviceAccountPath));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
