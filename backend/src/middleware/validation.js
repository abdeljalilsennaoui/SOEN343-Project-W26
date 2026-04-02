const { z } = require('zod');
const { TripMode } = require('../models/enums');

// ─── Sprint 2 schemas ────────────────────────────────────────────────────────

// UC2A — search mobility options
const mobilitySearchSchema = z
  .object({
    city: z.string().min(1, 'city is required'),
    type: z.enum(Object.values(TripMode)).optional(),
    maxPrice: z.coerce.number().min(0, 'maxPrice must be >= 0').optional(),
    startTime: z.string().datetime({ message: 'startTime must be a valid ISO 8601 datetime' }),
    endTime: z.string().datetime({ message: 'endTime must be a valid ISO 8601 datetime' }),
  })
  .refine((d) => new Date(d.startTime) < new Date(d.endTime), {
    message: 'startTime must be before endTime',
    path: ['startTime'],
  })
  .refine((d) => new Date(d.endTime) - new Date(d.startTime) >= 5 * 60 * 1000, {
    message: 'minimum booking duration is 5 minutes',
    path: ['endTime'],
  })
  .refine((d) => new Date(d.endTime) - new Date(d.startTime) <= 24 * 60 * 60 * 1000, {
    message: 'maximum booking duration is 24 hours',
    path: ['endTime'],
  });

// UC3-A — create booking draft (userId comes from auth token via req.uid)
const createDraftSchema = z
  .object({
    optionId: z.string().min(1, 'optionId is required'),
    startTime: z.string().datetime({ message: 'startTime must be a valid ISO 8601 datetime' }),
    endTime: z.string().datetime({ message: 'endTime must be a valid ISO 8601 datetime' }),
    pickupLocation: z.union([
      z.object({ lat: z.number(), lng: z.number() }),
      z.string().min(1, 'pickupLocation must be non-empty'),
    ]),
    rideSharing: z.boolean().optional().default(false),
    maxPassengers: z.number().int().min(0).max(3).optional().default(0),
  })
  .refine((d) => new Date(d.startTime) < new Date(d.endTime), {
    message: 'startTime must be before endTime',
    path: ['startTime'],
  });

// UC3-B — confirm booking draft (userId comes from auth token via req.uid)
const confirmDraftSchema = z.object({
  paymentDetails: z.object({
    token: z.string().min(1, 'payment token is required'),
  }),
});

// ─────────────────────────────────────────────────────────────────────────────

const vehicleQuerySchema = z.object({
  city: z.string().optional(),
  type: z.enum([TripMode.BIKE_SHARING, TripMode.SCOOTER_SHARING, TripMode.CAR_SHARING]).optional(),
});

const createReservationSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  vehicleId: z.string().min(1, 'vehicleId is required'),
});

const chargePaymentSchema = z.object({
  reservationId: z.string().min(1, 'reservationId is required'),
  amount: z.number().positive('amount must be positive'),
  simulateFailure: z.boolean().optional(),
});

const returnVehicleSchema = z.object({
  reservationId: z.string().min(1, 'reservationId is required'),
});

const parkingQuerySchema = z.object({
  city: z.string().optional(),
});

const reserveSpotSchema = z.object({
  spotId: z.string().min(1, 'spotId is required'),
});

const releaseSpotSchema = z.object({
  spotId: z.string().min(1, 'spotId is required'),
});

const analyticsQuerySchema = z.object({
  city: z.string().optional(),
  type: z.string().optional(),
});

function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: result.error.issues,
        },
      });
    }
    req.body = result.data;
    next();
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: result.error.issues,
        },
      });
    }
    req.query = result.data;
    next();
  };
}

const nearbyParkingQuerySchema = z.object({
  lat: z.coerce.number().refine((n) => Number.isFinite(n), { message: 'lat must be a valid number' }),
  lng: z.coerce.number().refine((n) => Number.isFinite(n), { message: 'lng must be a valid number' }),
  radius: z.coerce.number().positive('radius must be a positive number').optional(),
  maxResults: z.coerce.number().int().positive('maxResults must be a positive integer').optional(),
});

module.exports = {
  vehicleQuerySchema,
  createReservationSchema,
  chargePaymentSchema,
  returnVehicleSchema,
  parkingQuerySchema,
  reserveSpotSchema,
  releaseSpotSchema,
  analyticsQuerySchema,
  mobilitySearchSchema,
  createDraftSchema,
  confirmDraftSchema,
  validateBody,
  validateQuery,
  nearbyParkingQuerySchema,
};
