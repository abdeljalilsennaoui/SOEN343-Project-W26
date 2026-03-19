/**
 * Transit Commands — Command Pattern (concrete commands)
 *
 * Each class encapsulates one transit-related query.
 * Receiver: MobilityService (injected via constructor).
 * Invoker:  MobilityRequestHandler (calls execute()).
 */
const ICommand = require('./ICommand');
const MobilityResponse = require('../mvc/MobilityResponse');

// ── GetTransitScheduleCommand ────────────────────────────────────────────────

class GetTransitScheduleCommand extends ICommand {
  constructor(receiver) {
    super();
    this.receiver = receiver;
  }

  async execute(request) {
    const data = await this.receiver.getTransitSchedule(
      request.payload.city,
      request.payload.line || null
    );
    return MobilityResponse.ok(data);
  }
}

// ── GetNearbyStopsCommand ────────────────────────────────────────────────────

class GetNearbyStopsCommand extends ICommand {
  constructor(receiver) {
    super();
    this.receiver = receiver;
  }

  async execute(request) {
    const data = await this.receiver.getNearbyStops(
      request.payload.lat,
      request.payload.lng
    );
    return MobilityResponse.ok(data);
  }
}

module.exports = { GetTransitScheduleCommand, GetNearbyStopsCommand };
