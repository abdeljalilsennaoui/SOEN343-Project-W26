/**
 * BookingStateMachine — State Pattern (context)
 *
 * Maintains a reference to the current BookingState object and
 * delegates all transition requests to it. The context never contains
 * any transition logic — that belongs exclusively to the state classes.
 *
 * Lifecycle:
 *   DRAFT ──(toActive)──► ACTIVE ──(toComplete)──► COMPLETE
 *   DRAFT ──(toFailed)──► FAILED
 *   COMPLETE and FAILED are terminal — all actions throw 409.
 *
 * Usage (MobilityService creates one context per transition attempt):
 *   new BookingStateMachine(booking.status).toActive();   // throws 409 if not DRAFT
 *   new BookingStateMachine(booking.status).toComplete(); // throws 409 if not ACTIVE
 *   new BookingStateMachine(booking.status).toFailed();   // throws 409 if not DRAFT
 *
 * Participating classes:
 *   - BookingState (lib/states/BookingState.js)  — state interface
 *   - DraftState, ActiveState, CompleteState, FailedState — concrete states
 *   - BookingStateMachine (this file)            — context
 *   - MobilityService (mvc/MobilityService.js)   — client
 */
const ApiError = require('../models/ApiError');
const { BookingStatus } = require('../models/enums');

const DraftState    = require('./states/DraftState');
const ActiveState   = require('./states/ActiveState');
const CompleteState = require('./states/CompleteState');
const FailedState   = require('./states/FailedState');

class BookingStateMachine {
  /**
   * Build a context initialised to the booking's current status.
   * @param {string} currentStatus — a BookingStatus enum value
   */
  constructor(currentStatus) {
    this.state = BookingStateMachine._resolve(currentStatus);
  }

  /**
   * Called by concrete state classes to perform the transition.
   * @param {BookingState} newState
   */
  setState(newState) {
    this.state = newState;
  }

  // ── Actions — each delegates to the current state ──────────────────────────

  /** Attempt to confirm the booking (DRAFT → ACTIVE). */
  toActive() {
    this.state.toActive(this);
  }

  /** Attempt to complete the booking (ACTIVE → COMPLETE). */
  toComplete() {
    this.state.toComplete(this);
  }

  /** Attempt to mark the booking as failed (DRAFT → FAILED). */
  toFailed() {
    this.state.toFailed(this);
  }

  // ── Private factory ─────────────────────────────────────────────────────────

  static _resolve(status) {
    switch (status) {
      case BookingStatus.DRAFT:    return new DraftState();
      case BookingStatus.ACTIVE:   return new ActiveState();
      case BookingStatus.COMPLETE: return new CompleteState();
      case BookingStatus.FAILED:   return new FailedState();
      default:
        throw new ApiError('INVALID_STATE', `Unknown booking status: ${status}`, 409);
    }
  }
}

// Export the class — callers do: new BookingStateMachine(booking.status).toActive()
module.exports = BookingStateMachine;
