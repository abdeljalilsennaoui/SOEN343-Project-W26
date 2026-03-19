/**
 * DraftState — State Pattern (concrete state)
 *
 * A booking in DRAFT state can move to ACTIVE (payment confirmed)
 * or to FAILED (payment declined). All other transitions are blocked
 * by the default throwing implementation in BookingState.
 */
const BookingState = require('./BookingState');

class DraftState extends BookingState {
  getName() { return 'DRAFT'; }

  toActive(context) {
    context.setState(new (require('./ActiveState'))());
  }

  toFailed(context) {
    context.setState(new (require('./FailedState'))());
  }
}

module.exports = DraftState;
