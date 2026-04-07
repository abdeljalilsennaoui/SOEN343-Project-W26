/**
 * BookingState — State Pattern (abstract state)
 *
 * Defines the interface for all concrete booking states.
 * Each method represents an action that can be requested on a booking.
 * The default implementation throws a 409 — concrete states override
 * only the transitions they permit.
 *
 * This avoids any if/else or switch in the Context (BookingStateMachine):
 * illegal transitions are simply not overridden, so they always throw.
 */
const ApiError = require('../../models/ApiError');

class BookingState {
  /**
   * @returns {string} the BookingStatus value this state represents
   */
  getName() {
    throw new Error('BookingState.getName() must be implemented');
  }

  toActive(_context) {
    throw new ApiError(
      'DRAFT_INVALID_STATE',
      `Cannot transition to ACTIVE from ${this.getName()}.`,
      409
    );
  }

  toComplete(_context) {
    throw new ApiError(
      'DRAFT_INVALID_STATE',
      `Cannot transition to COMPLETE from ${this.getName()}.`,
      409
    );
  }

  toFailed(_context) {
    throw new ApiError(
      'DRAFT_INVALID_STATE',
      `Cannot transition to FAILED from ${this.getName()}.`,
      409
    );
  }
}

module.exports = BookingState;
