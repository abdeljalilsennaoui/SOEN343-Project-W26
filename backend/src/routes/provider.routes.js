const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { validateBody } = require('../middleware/validation');
const { UserRole, VehicleStatus } = require('../models/enums');
const { z } = require('zod');
const { TripMode } = require('../models/enums');

const vehicleBodySchema = z.object({
  city: z.string().min(1, 'city is required'),
  type: z.enum([TripMode.CAR_SHARING, TripMode.BIKE_SHARING, TripMode.SCOOTER_SHARING]),
  pricePerMin: z.number().positive('pricePerMin must be positive'),
  lat: z.number().min(-90, 'lat must be between -90 and 90').max(90, 'lat must be between -90 and 90'),
  lng: z.number().min(-180, 'lng must be between -180 and 180').max(180, 'lng must be between -180 and 180'),
  description: z.string().optional().default(''),
});

const vehicleUpdateSchema = z.object({
  city: z.string().min(1).optional(),
  type: z.enum([TripMode.CAR_SHARING, TripMode.BIKE_SHARING, TripMode.SCOOTER_SHARING]).optional(),
  pricePerMin: z.number().positive().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  description: z.string().optional(),
  status: z.enum([VehicleStatus.AVAILABLE, VehicleStatus.RESERVED, VehicleStatus.IN_USE, VehicleStatus.OUT_OF_SERVICE]).optional(),
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
