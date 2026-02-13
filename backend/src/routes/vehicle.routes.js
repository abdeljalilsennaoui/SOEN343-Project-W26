const { Router } = require('express');
const { vehicleController } = require('../controllers');
const { validateQuery, vehicleQuerySchema } = require('../middleware/validation');

const router = Router();

router.get(
  '/vehicles',
  validateQuery(vehicleQuerySchema),
  vehicleController.getVehicles.bind(vehicleController),
);

module.exports = router;
