const { Router } = require('express');
const providerController = require('../controllers/ProviderController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { validateBody, validateQuery } = require('../middleware/validation');
const { UserRole } = require('../models/enums');
const { z } = require('zod');
const { TripMode } = require('../models/enums');

const vehicleBodySchema = z.object({
  city: z.string().min(1, 'city is required'),
  type: z.enum([TripMode.CAR_SHARING, TripMode.BIKE_SHARING, TripMode.SCOOTER_SHARING]),
  pricePerMin: z.number().positive('pricePerMin must be positive'),
  description: z.string().optional().default(''),
});

const vehicleUpdateSchema = z.object({
  city: z.string().min(1).optional(),
  type: z.enum([TripMode.CAR_SHARING, TripMode.BIKE_SHARING, TripMode.SCOOTER_SHARING]).optional(),
  pricePerMin: z.number().positive().optional(),
  description: z.string().optional(),
});

const router = Router();

const auth = [requireAuth, requireRole(UserRole.MOBILITY_PROVIDER, UserRole.CITY_ADMINISTRATOR, UserRole.SYSTEM_ADMINISTRATOR)];

router.get('/provider/vehicles', ...auth,
  providerController.getVehicles.bind(providerController));

router.post('/provider/vehicles', ...auth,
  validateBody(vehicleBodySchema),
  providerController.addVehicle.bind(providerController));

router.put('/provider/vehicles/:vehicleId', ...auth,
  validateBody(vehicleUpdateSchema),
  providerController.updateVehicle.bind(providerController));

router.delete('/provider/vehicles/:vehicleId', ...auth,
  providerController.deactivateVehicle.bind(providerController));

module.exports = router;
