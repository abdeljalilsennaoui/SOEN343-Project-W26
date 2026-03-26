/**
 * Provider Commands — Command Pattern (concrete commands)
 *
 * Each class encapsulates one provider vehicle-management operation.
 * Receiver: MobilityService (injected via constructor).
 * Invoker:  MobilityRequestHandler (calls execute()).
 */
const ICommand = require('./ICommand');
const MobilityResponse = require('../mvc/MobilityResponse');

// ── GetProviderVehiclesCommand ───────────────────────────────────────────────

class GetProviderVehiclesCommand extends ICommand {
  constructor(receiver) {
    super();
    this.receiver = receiver;
  }

  async execute(request) {
    const data = await this.receiver.getProviderVehicles(request.userId, request.payload?.role);
    return MobilityResponse.ok(data);
  }
}

// ── AddVehicleCommand ────────────────────────────────────────────────────────

class AddVehicleCommand extends ICommand {
  constructor(receiver) {
    super();
    this.receiver = receiver;
  }

  async execute(request) {
    const vehicle = await this.receiver.addVehicle(request.userId, request.payload);
    return MobilityResponse.created(vehicle);
  }
}

// ── UpdateVehicleCommand ─────────────────────────────────────────────────────

class UpdateVehicleCommand extends ICommand {
  constructor(receiver) {
    super();
    this.receiver = receiver;
  }

  async execute(request) {
    const data = await this.receiver.updateVehicle(
      request.payload.vehicleId,
      request.userId,
      request.payload.fields
    );
    return MobilityResponse.ok(data);
  }
}

// ── DeactivateVehicleCommand ─────────────────────────────────────────────────

class DeactivateVehicleCommand extends ICommand {
  constructor(receiver) {
    super();
    this.receiver = receiver;
  }

  async execute(request) {
    const data = await this.receiver.removeVehicle(
      request.payload.vehicleId,
      request.userId
    );
    return MobilityResponse.ok(data);
  }
}

module.exports = {
  GetProviderVehiclesCommand,
  AddVehicleCommand,
  UpdateVehicleCommand,
  DeactivateVehicleCommand,
};
