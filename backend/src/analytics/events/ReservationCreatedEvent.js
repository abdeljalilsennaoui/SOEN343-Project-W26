/**
 * ReservationCreatedEvent — Visitor Pattern (concrete element)
 *
 * Emitted by MobilityService when a new booking draft is created.
 * accept() calls visitor.visit(this) — 2nd dispatch.
 */
const AnalyticsEvent = require('./AnalyticsEvent');

class ReservationCreatedEvent extends AnalyticsEvent {
  constructor({ city, vehicleType, optionId, userId }) {
    super();
    this._city = city;
    this._vehicleType = vehicleType;
    this._optionId = optionId;
    this._userId = userId;
  }

  get type() { return 'RESERVATION_CREATED'; }
  get city() { return this._city; }
  get metadata() {
    return { vehicleType: this._vehicleType, optionId: this._optionId, userId: this._userId };
  }

  accept(visitor) { visitor.visit(this); }
}

module.exports = ReservationCreatedEvent;
