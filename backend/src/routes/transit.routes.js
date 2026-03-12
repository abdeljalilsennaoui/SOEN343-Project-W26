const { Router } = require('express');
const mobilityController = require('../mvc/MobilityController');

const router = Router();

router.get('/transit/schedule', mobilityController.getTransitSchedule.bind(mobilityController));
router.get('/transit/stops/nearby', mobilityController.getNearbyStops.bind(mobilityController));

module.exports = router;
