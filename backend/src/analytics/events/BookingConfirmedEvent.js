/**
 * BookingConfirmedEvent — Visitor Pattern (concrete element)
 *
 * Emitted by MobilityService when a booking is confirmed and moves to ACTIVE.
 * accept() calls visitor.visit(this) — 2nd dispatch.
 */
const AnalyticsEvent = require('./AnalyticsEvent');

class BookingConfirmedEvent extends AnalyticsEvent {
  constructor({ city, bookingId, type, amount }) {
    super();
    this._city = city;
    this._bookingId = bookingId;
    this._type = type;
    this._amount = amount;
  }

  get type() { return 'BOOKING_CONFIRMED'; }
  get city() { return this._city; }
  get metadata() {
    return { bookingId: this._bookingId, type: this._type, amount: this._amount };
  }

  accept(visitor) { visitor.visit(this); }
}

module.exports = BookingConfirmedEvent;
