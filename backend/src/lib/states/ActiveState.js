/**
 * ActiveState — State Pattern (concrete state)
 *
 * A booking in ACTIVE state can only move to COMPLETE (vehicle returned).
 * All other transitions are blocked by the default throwing implementation
 * in BookingState.
 */
const BookingState = require('./BookingState');

class ActiveState extends BookingState {
  getName() { return 'ACTIVE'; }

  toComplete(context) {
    context.setState(new (require('./CompleteState'))());
  }
}

module.exports = ActiveState;
