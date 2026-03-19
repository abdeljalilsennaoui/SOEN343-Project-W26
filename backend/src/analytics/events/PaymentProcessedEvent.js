/**
 * PaymentProcessedEvent — Visitor Pattern (concrete element)
 *
 * Emitted by MobilityService after a successful payment charge.
 * accept() calls visitor.visit(this) — 2nd dispatch.
 */
const AnalyticsEvent = require('./AnalyticsEvent');

class PaymentProcessedEvent extends AnalyticsEvent {
  constructor({ city, bookingId, amount }) {
    super();
    this._city = city;
    this._bookingId = bookingId;
    this._amount = amount;
  }

  get type() { return 'PAYMENT_PROCESSED'; }
  get city() { return this._city; }
  get metadata() {
    return { bookingId: this._bookingId, amount: this._amount };
  }

  accept(visitor) { visitor.visit(this); }
}

module.exports = PaymentProcessedEvent;
