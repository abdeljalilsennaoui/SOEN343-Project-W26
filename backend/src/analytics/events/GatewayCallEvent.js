/**
 * GatewayCallEvent — Visitor Pattern (concrete element)
 *
 * Emitted by MobilityService whenever an external gateway is invoked.
 * No city is associated — gateway calls span all cities.
 * accept() calls visitor.visit(this) — 2nd dispatch.
 */
const AnalyticsEvent = require('./AnalyticsEvent');

class GatewayCallEvent extends AnalyticsEvent {
  constructor({ service, operation, success }) {
    super();
    this._service = service;
    this._operation = operation;
    this._success = success;
  }

  get type() { return 'GATEWAY_CALL'; }
  get city() { return null; }
  get metadata() {
    return { service: this._service, operation: this._operation, success: this._success };
  }

  accept(visitor) { visitor.visit(this); }
}

module.exports = GatewayCallEvent;
