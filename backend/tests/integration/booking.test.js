/**
 * Integration tests: Booking API flows
 *
 * Mocks: requireAuth (inject COMMUTER identity), MobilityDataGateway (Firestore),
 *        AnalyticsReport (fire-and-forget Firestore calls from PersistenceVisitor).
 * Real: MobilityController → MobilityRequestHandler → CommandRegistry → MobilityService
 *       → BookingStateMachine, PricingService, AvailabilityService, MockPaymentGateway.
 */
jest.mock('../../src/middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.uid = 'user-1';
    req.role = 'COMMUTER';
    next();
  },
}));

jest.mock('../../src/mvc/MobilityDataGateway');

jest.mock('../../src/models/AnalyticsReport', () => ({
  trackEvent: jest.fn().mockResolvedValue(undefined),
  getRentalAnalytics: jest.fn().mockResolvedValue({ totalRentals: 0, rentalsByCity: {}, rentalsByType: {} }),
  getGatewayAnalytics: jest.fn().mockResolvedValue({ totalGatewayCalls: 0, callsByService: {}, transitQueries: 0, parkingReservations: 0 }),
}));

const request = require('supertest');
const app = require('../../src/app');
const gateway = require('../../src/mvc/MobilityDataGateway');

const BASE = '/api/bookings';

const mockOption = {
  id: 'opt-1',
  city: 'Montreal',
  type: 'BIKE_SHARING',
  basePrice: 1,
  capacity: 1,
  description: 'Bike',
  providerId: null,
  blockedPeriods: [],
};

const mockDraft = {
  id: 'book-1',
  userId: 'user-1',
  optionId: 'opt-1',
  startTime: '2024-07-01T10:00:00Z',
  endTime: '2024-07-01T11:00:00Z',
  pickupLocation: 'Station A',
  totalPrice: 60,
  status: 'DRAFT',
  rideSharing: false,
  maxPassengers: 0,
  passengers: [],
};

const mockActive = { ...mockDraft, status: 'ACTIVE' };
const mockComplete = { ...mockDraft, status: 'COMPLETE' };

const validDraftBody = {
  optionId: 'opt-1',
  startTime: '2024-07-01T10:00:00Z',
  endTime: '2024-07-01T11:00:00Z',
  pickupLocation: 'Station A',
};

describe('POST /api/bookings/draft', () => {
  beforeEach(() => {
    gateway.findMobilityOption.mockResolvedValue(mockOption);
    gateway.findActiveAndDraftBookings.mockResolvedValue([]);
    gateway.saveBooking.mockResolvedValue(mockDraft);
  });

  it('201 — creates a DRAFT booking with valid payload', async () => {
    const res = await request(app).post(`${BASE}/draft`).send(validDraftBody);
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('DRAFT');
    expect(res.body.data.userId).toBe('user-1');
    expect(res.body.data.optionId).toBe('opt-1');
  });

  it('calls saveBooking with the authenticated userId (not from body)', async () => {
    await request(app).post(`${BASE}/draft`).send(validDraftBody);
    expect(gateway.saveBooking).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1' }),
    );
  });

  it('404 — returns OPTION_NOT_FOUND when optionId does not exist', async () => {
    gateway.findMobilityOption.mockResolvedValue(null);
    const res = await request(app).post(`${BASE}/draft`).send(validDraftBody);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('OPTION_NOT_FOUND');
  });

  it('409 — returns BOOKING_NOT_AVAILABLE when slot is full', async () => {
    gateway.findActiveAndDraftBookings.mockResolvedValue([mockDraft]);
    const res = await request(app).post(`${BASE}/draft`).send(validDraftBody);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('BOOKING_NOT_AVAILABLE');
  });

  it('400 — fails validation when required fields are missing', async () => {
    const res = await request(app).post(`${BASE}/draft`).send({ optionId: 'opt-1' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('400 — rejects rideSharing on a non-CAR_SHARING option', async () => {
    const res = await request(app).post(`${BASE}/draft`).send({ ...validDraftBody, rideSharing: true });
    // mockOption.type = 'BIKE_SHARING' — ride sharing not allowed
    expect(res.status).toBe(400);
  });
});

describe('POST /api/bookings/:draftId/confirm', () => {
  beforeEach(() => {
    gateway.findBooking.mockResolvedValue(mockDraft);
    gateway.findMobilityOption.mockResolvedValue(mockOption);
    gateway.findActiveAndDraftBookings.mockResolvedValue([]);
    gateway.updateBooking.mockResolvedValue(mockActive);
    gateway.saveReceipt.mockResolvedValue({ id: 'receipt-1', bookingId: 'book-1', amount: 60, status: 'SUCCESS' });
  });

  it('200 — confirms booking and returns ACTIVE status + receipt', async () => {
    const res = await request(app)
      .post(`${BASE}/book-1/confirm`)
      .send({ paymentDetails: { token: 'valid-token' } });

    expect(res.status).toBe(200);
    expect(res.body.data.booking.status).toBe('ACTIVE');
    expect(res.body.data.receipt).toBeDefined();
  });

  it('402 — returns PAYMENT_FAILED for a declined payment token', async () => {
    gateway.updateBooking.mockResolvedValue({ ...mockDraft, status: 'FAILED' });
    gateway.saveReceipt.mockResolvedValue({ id: 'r-2', status: 'FAILED' });

    const res = await request(app)
      .post(`${BASE}/book-1/confirm`)
      .send({ paymentDetails: { token: 'fail' } });

    expect(res.status).toBe(402);
    expect(res.body.error.code).toBe('PAYMENT_FAILED');
  });

  it('404 — returns BOOKING_NOT_FOUND for unknown draftId', async () => {
    gateway.findBooking.mockResolvedValue(null);
    const res = await request(app)
      .post(`${BASE}/unknown-id/confirm`)
      .send({ paymentDetails: { token: 'valid' } });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('BOOKING_NOT_FOUND');
  });

  it('409 — returns DRAFT_INVALID_STATE when booking is already ACTIVE', async () => {
    gateway.findBooking.mockResolvedValue(mockActive);
    const res = await request(app)
      .post(`${BASE}/book-1/confirm`)
      .send({ paymentDetails: { token: 'valid' } });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DRAFT_INVALID_STATE');
  });

  it('403 — cannot confirm another user\'s booking', async () => {
    gateway.findBooking.mockResolvedValue({ ...mockDraft, userId: 'other-user' });
    const res = await request(app)
      .post(`${BASE}/book-1/confirm`)
      .send({ paymentDetails: { token: 'valid' } });

    expect(res.status).toBe(403);
  });
});

describe('POST /api/bookings/:bookingId/complete', () => {
  beforeEach(() => {
    gateway.findBooking.mockResolvedValue(mockActive);
    gateway.updateBooking.mockResolvedValue(mockComplete);
  });

  it('200 — marks booking COMPLETE', async () => {
    const res = await request(app).post(`${BASE}/book-1/complete`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('COMPLETE');
  });

  it('is idempotent — returns COMPLETE if already complete', async () => {
    gateway.findBooking.mockResolvedValue(mockComplete);
    const res = await request(app).post(`${BASE}/book-1/complete`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('COMPLETE');
  });

  it('404 — returns BOOKING_NOT_FOUND for unknown id', async () => {
    gateway.findBooking.mockResolvedValue(null);
    const res = await request(app).post(`${BASE}/unknown/complete`);
    expect(res.status).toBe(404);
  });

  it('409 — cannot complete a DRAFT (illegal state)', async () => {
    gateway.findBooking.mockResolvedValue(mockDraft);
    const res = await request(app).post(`${BASE}/book-1/complete`);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DRAFT_INVALID_STATE');
  });
});

describe('GET /api/bookings', () => {
  it('200 — returns user bookings with count', async () => {
    gateway.findBookingsByUser.mockResolvedValue([mockDraft, mockActive]);
    const res = await request(app).get(BASE);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.count).toBe(2);
  });

  it('200 — returns empty array when user has no bookings', async () => {
    gateway.findBookingsByUser.mockResolvedValue([]);
    const res = await request(app).get(BASE);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.count).toBe(0);
  });

  it('calls findBookingsByUser with the authenticated uid', async () => {
    gateway.findBookingsByUser.mockResolvedValue([]);
    await request(app).get(BASE);
    expect(gateway.findBookingsByUser).toHaveBeenCalledWith('user-1');
  });
});
