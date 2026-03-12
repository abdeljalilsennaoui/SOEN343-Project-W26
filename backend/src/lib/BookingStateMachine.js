/**
 * BookingStateMachine — State pattern
 *
 * Design problem:
 *   BookingService needs to enforce that booking status transitions follow a
 *   strict lifecycle (DRAFT → ACTIVE → COMPLETE; DRAFT → FAILED). Without a
 *   dedicated class, these rules are scattered as if-checks across multiple
 *   service methods, violating High Cohesion and making illegal transitions
 *   easy to miss.
 *
 * Why this pattern fits:
 *   The booking lifecycle is a textbook finite state machine — a fixed set of
 *   states with explicit allowed transitions and terminal states. The State
 *   pattern centralises all transition rules in one class.
 *
 * Participating classes/files:
 *   - BookingStateMachine (this file) — the state machine / context
 *   - models/enums.js BookingStatus  — state identifiers
 *   - services/BookingService.js     — client that calls transition()
 *
 * Benefits:
 *   - All transition rules in one place (High Cohesion)
 *   - Adding a new state requires changing only the TRANSITIONS map
 *   - Consistent 409 error on any illegal move (no duplicate if-checks)
 *
 * Consequences if not used:
 *   BookingService would contain repeated, scattered status checks that are
 *   easy to forget and hard to keep consistent as the lifecycle evolves.
 *
 * Course/GRASP alignment:
 *   Pure Fabrication — BookingStateMachine is not a domain entity; it is
 *   invented solely to manage behaviour (transition enforcement), keeping
 *   BookingService cohesive. Supports High Cohesion and Low Coupling.
 *
 * States:   DRAFT → ACTIVE  → COMPLETE
 *           DRAFT → FAILED
 * Terminal: COMPLETE, FAILED (no further transitions)
 */
const { BookingStatus } = require('../models/enums');
const ApiError = require('../models/ApiError');

const TRANSITIONS = {
  [BookingStatus.DRAFT]:    [BookingStatus.ACTIVE, BookingStatus.FAILED],
  [BookingStatus.ACTIVE]:   [BookingStatus.COMPLETE],
  [BookingStatus.COMPLETE]: [],
  [BookingStatus.FAILED]:   [],
};

class BookingStateMachine {
  /**
   * Assert that moving booking from its current status to toStatus is legal.
   * Throws ApiError 409 if the transition is not permitted.
   * Returns toStatus on success (allows chaining).
   *
   * @param {{ status: string }} booking - booking document with a .status field
   * @param {string} toStatus            - target BookingStatus value
   * @returns {string} toStatus
   */
  transition(booking, toStatus) {
    const allowed = TRANSITIONS[booking.status];
    if (allowed === undefined) {
      throw new ApiError('INVALID_STATE', `Unknown booking status: ${booking.status}`, 409);
    }
    if (!allowed.includes(toStatus)) {
      throw new ApiError(
        'DRAFT_INVALID_STATE',
        `Cannot transition booking from ${booking.status} to ${toStatus}.`,
        409,
      );
    }
    return toStatus;
  }

  /**
   * Non-throwing guard — returns true if the transition is permitted.
   *
   * @param {string} currentStatus - current BookingStatus value
   * @param {string} toStatus      - target BookingStatus value
   * @returns {boolean}
   */
  canTransition(currentStatus, toStatus) {
    return (TRANSITIONS[currentStatus] || []).includes(toStatus);
  }
}

module.exports = new BookingStateMachine();
