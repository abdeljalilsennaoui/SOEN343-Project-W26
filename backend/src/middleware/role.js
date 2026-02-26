const ApiError = require('../models/ApiError');

/**
 * Middleware factory: gate a route to one or more UserRole values.
 * Must be placed after requireAuth (depends on req.role being set).
 *
 * Usage:
 *   router.post('/bookings/draft', requireAuth, requireRole('COMMUTER'), ...)
 *   router.get('/admin/stats',     requireAuth, requireRole('CITY_ADMINISTRATOR', 'SYSTEM_ADMINISTRATOR'), ...)
 *
 * @param {...string} roles  — one or more UserRole string values
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return next(
        ApiError.forbidden(`Access restricted to: ${roles.join(' | ')}. Your role: ${req.role}`),
      );
    }
    next();
  };
}

module.exports = { requireRole };
