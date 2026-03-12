const { Router } = require('express');
const transitController = require('../controllers/TransitController');

const router = Router();

router.get('/transit/schedule', transitController.getSchedule.bind(transitController));
router.get('/transit/stops/nearby', transitController.getNearbyStops.bind(transitController));

module.exports = router;
