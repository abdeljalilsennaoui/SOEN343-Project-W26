const { z } = require('zod');
const { TripMode } = require('../models/enums');

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

module.exports = {
  vehicleQuerySchema,
  createReservationSchema,
  chargePaymentSchema,
  returnVehicleSchema,
  parkingQuerySchema,
  reserveSpotSchema,
  releaseSpotSchema,
  analyticsQuerySchema,
  validateBody,
  validateQuery,
};
