/**
 * Analytics Commands — Command Pattern (concrete commands)
 *
 * Each class encapsulates one analytics query.
 * Receiver: MobilityService (injected via constructor).
 * Invoker:  MobilityRequestHandler (calls execute()).
 */
const ICommand = require('./ICommand');
const MobilityResponse = require('../mvc/MobilityResponse');

// ── GetRentalAnalyticsCommand ────────────────────────────────────────────────

class GetRentalAnalyticsCommand extends ICommand {
  constructor(receiver) {
    super();
    this.receiver = receiver;
  }

  async execute(request) {
    const data = await this.receiver.getRentalAnalytics(request.userId, request.payload?.role);
    return MobilityResponse.ok(data);
  }
}

// ── GetGatewayAnalyticsCommand ───────────────────────────────────────────────

class GetGatewayAnalyticsCommand extends ICommand {
  constructor(receiver) {
    super();
    this.receiver = receiver;
  }

  async execute(_request) {
    const data = await this.receiver.getGatewayAnalytics();
    return MobilityResponse.ok(data);
  }
}

module.exports = { GetRentalAnalyticsCommand, GetGatewayAnalyticsCommand };
