const admin = require('../lib/firebaseAdmin');
const ApiError = require('../models/ApiError');
const User = require('../models/User');
const { UserRole } = require('../models/enums');

/**
 * Verifies the Firebase ID token in the Authorization header.
 * Sets req.uid (Firebase UID) and req.role (UserRole string) on success.
 *
 * Auto-registration behaviour (controlled by AUTO_REGISTER_USERS env var):
 *   - "true"  (default): first login creates a COMMUTER user doc automatically.
 *             Safe for local dev and demo; all users start as COMMUTER.
 *             Admins must be seeded manually via src/scripts/seedUsers.js.
 *   - "false": a missing user doc returns 403. Requires all users to be
 *              seeded before they can access protected routes.
 */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError('UNAUTHORIZED', 'Missing or invalid Authorization header', 401));
  }

  try {
    const token = header.slice(7);
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;

    let user = await User.findByUid(decoded.uid);

    if (!user) {
      const autoRegister = process.env.AUTO_REGISTER_USERS !== 'false';

      if (!autoRegister) {
        return next(
          new ApiError(
            'FORBIDDEN',
            'No user profile found. Contact an administrator to be registered.',
            403,
          ),
        );
      }

      // Auto-provision: new user starts as COMMUTER.
      // To elevate a user to CITY_ADMINISTRATOR or SYSTEM_ADMINISTRATOR,
      // run:  node src/scripts/seedUsers.js
      const newUser = User.buildNewUser(
        decoded.uid,
        decoded.email,
        decoded.name,
        UserRole.COMMUTER,
      );
      await User.upsert(decoded.uid, newUser);
      user = newUser;
    }

    req.role = user.role;
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(new ApiError('UNAUTHORIZED', 'Invalid or expired token', 401));
  }
}

module.exports = { requireAuth };
