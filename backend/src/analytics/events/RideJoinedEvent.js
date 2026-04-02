/**
 * RideJoinedEvent — Visitor Pattern (concrete element)
 *
 * Emitted by MobilityService when a passenger successfully joins a shared ride.
 * accept() calls visitor.visit(this) — 2nd dispatch.
 */
const AnalyticsEvent = require('./AnalyticsEvent');

class RideJoinedEvent extends AnalyticsEvent {
  constructor({ bookingId, passengerId }) {
    super();
    this._bookingId = bookingId;
    this._passengerId = passengerId;
  }

  get type() { return 'RIDE_JOINED'; }
  get city() { return null; }
  get metadata() {
    return { bookingId: this._bookingId, passengerId: this._passengerId };
  }

  accept(visitor) { visitor.visit(this); }
}

module.exports = RideJoinedEvent;
