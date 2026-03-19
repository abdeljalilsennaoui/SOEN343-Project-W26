/**
 * ParkingReleasedEvent — Visitor Pattern (concrete element)
 *
 * Emitted by MobilityService when a parking spot is released.
 * accept() calls visitor.visit(this) — 2nd dispatch.
 */
const AnalyticsEvent = require('./AnalyticsEvent');

class ParkingReleasedEvent extends AnalyticsEvent {
  constructor({ city, spotId }) {
    super();
    this._city = city;
    this._spotId = spotId;
  }

  get type() { return 'PARKING_RELEASED'; }
  get city() { return this._city; }
  get metadata() {
    return { spotId: this._spotId };
  }

  accept(visitor) { visitor.visit(this); }
}

module.exports = ParkingReleasedEvent;
