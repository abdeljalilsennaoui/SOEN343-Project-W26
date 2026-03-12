const admin = require('../lib/firebaseAdmin');
const User = require('../models/User');
const ApiError = require('../models/ApiError');
const { UserRole } = require('../models/enums');

// Only these two roles can be self-selected at registration.
// SYSTEM_ADMINISTRATOR must be set manually via seedUsers.js.
const SELF_REGISTER_ROLES = [UserRole.COMMUTER, UserRole.MOBILITY_PROVIDER];

class UserController {
  /**
   * POST /api/users/register
   * Called by the frontend immediately after Firebase creates the account.
   * Verifies the token itself (no requireAuth middleware) so it can create
   * the Firestore doc with the chosen role before auto-provisioning runs.
   * Idempotent: if the doc already exists the existing doc is returned.
   */
  async register(req, res, next) {
    try {
      const header = req.headers.authorization;
      if (!header || !header.startsWith('Bearer ')) {
        return next(new ApiError('UNAUTHORIZED', 'Missing Authorization header', 401));
      }

      const decoded = await admin.auth().verifyIdToken(header.slice(7));
      const { role } = req.body;

      if (!SELF_REGISTER_ROLES.includes(role)) {
        return next(new ApiError('VALIDATION_ERROR', `role must be one of: ${SELF_REGISTER_ROLES.join(', ')}`, 400));
      }

      // Idempotent: don't overwrite an existing doc (e.g. Google sign-in followed by email register)
      const existing = await User.findByUid(decoded.uid);
      if (existing) {
        return res.json({ data: existing });
      }

      const newUser = User.buildNewUser(decoded.uid, decoded.email, decoded.name, role);
      await User.upsert(decoded.uid, newUser);
      res.status(201).json({ data: newUser });
    } catch (err) {
      if (err instanceof ApiError) return next(err);
      next(new ApiError('UNAUTHORIZED', 'Invalid or expired token', 401));
    }
  }

  /**
   * GET /api/users/me
   * Returns the current user's profile (uid, email, role).
   * Requires requireAuth middleware — req.uid and req.role are already set.
   */
  async getMe(req, res, next) {
    try {
      const user = await User.findByUid(req.uid);
      if (!user) return next(new ApiError('NOT_FOUND', 'User profile not found', 404));
      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
