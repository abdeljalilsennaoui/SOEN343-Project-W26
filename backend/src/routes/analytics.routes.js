const { Router } = require('express');
const mobilityController = require('../mvc/MobilityController');
const { analyticsController } = require('../controllers');
const { validateQuery, analyticsQuerySchema } = require('../middleware/validation');

const router = Router();

router.get('/analytics/rentals', (req, res, next) =>
  mobilityController.getRentalAnalytics(req, res, next)
);

router.get('/analytics/gateway', (req, res, next) =>
  mobilityController.getGatewayAnalytics(req, res, next)
);

router.get('/analytics', validateQuery(analyticsQuerySchema), (req, res, next) =>
  analyticsController.getEvents(req, res, next)
);

module.exports = router;
