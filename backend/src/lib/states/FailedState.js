/**
 * FailedState — State Pattern (concrete state, terminal)
 *
 * A FAILED booking cannot transition anywhere.
 * All action methods throw 409 via the inherited BookingState defaults.
 */
const BookingState = require('./BookingState');

class FailedState extends BookingState {
  getName() { return 'FAILED'; }
}

module.exports = FailedState;
