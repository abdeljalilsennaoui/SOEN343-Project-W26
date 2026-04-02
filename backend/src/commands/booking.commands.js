/**
 * Booking Commands — Command Pattern (concrete commands)
 *
 * Each class encapsulates one step of the booking lifecycle.
 * Receiver: MobilityService (injected via constructor).
 * Invoker:  MobilityRequestHandler (calls execute()).
 */
const ICommand = require('./ICommand');
const MobilityResponse = require('../mvc/MobilityResponse');

// ── CreateBookingDraftCommand ────────────────────────────────────────────────

class CreateBookingDraftCommand extends ICommand {
  constructor(receiver) {
    super();
    this.receiver = receiver;
  }

  async execute(request) {
    const draft = await this.receiver.createReservation({
      userId: request.userId,
      ...request.payload,
    });
    return MobilityResponse.created(draft);
  }
}

// ── ConfirmBookingCommand ────────────────────────────────────────────────────

class ConfirmBookingCommand extends ICommand {
  constructor(receiver) {
    super();
    this.receiver = receiver;
  }

  async execute(request) {
    const data = await this.receiver.processPayment(
      request.payload.draftId,
      request.userId,
      request.payload.paymentDetails
    );
    return MobilityResponse.ok(data);
  }
}

// ── CompleteBookingCommand ───────────────────────────────────────────────────

class CompleteBookingCommand extends ICommand {
  constructor(receiver) {
    super();
    this.receiver = receiver;
  }

  async execute(request) {
    const data = await this.receiver.returnVehicle(
      request.payload.bookingId,
      request.userId
    );
    return MobilityResponse.ok(data);
  }
}

// ── GetMyBookingsCommand ─────────────────────────────────────────────────────

class GetMyBookingsCommand extends ICommand {
  constructor(receiver) {
    super();
    this.receiver = receiver;
  }

  async execute(request) {
    const data = await this.receiver.getMyBookings(request.userId);
    return MobilityResponse.ok(data);
  }
}

// ── ListRideSharesCommand ────────────────────────────────────────────────────

class ListRideSharesCommand extends ICommand {
  constructor(receiver) {
    super();
    this.receiver = receiver;
  }

  async execute() {
    const data = await this.receiver.getActiveRideShares();
    return MobilityResponse.ok(data);
  }
}

// ── JoinRideCommand ──────────────────────────────────────────────────────────

class JoinRideCommand extends ICommand {
  constructor(receiver) {
    super();
    this.receiver = receiver;
  }

  async execute(request) {
    const data = await this.receiver.joinRide(request.payload.bookingId, request.userId);
    return MobilityResponse.ok(data);
  }
}

// ── LeaveRideCommand ─────────────────────────────────────────────────────────

class LeaveRideCommand extends ICommand {
  constructor(receiver) {
    super();
    this.receiver = receiver;
  }

  async execute(request) {
    const data = await this.receiver.leaveRide(request.payload.bookingId, request.userId);
    return MobilityResponse.ok(data);
  }
}

module.exports = {
  CreateBookingDraftCommand,
  ConfirmBookingCommand,
  CompleteBookingCommand,
  GetMyBookingsCommand,
  ListRideSharesCommand,
  JoinRideCommand,
  LeaveRideCommand,
};
