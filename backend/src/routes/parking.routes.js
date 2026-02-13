const { Router } = require('express');
const { parkingController } = require('../controllers');
const {
  validateQuery,
  validateBody,
  parkingQuerySchema,
  reserveSpotSchema,
  releaseSpotSchema,
} = require('../middleware/validation');

const router = Router();

router.get('/parking/facilities', validateQuery(parkingQuerySchema), (req, res) =>
  parkingController.getFacilities(req, res)
);

router.get('/parking/facilities/:facilityId/spots', (req, res) =>
  parkingController.getFacilitySpots(req, res)
);

router.get('/parking/spots/available', validateQuery(parkingQuerySchema), (req, res) =>
  parkingController.getAvailableSpots(req, res)
);

router.post('/parking/spots/reserve', validateBody(reserveSpotSchema), (req, res, next) =>
  parkingController.reserveSpot(req, res, next)
);

router.post('/parking/spots/release', validateBody(releaseSpotSchema), (req, res, next) =>
  parkingController.releaseSpot(req, res, next)
);

module.exports = router;
