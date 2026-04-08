const MobilityRequest  = require('../../../src/mvc/MobilityRequest');
const MobilityResponse = require('../../../src/mvc/MobilityResponse');
const {
  CreateBookingDraftCommand,
  ConfirmBookingCommand,
  CompleteBookingCommand,
  GetMyBookingsCommand,
  ListRideSharesCommand,
  JoinRideCommand,
  LeaveRideCommand,
} = require('../../../src/commands/booking.commands');

function makeRequest(type, userId, payload = {}) {
  return new MobilityRequest(type, userId, payload);
}

// ── CreateBookingDraftCommand ────────────────────────────────────────────────

describe('CreateBookingDraftCommand', () => {
  const draft = { id: 'b-1', status: 'DRAFT' };

  function makeReceiver() {
    return { createReservation: jest.fn().mockResolvedValue(draft) };
  }

  it('delegates to receiver.createReservation with userId and payload spread', async () => {
    const receiver = makeReceiver();
    const cmd = new CreateBookingDraftCommand(receiver);
    const req = makeRequest(MobilityRequest.TYPES.CREATE_BOOKING_DRAFT, 'u-1', {
      optionId: 'opt-1', startTime: '2026-01-01T10:00:00Z', endTime: '2026-01-01T11:00:00Z',
    });

    await cmd.execute(req);

    expect(receiver.createReservation).toHaveBeenCalledWith({
      userId: 'u-1',
      optionId: 'opt-1',
      startTime: '2026-01-01T10:00:00Z',
      endTime: '2026-01-01T11:00:00Z',
    });
  });

  it('returns a 201 MobilityResponse wrapping the draft', async () => {
    const receiver = makeReceiver();
    const cmd = new CreateBookingDraftCommand(receiver);
    const req = makeRequest(MobilityRequest.TYPES.CREATE_BOOKING_DRAFT, 'u-1', { optionId: 'opt-1' });

    const res = await cmd.execute(req);

    expect(res).toBeInstanceOf(MobilityResponse);
    expect(res.statusCode).toBe(201);
    expect(res.data).toEqual(draft);
  });

  it('propagates errors from the receiver', async () => {
    const receiver = { createReservation: jest.fn().mockRejectedValue(new Error('unavailable')) };
    const cmd = new CreateBookingDraftCommand(receiver);

    await expect(cmd.execute(makeRequest(MobilityRequest.TYPES.CREATE_BOOKING_DRAFT, 'u-1'))).rejects.toThrow('unavailable');
  });
});

// ── ConfirmBookingCommand ────────────────────────────────────────────────────

describe('ConfirmBookingCommand', () => {
  const result = { booking: { id: 'b-1', status: 'ACTIVE' }, receipt: {} };

  function makeReceiver() {
    return { processPayment: jest.fn().mockResolvedValue(result) };
  }

  it('calls receiver.processPayment with draftId, userId, and paymentDetails', async () => {
    const receiver = makeReceiver();
    const cmd = new ConfirmBookingCommand(receiver);
    const req = makeRequest(MobilityRequest.TYPES.CONFIRM_BOOKING, 'u-1', {
      draftId: 'b-1', paymentDetails: { token: 'tok_demo' },
    });

    await cmd.execute(req);

    expect(receiver.processPayment).toHaveBeenCalledWith('b-1', 'u-1', { token: 'tok_demo' });
  });

  it('returns a 200 MobilityResponse on success', async () => {
    const receiver = makeReceiver();
    const cmd = new ConfirmBookingCommand(receiver);
    const req = makeRequest(MobilityRequest.TYPES.CONFIRM_BOOKING, 'u-1', {
      draftId: 'b-1', paymentDetails: { token: 'tok_demo' },
    });

    const res = await cmd.execute(req);

    expect(res.statusCode).toBe(200);
    expect(res.data).toEqual(result);
  });

  it('propagates payment errors', async () => {
    const receiver = { processPayment: jest.fn().mockRejectedValue(new Error('PAYMENT_FAILED')) };
    const cmd = new ConfirmBookingCommand(receiver);

    await expect(cmd.execute(makeRequest(MobilityRequest.TYPES.CONFIRM_BOOKING, 'u-1', { draftId: 'b-1', paymentDetails: {} }))).rejects.toThrow('PAYMENT_FAILED');
  });
});

// ── CompleteBookingCommand ───────────────────────────────────────────────────

describe('CompleteBookingCommand', () => {
  const completed = { id: 'b-1', status: 'COMPLETE' };

  function makeReceiver() {
    return { returnVehicle: jest.fn().mockResolvedValue(completed) };
  }

  it('calls receiver.returnVehicle with bookingId and userId', async () => {
    const receiver = makeReceiver();
    const cmd = new CompleteBookingCommand(receiver);
    const req = makeRequest(MobilityRequest.TYPES.COMPLETE_BOOKING, 'u-1', { bookingId: 'b-1' });

    await cmd.execute(req);

    expect(receiver.returnVehicle).toHaveBeenCalledWith('b-1', 'u-1');
  });

  it('returns 200 with completed booking', async () => {
    const receiver = makeReceiver();
    const cmd = new CompleteBookingCommand(receiver);
    const res = await cmd.execute(makeRequest(MobilityRequest.TYPES.COMPLETE_BOOKING, 'u-1', { bookingId: 'b-1' }));

    expect(res.statusCode).toBe(200);
    expect(res.data).toEqual(completed);
  });

  it('propagates errors from the receiver', async () => {
    const receiver = { returnVehicle: jest.fn().mockRejectedValue(new Error('not found')) };
    const cmd = new CompleteBookingCommand(receiver);

    await expect(cmd.execute(makeRequest(MobilityRequest.TYPES.COMPLETE_BOOKING, 'u-1', { bookingId: 'missing' }))).rejects.toThrow('not found');
  });
});

// ── GetMyBookingsCommand ─────────────────────────────────────────────────────

describe('GetMyBookingsCommand', () => {
  const bookings = [{ id: 'b-1' }, { id: 'b-2' }];

  it('calls receiver.getMyBookings with userId', async () => {
    const receiver = { getMyBookings: jest.fn().mockResolvedValue(bookings) };
    const cmd = new GetMyBookingsCommand(receiver);
    const req = makeRequest(MobilityRequest.TYPES.GET_MY_BOOKINGS, 'u-1');

    const res = await cmd.execute(req);

    expect(receiver.getMyBookings).toHaveBeenCalledWith('u-1');
    expect(res.data).toEqual(bookings);
    expect(res.statusCode).toBe(200);
  });
});

// ── ListRideSharesCommand ────────────────────────────────────────────────────

describe('ListRideSharesCommand', () => {
  it('calls receiver.getActiveRideShares and returns results', async () => {
    const rides = [{ id: 'b-3', rideSharing: true }];
    const receiver = { getActiveRideShares: jest.fn().mockResolvedValue(rides) };
    const cmd = new ListRideSharesCommand(receiver);

    const res = await cmd.execute(makeRequest(MobilityRequest.TYPES.LIST_RIDE_SHARES, 'u-1'));

    expect(receiver.getActiveRideShares).toHaveBeenCalled();
    expect(res.data).toEqual(rides);
  });
});

// ── JoinRideCommand ──────────────────────────────────────────────────────────

describe('JoinRideCommand', () => {
  it('calls receiver.joinRide with bookingId and userId', async () => {
    const updated = { id: 'b-3', passengers: ['u-2'] };
    const receiver = { joinRide: jest.fn().mockResolvedValue(updated) };
    const cmd = new JoinRideCommand(receiver);
    const req = makeRequest(MobilityRequest.TYPES.JOIN_RIDE, 'u-2', { bookingId: 'b-3' });

    const res = await cmd.execute(req);

    expect(receiver.joinRide).toHaveBeenCalledWith('b-3', 'u-2');
    expect(res.data).toEqual(updated);
  });

  it('propagates errors from the receiver', async () => {
    const receiver = { joinRide: jest.fn().mockRejectedValue(new Error('RIDE_FULL')) };
    const cmd = new JoinRideCommand(receiver);

    await expect(cmd.execute(makeRequest(MobilityRequest.TYPES.JOIN_RIDE, 'u-2', { bookingId: 'b-3' }))).rejects.toThrow('RIDE_FULL');
  });
});

// ── LeaveRideCommand ─────────────────────────────────────────────────────────

describe('LeaveRideCommand', () => {
  it('calls receiver.leaveRide with bookingId and userId', async () => {
    const updated = { id: 'b-3', passengers: [] };
    const receiver = { leaveRide: jest.fn().mockResolvedValue(updated) };
    const cmd = new LeaveRideCommand(receiver);
    const req = makeRequest(MobilityRequest.TYPES.LEAVE_RIDE, 'u-2', { bookingId: 'b-3' });

    const res = await cmd.execute(req);

    expect(receiver.leaveRide).toHaveBeenCalledWith('b-3', 'u-2');
    expect(res.data).toEqual(updated);
  });

  it('propagates errors from the receiver', async () => {
    const receiver = { leaveRide: jest.fn().mockRejectedValue(new Error('NOT_A_PASSENGER')) };
    const cmd = new LeaveRideCommand(receiver);

    await expect(cmd.execute(makeRequest(MobilityRequest.TYPES.LEAVE_RIDE, 'u-2', { bookingId: 'b-3' }))).rejects.toThrow('NOT_A_PASSENGER');
  });
});
