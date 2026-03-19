/**
 * BookingFacade — Facade pattern
 *
 * Design problem:
 *   The complete booking workflow involves multiple subsystems: mobility option
 *   search (MobilitySearchService), booking lifecycle management (BookingService),
 *   availability checking (AvailabilityService), pricing (PricingService), and
 *   payment processing (via gateway). Controllers that orchestrate these directly
 *   become bloated and tightly coupled to every subsystem.
 *
 * Why this pattern fits:
 *   Facade provides a single, simplified interface over a complex subsystem.
 *   The booking workflow — search → draft → confirm → complete — is a multi-step
 *   process that crosses several services. BookingFacade exposes exactly the
 *   four operations a controller needs, hiding internal orchestration details.
 *
 * Participating classes/files:
 *   - BookingFacade (this file)              — facade
 *   - services/BookingService.js             — subsystem (lifecycle management)
 *   - services/MobilitySearchService.js      — subsystem (option search)
 *   - BookingController.js                   — client (uses facade instead of services directly)
 *
 * Benefits:
 *   - Controllers stay thin — they delegate to one object, not four services
 *   - Subsystem services remain independently testable and reusable
 *   - Adding a new workflow step (e.g. notifications) requires changing only this file
 *   - Satisfies OCP: extending the workflow does not require modifying controllers
 *
 * Consequences if not used:
 *   BookingController would import and orchestrate BookingService,
 *   MobilitySearchService, AvailabilityService, and PricingService directly —
 *   a bloated controller that violates Low Coupling and High Cohesion.
 *
 * Course/GRASP alignment:
 *   Indirection / Pure Fabrication — BookingFacade is invented to reduce coupling
 *   between the controller layer and the service subsystems. Directly supports
 *   the Layered Architecture requirement (presentation → facade → services → data).
 */
const BookingService = require('./BookingService');
const { search } = require('./MobilitySearchService');

class BookingFacade {
  /**
   * Search available mobility options.
   * Delegates to MobilitySearchService — facade does not duplicate logic.
   */
  async searchOptions(params) {
    return search(params);
  }

  /**
   * Create a DRAFT booking for an authenticated user.
   * Delegates to BookingService.createDraft.
   */
  async createDraft({ userId, optionId, startTime, endTime, pickupLocation }) {
    return BookingService.createDraft({ userId, optionId, startTime, endTime, pickupLocation });
  }

  /**
   * Confirm a DRAFT booking and process payment.
   * Delegates to BookingService.confirmDraft.
   */
  async confirmDraft(draftId, userId, paymentDetails) {
    return BookingService.confirmDraft(draftId, userId, paymentDetails);
  }

  /**
   * Mark a booking COMPLETE.
   * Delegates to BookingService.completeBooking.
   */
  async completeBooking(bookingId, userId) {
    return BookingService.completeBooking(bookingId, userId);
  }

  /**
   * Retrieve all bookings for a user.
   * Delegates to BookingService.getMyBookings.
   */
  async getMyBookings(userId) {
    return BookingService.getMyBookings(userId);
  }
}

module.exports = new BookingFacade();
