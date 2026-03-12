const { Router } = require('express');
const { bookingController } = require('../controllers');
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
  bookingController.createDraft.bind(bookingController),
);

router.post(
  '/bookings/:draftId/confirm',
  requireAuth,
  requireRole(UserRole.COMMUTER),
  validateBody(confirmDraftSchema),
  bookingController.confirmDraft.bind(bookingController),
);

router.post(
  '/bookings/:bookingId/complete',
  requireAuth,
  requireRole(UserRole.COMMUTER),
  bookingController.completeBooking.bind(bookingController),
);

router.get(
  '/bookings',
  requireAuth,
  bookingController.getMyBookings.bind(bookingController),
);

module.exports = router;
