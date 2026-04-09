/**
 * TransitQueryEvent — Visitor Pattern (concrete element)
 *
 * Emitted by MobilityService when a transit schedule is requested.
 * accept() calls visitor.visit(this) — 2nd dispatch.
 */
const AnalyticsEvent = require('./AnalyticsEvent');

class TransitQueryEvent extends AnalyticsEvent {
  constructor({ city, line }) {
    super();
    this._city = city;
    this._line = line;
  }

  get type() { return 'TRANSIT_QUERY'; }
  get city() { return this._city; }
  get metadata() {
    // Preserve the queried line alongside the event type so downstream visitors can aggregate route demand.
    return { line: this._line };
  }

  accept(visitor) { visitor.visit(this); }
}

module.exports = TransitQueryEvent;
