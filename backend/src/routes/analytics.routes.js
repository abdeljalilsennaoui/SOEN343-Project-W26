const { Router } = require('express');
const mobilityController = require('../mvc/MobilityController');
const { analyticsController } = require('../controllers');
const { validateQuery, analyticsQuerySchema } = require('../middleware/validation');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { UserRole } = require('../models/enums');

const router = Router();

const analyticsAuth = [
  requireAuth,
  requireRole(UserRole.MOBILITY_PROVIDER, UserRole.CITY_ADMINISTRATOR, UserRole.SYSTEM_ADMINISTRATOR),
];

router.get('/analytics/rentals', ...analyticsAuth, (req, res, next) =>
  mobilityController.getRentalAnalytics(req, res, next)
);

router.get('/analytics/gateway', ...analyticsAuth, (req, res, next) =>
  mobilityController.getGatewayAnalytics(req, res, next)
);

router.get('/analytics', ...analyticsAuth, validateQuery(analyticsQuerySchema), (req, res, next) =>
  analyticsController.getEvents(req, res, next)
);

module.exports = router;
