const { Router } = require('express');
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

const mobilityController = require('../mvc/MobilityController');

const router = Router();

const auth = [requireAuth, requireRole(UserRole.MOBILITY_PROVIDER, UserRole.CITY_ADMINISTRATOR, UserRole.SYSTEM_ADMINISTRATOR)];

router.get('/provider/vehicles', ...auth,
  mobilityController.getProviderVehicles.bind(mobilityController));

router.post('/provider/vehicles', ...auth,
  validateBody(vehicleBodySchema),
  mobilityController.addVehicle.bind(mobilityController));

router.put('/provider/vehicles/:vehicleId', ...auth,
  validateBody(vehicleUpdateSchema),
  mobilityController.updateVehicle.bind(mobilityController));

router.delete('/provider/vehicles/:vehicleId', ...auth,
  mobilityController.deactivateVehicle.bind(mobilityController));

module.exports = router;
