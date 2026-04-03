// Mock MobilityDataGateway before importing AvailabilityService
jest.mock('../../../src/mvc/MobilityDataGateway', () => ({
  findActiveAndDraftBookings: jest.fn(),
}));

const { checkAvailability, isAvailable, checkAvailabilityBatch } = require('../../../src/services/AvailabilityService');
const gateway = require('../../../src/mvc/MobilityDataGateway');

const START = '2024-06-15T10:00:00Z';
const END   = '2024-06-15T11:00:00Z';

function makeBooking(overrides = {}) {
  return {
    id: 'b-default',
    optionId: 'opt-1',
    startTime: START,
    endTime: END,
    status: 'ACTIVE',
    ...overrides,
  };
}

function makeOption(overrides = {}) {
  return { id: 'opt-1', capacity: 1, blockedPeriods: [], ...overrides };
}

describe('AvailabilityService.checkAvailability()', () => {
  it('returns available when there are no bookings', async () => {
    gateway.findActiveAndDraftBookings.mockResolvedValue([]);
    const result = await checkAvailability(makeOption(), START, END);
    expect(result.available).toBe(true);
    expect(result.remaining).toBe(1);
    expect(result.conflicting).toBe(0);
  });

  it('returns unavailable when capacity is fully booked', async () => {
    gateway.findActiveAndDraftBookings.mockResolvedValue([makeBooking()]);
    const result = await checkAvailability(makeOption({ capacity: 1 }), START, END);
    expect(result.available).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.conflicting).toBe(1);
  });

  it('returns available when capacity allows more bookings', async () => {
    gateway.findActiveAndDraftBookings.mockResolvedValue([makeBooking()]);
    const result = await checkAvailability(makeOption({ capacity: 2 }), START, END);
    expect(result.available).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('excludes a specific bookingId from the conflict count', async () => {
    gateway.findActiveAndDraftBookings.mockResolvedValue([makeBooking({ id: 'b-exclude' })]);
    const result = await checkAvailability(makeOption({ capacity: 1 }), START, END, 'b-exclude');
    expect(result.available).toBe(true);
    expect(result.conflicting).toBe(0);
  });

  it('ignores bookings for a different optionId', async () => {
    gateway.findActiveAndDraftBookings.mockResolvedValue([makeBooking({ optionId: 'opt-other' })]);
    const result = await checkAvailability(makeOption(), START, END);
    expect(result.available).toBe(true);
    expect(result.conflicting).toBe(0);
  });

  it('detects overlap: booking starts before and ends during the window', async () => {
    const booking = makeBooking({ startTime: '2024-06-15T09:30:00Z', endTime: '2024-06-15T10:30:00Z' });
    gateway.findActiveAndDraftBookings.mockResolvedValue([booking]);
    const result = await checkAvailability(makeOption(), START, END);
    expect(result.conflicting).toBe(1);
  });

  it('detects overlap: booking starts during and ends after the window', async () => {
    const booking = makeBooking({ startTime: '2024-06-15T10:30:00Z', endTime: '2024-06-15T11:30:00Z' });
    gateway.findActiveAndDraftBookings.mockResolvedValue([booking]);
    const result = await checkAvailability(makeOption(), START, END);
    expect(result.conflicting).toBe(1);
  });

  it('no conflict when booking ends exactly at window start (adjacent, not overlapping)', async () => {
    const booking = makeBooking({ startTime: '2024-06-15T09:00:00Z', endTime: '2024-06-15T10:00:00Z' });
    gateway.findActiveAndDraftBookings.mockResolvedValue([booking]);
    const result = await checkAvailability(makeOption(), START, END);
    expect(result.conflicting).toBe(0);
  });

  it('no conflict when booking starts exactly at window end', async () => {
    const booking = makeBooking({ startTime: '2024-06-15T11:00:00Z', endTime: '2024-06-15T12:00:00Z' });
    gateway.findActiveAndDraftBookings.mockResolvedValue([booking]);
    const result = await checkAvailability(makeOption(), START, END);
    expect(result.conflicting).toBe(0);
  });

  describe('blocked periods', () => {
    it('returns unavailable when a blocked period overlaps the window', async () => {
      gateway.findActiveAndDraftBookings.mockResolvedValue([]);
      const option = makeOption({ blockedPeriods: [{ start: '2024-06-15T09:00:00Z', end: '2024-06-15T10:30:00Z' }] });
      const result = await checkAvailability(option, START, END);
      expect(result.available).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('allows booking when blocked period does not overlap', async () => {
      gateway.findActiveAndDraftBookings.mockResolvedValue([]);
      const option = makeOption({ blockedPeriods: [{ start: '2024-06-15T12:00:00Z', end: '2024-06-15T13:00:00Z' }] });
      const result = await checkAvailability(option, START, END);
      expect(result.available).toBe(true);
    });
  });
});

describe('AvailabilityService.isAvailable()', () => {
  it('returns true when available', async () => {
    gateway.findActiveAndDraftBookings.mockResolvedValue([]);
    const result = await isAvailable(makeOption(), START, END);
    expect(result).toBe(true);
  });

  it('returns false when not available', async () => {
    gateway.findActiveAndDraftBookings.mockResolvedValue([makeBooking()]);
    const result = await isAvailable(makeOption({ capacity: 1 }), START, END);
    expect(result).toBe(false);
  });
});

describe('AvailabilityService.checkAvailabilityBatch()', () => {
  it('reads bookings once and returns a Map for all options', async () => {
    const opt1 = makeOption({ id: 'opt-1', capacity: 1 });
    const opt2 = makeOption({ id: 'opt-2', capacity: 2 });
    gateway.findActiveAndDraftBookings.mockResolvedValue([makeBooking({ optionId: 'opt-1' })]);

    const resultMap = await checkAvailabilityBatch([opt1, opt2], START, END);

    expect(gateway.findActiveAndDraftBookings).toHaveBeenCalledTimes(1);
    expect(resultMap.get('opt-1').available).toBe(false);
    expect(resultMap.get('opt-2').available).toBe(true);
  });

  it('marks option as unavailable when its blocked period overlaps', async () => {
    const opt = makeOption({ id: 'opt-blocked', blockedPeriods: [{ start: '2024-06-15T09:00:00Z', end: '2024-06-15T10:30:00Z' }] });
    gateway.findActiveAndDraftBookings.mockResolvedValue([]);

    const resultMap = await checkAvailabilityBatch([opt], START, END);
    expect(resultMap.get('opt-blocked').available).toBe(false);
  });

  it('returns empty Map for empty options array', async () => {
    gateway.findActiveAndDraftBookings.mockResolvedValue([]);
    const resultMap = await checkAvailabilityBatch([], START, END);
    expect(resultMap.size).toBe(0);
  });
});
