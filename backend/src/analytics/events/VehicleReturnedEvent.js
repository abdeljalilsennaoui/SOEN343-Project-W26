/**
 * VehicleReturnedEvent — Visitor Pattern (concrete element)
 *
 * Emitted by MobilityService when a booking is marked COMPLETE.
 * accept() calls visitor.visit(this) — 2nd dispatch.
 */
const AnalyticsEvent = require('./AnalyticsEvent');

class VehicleReturnedEvent extends AnalyticsEvent {
  constructor({ city, bookingId }) {
    super();
    this._city = city;
    this._bookingId = bookingId;
  }

  get type() { return 'VEHICLE_RETURNED'; }
  get city() { return this._city; }
  get metadata() {
    return { bookingId: this._bookingId };
  }

  accept(visitor) { visitor.visit(this); }
}

module.exports = VehicleReturnedEvent;
