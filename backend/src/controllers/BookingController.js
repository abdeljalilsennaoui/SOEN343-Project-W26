/**
 * BookingController — GRASP Controller
 *
 * Handles HTTP request/response for the booking workflow.
 * Delegates all business logic to BookingFacade (Facade pattern).
 * Does not import models, services, or gateways directly.
 */
const BookingFacade = require('../services/BookingFacade');

class BookingController {
  /**
   * POST /api/bookings/draft
   * Body validated by createDraftSchema (validateBody middleware)
   * Response 201: { data: Booking }
   */
  async createDraft(req, res, next) {
    try {
      const userId = req.uid;
      const { optionId, startTime, endTime, pickupLocation } = req.body;
      const draft = await BookingFacade.createDraft({ userId, optionId, startTime, endTime, pickupLocation });
      res.status(201).json({ data: draft });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/bookings/:draftId/confirm
   * Body validated by confirmDraftSchema (validateBody middleware)
   * Response 200: { data: { booking: Booking, receipt: PaymentReceipt } }
   */
  async confirmDraft(req, res, next) {
    try {
      const { draftId } = req.params;
      const userId = req.uid;
      const { paymentDetails } = req.body;
      const result = await BookingFacade.confirmDraft(draftId, userId, paymentDetails);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/bookings/:bookingId/complete
   * No body required
   * Response 200: { data: Booking }
   */
  async completeBooking(req, res, next) {
    try {
      const { bookingId } = req.params;
      const userId = req.uid;
      const booking = await BookingFacade.completeBooking(bookingId, userId);
      res.json({ data: booking });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/bookings
   * Returns all bookings for the authenticated user.
   * Response 200: { data: Booking[], count: N }
   */
  async getMyBookings(req, res, next) {
    try {
      const bookings = await BookingFacade.getMyBookings(req.uid);
      res.json({ data: bookings, count: bookings.length });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BookingController();
