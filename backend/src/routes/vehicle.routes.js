const { Router } = require('express');
const mobilityController = require('../mvc/MobilityController');
const { validateQuery, vehicleQuerySchema } = require('../middleware/validation');

const router = Router();

router.get(
  '/vehicles',
  validateQuery(vehicleQuerySchema),
  mobilityController.getVehicles.bind(mobilityController),
);

module.exports = router;
