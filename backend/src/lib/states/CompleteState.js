/**
 * CompleteState — State Pattern (concrete state, terminal)
 *
 * A COMPLETE booking cannot transition anywhere.
 * All action methods throw 409 via the inherited BookingState defaults.
 */
const BookingState = require('./BookingState');

class CompleteState extends BookingState {
  getName() { return 'COMPLETE'; }
}

module.exports = CompleteState;
