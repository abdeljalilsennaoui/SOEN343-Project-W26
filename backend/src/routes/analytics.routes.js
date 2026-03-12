const { Router } = require('express');
const { analyticsController } = require('../controllers');
const { validateQuery, analyticsQuerySchema } = require('../middleware/validation');

const router = Router();

router.get('/analytics/rentals', (req, res, next) =>
  analyticsController.getRentalAnalytics(req, res, next)
);

router.get('/analytics/gateway', (req, res, next) =>
  analyticsController.getGatewayAnalytics(req, res, next)
);

router.get('/analytics', validateQuery(analyticsQuerySchema), (req, res, next) =>
  analyticsController.getEvents(req, res, next)
);

module.exports = router;
