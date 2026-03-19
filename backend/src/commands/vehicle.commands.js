/**
 * Vehicle Commands — Command Pattern (concrete commands)
 *
 * Each class encapsulates one vehicle-related request.
 * Receiver: MobilityService (injected via constructor).
 * Invoker:  MobilityRequestHandler (calls execute()).
 */
const ICommand = require('./ICommand');
const MobilityResponse = require('../mvc/MobilityResponse');

// ── GetVehiclesCommand ───────────────────────────────────────────────────────

class GetVehiclesCommand extends ICommand {
  constructor(receiver) {
    super();
    this.receiver = receiver;
  }

  async execute(request) {
    const data = await this.receiver.getVehicles(request.payload);
    return MobilityResponse.ok(data);
  }
}

// ── SearchOptionsCommand ─────────────────────────────────────────────────────

class SearchOptionsCommand extends ICommand {
  constructor(receiver) {
    super();
    this.receiver = receiver;
  }

  async execute(request) {
    const data = await this.receiver.searchVehicles(request.payload);
    return MobilityResponse.ok(data);
  }
}

module.exports = { GetVehiclesCommand, SearchOptionsCommand };
