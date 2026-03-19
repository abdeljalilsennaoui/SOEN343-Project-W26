/**
 * ParkingReservedEvent — Visitor Pattern (concrete element)
 *
 * Emitted by MobilityService when a parking spot is reserved.
 * accept() calls visitor.visit(this) — 2nd dispatch.
 */
const AnalyticsEvent = require('./AnalyticsEvent');

class ParkingReservedEvent extends AnalyticsEvent {
  constructor({ city, spotId }) {
    super();
    this._city = city;
    this._spotId = spotId;
  }

  get type() { return 'PARKING_RESERVED'; }
  get city() { return this._city; }
  get metadata() {
    return { spotId: this._spotId };
  }

  accept(visitor) { visitor.visit(this); }
}

module.exports = ParkingReservedEvent;
