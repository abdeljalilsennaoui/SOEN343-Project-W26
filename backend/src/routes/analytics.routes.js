const { Router } = require('express');
const { analyticsController } = require('../controllers');
const { validateQuery, analyticsQuerySchema } = require('../middleware/validation');

const router = Router();

router.get('/analytics/rentals', (req, res) =>
  analyticsController.getRentalAnalytics(req, res)
);

router.get('/analytics', validateQuery(analyticsQuerySchema), (req, res) =>
  analyticsController.getEvents(req, res)
);

module.exports = router;
