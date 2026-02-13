const { Router } = require('express');
const { returnController } = require('../controllers');
const { validateBody, returnVehicleSchema } = require('../middleware/validation');

const router = Router();

router.post(
  '/returns',
  validateBody(returnVehicleSchema),
  returnController.returnVehicle.bind(returnController),
);

module.exports = router;
