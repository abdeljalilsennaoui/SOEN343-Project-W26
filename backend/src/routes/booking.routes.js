const { Router } = require('express');
const mobilityController = require('../mvc/MobilityController');
const { validateBody, createDraftSchema, confirmDraftSchema } = require('../middleware/validation');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { UserRole } = require('../models/enums');

const router = Router();

router.post(
  '/bookings/draft',
  requireAuth,
  requireRole(UserRole.COMMUTER),
  validateBody(createDraftSchema),
  mobilityController.createDraft.bind(mobilityController),
);

router.post(
  '/bookings/:draftId/confirm',
  requireAuth,
  requireRole(UserRole.COMMUTER),
  validateBody(confirmDraftSchema),
  mobilityController.confirmDraft.bind(mobilityController),
);

router.post(
  '/bookings/:bookingId/complete',
  requireAuth,
  requireRole(UserRole.COMMUTER),
  mobilityController.completeBooking.bind(mobilityController),
);

router.get(
  '/bookings',
  requireAuth,
  mobilityController.getMyBookings.bind(mobilityController),
);

module.exports = router;
