/**
 * Parking Commands — Command Pattern (concrete commands)
 *
 * Each class encapsulates one parking-related operation.
 * Receiver: MobilityService (injected via constructor).
 * Invoker:  MobilityRequestHandler (calls execute()).
 */
const ICommand = require('./ICommand');
const MobilityResponse = require('../mvc/MobilityResponse');

// ── GetParkingFacilitiesCommand ──────────────────────────────────────────────

class GetParkingFacilitiesCommand extends ICommand {
  constructor(receiver) {
    super();
    this.receiver = receiver;
  }

  async execute(request) {
    const data = await this.receiver.getParkingFacilities(request.payload.city);
    return MobilityResponse.ok(data);
  }
}

// ── GetFacilitySpotsCommand ──────────────────────────────────────────────────

class GetFacilitySpotsCommand extends ICommand {
  constructor(receiver) {
    super();
    this.receiver = receiver;
  }

  async execute(request) {
    const result = await this.receiver.getFacilityWithSpots(request.payload.facilityId);
    if (!result) {
      return MobilityResponse.fail({ code: 'NOT_FOUND', message: 'Facility not found' }, 404);
    }
    return MobilityResponse.ok(result);
  }
}

// ── GetAvailableSpotsCommand ─────────────────────────────────────────────────

class GetAvailableSpotsCommand extends ICommand {
  constructor(receiver) {
    super();
    this.receiver = receiver;
  }

  async execute(request) {
    const data = await this.receiver.getAvailableSpots(request.payload.city);
    return MobilityResponse.ok(data);
  }
}

// ── ReserveParkingSpotCommand ────────────────────────────────────────────────

class ReserveParkingSpotCommand extends ICommand {
  constructor(receiver) {
    super();
    this.receiver = receiver;
  }

  async execute(request) {
    const data = await this.receiver.reserveParkingSpot(request.payload.spotId);
    return MobilityResponse.ok(data);
  }
}

// ── ReleaseParkingSpotCommand ────────────────────────────────────────────────

class ReleaseParkingSpotCommand extends ICommand {
  constructor(receiver) {
    super();
    this.receiver = receiver;
  }

  async execute(request) {
    const data = await this.receiver.releaseParkingSpot(request.payload.spotId);
    return MobilityResponse.ok(data);
  }
}

module.exports = {
  GetParkingFacilitiesCommand,
  GetFacilitySpotsCommand,
  GetAvailableSpotsCommand,
  ReserveParkingSpotCommand,
  ReleaseParkingSpotCommand,
};
