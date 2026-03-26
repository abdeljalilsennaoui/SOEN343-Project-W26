const { Router } = require('express');
const mobilityController = require('../mvc/MobilityController');
const {
  validateQuery,
  validateBody,
  parkingQuerySchema,
  reserveSpotSchema,
  releaseSpotSchema,
  nearbyParkingQuerySchema,
} = require('../middleware/validation');

const router = Router();

router.get('/parking/facilities', validateQuery(parkingQuerySchema), (req, res, next) =>
  mobilityController.getParkingFacilities(req, res, next)
);

router.get('/parking/facilities/:facilityId/spots', (req, res, next) =>
  mobilityController.getFacilitySpots(req, res, next)
);

router.get('/parking/spots/available', validateQuery(parkingQuerySchema), (req, res, next) =>
  mobilityController.getAvailableSpots(req, res, next)
);

router.post('/parking/spots/reserve', validateBody(reserveSpotSchema), (req, res, next) =>
  mobilityController.reserveParkingSpot(req, res, next)
);

router.post('/parking/spots/release', validateBody(releaseSpotSchema), (req, res, next) =>
  mobilityController.releaseParkingSpot(req, res, next)
);

router.get('/parking/nearby', validateQuery(nearbyParkingQuerySchema), (req, res, next) =>
  mobilityController.getNearbyParkings(req, res, next)
);

module.exports = router;
