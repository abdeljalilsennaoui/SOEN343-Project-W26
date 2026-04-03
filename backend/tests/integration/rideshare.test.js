/**
 * Integration tests: Ride-share API flows
 *
 * Mocks: requireAuth (COMMUTER), MobilityDataGateway, AnalyticsReport.
 * Real: full MVC → Command → Service chain, including joinRide/leaveRide guard logic.
 */
jest.mock('../../src/middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.uid = 'passenger-1';
    req.role = 'COMMUTER';
    next();
  },
}));

jest.mock('../../src/mvc/MobilityDataGateway');

jest.mock('../../src/models/AnalyticsReport', () => ({
  trackEvent: jest.fn().mockResolvedValue(undefined),
  getRentalAnalytics: jest.fn(),
  getGatewayAnalytics: jest.fn(),
}));

const request = require('supertest');
const app = require('../../src/app');
const gateway = require('../../src/mvc/MobilityDataGateway');

const BASE = '/api/bookings';

const mockRide = {
  id: 'ride-1',
  userId: 'driver-1',        // driver ≠ passenger-1
  optionId: 'opt-car',
  startTime: '2024-07-01T10:00:00Z',
  endTime: '2024-07-01T11:00:00Z',
  pickupLocation: 'Downtown',
  totalPrice: 60,
  status: 'ACTIVE',
  rideSharing: true,
  maxPassengers: 2,
  passengers: [],
};

describe('GET /api/bookings/rideshare', () => {
  it('200 — lists active shared rides', async () => {
    gateway.findActiveRideShares.mockResolvedValue([mockRide]);
    const res = await request(app).get(`${BASE}/rideshare`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].rideSharing).toBe(true);
    expect(res.body.count).toBe(1);
  });

  it('200 — returns empty array when no rides are active', async () => {
    gateway.findActiveRideShares.mockResolvedValue([]);
    const res = await request(app).get(`${BASE}/rideshare`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.count).toBe(0);
  });
});

describe('POST /api/bookings/rideshare/:bookingId/join', () => {
  const rideWithPassenger = { ...mockRide, passengers: ['passenger-1'] };

  beforeEach(() => {
    gateway.findBooking.mockResolvedValue(mockRide);
    gateway.updateBooking.mockResolvedValue(rideWithPassenger);
  });

  it('200 — joins a ride and returns updated booking', async () => {
    const res = await request(app).post(`${BASE}/rideshare/ride-1/join`);
    expect(res.status).toBe(200);
    expect(res.body.data.passengers).toContain('passenger-1');
  });

  it('calls updateBooking with the passenger added', async () => {
    await request(app).post(`${BASE}/rideshare/ride-1/join`);
    expect(gateway.updateBooking).toHaveBeenCalledWith(
      'ride-1',
      expect.objectContaining({ passengers: expect.arrayContaining(['passenger-1']) }),
    );
  });

  it('404 — booking not found', async () => {
    gateway.findBooking.mockResolvedValue(null);
    const res = await request(app).post(`${BASE}/rideshare/nonexistent/join`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('BOOKING_NOT_FOUND');
  });

  it('400 — cannot join a DRAFT ride (not active)', async () => {
    gateway.findBooking.mockResolvedValue({ ...mockRide, status: 'DRAFT' });
    const res = await request(app).post(`${BASE}/rideshare/ride-1/join`);
    expect(res.status).toBe(400);
  });

  it('400 — cannot join a ride with rideSharing=false', async () => {
    gateway.findBooking.mockResolvedValue({ ...mockRide, rideSharing: false });
    const res = await request(app).post(`${BASE}/rideshare/ride-1/join`);
    expect(res.status).toBe(400);
  });

  it('403 — driver cannot join their own ride', async () => {
    // Set up the ride so the driver is passenger-1 (the authenticated user)
    gateway.findBooking.mockResolvedValue({ ...mockRide, userId: 'passenger-1' });
    const res = await request(app).post(`${BASE}/rideshare/ride-1/join`);
    expect(res.status).toBe(403);
  });

  it('409 — already joined returns ALREADY_JOINED conflict', async () => {
    gateway.findBooking.mockResolvedValue({ ...mockRide, passengers: ['passenger-1'] });
    const res = await request(app).post(`${BASE}/rideshare/ride-1/join`);
    expect(res.status).toBe(409);
  });

  it('409 — returns conflict when ride is full', async () => {
    gateway.findBooking.mockResolvedValue({
      ...mockRide,
      maxPassengers: 1,
      passengers: ['other-passenger'],
    });
    const res = await request(app).post(`${BASE}/rideshare/ride-1/join`);
    expect(res.status).toBe(409);
  });
});

describe('POST /api/bookings/rideshare/:bookingId/leave', () => {
  const rideWithPassenger = { ...mockRide, passengers: ['passenger-1'] };
  const rideAfterLeave   = { ...mockRide, passengers: [] };

  beforeEach(() => {
    gateway.findBooking.mockResolvedValue(rideWithPassenger);
    gateway.updateBooking.mockResolvedValue(rideAfterLeave);
  });

  it('200 — leaves a ride and returns updated booking', async () => {
    const res = await request(app).post(`${BASE}/rideshare/ride-1/leave`);
    expect(res.status).toBe(200);
    expect(res.body.data.passengers).not.toContain('passenger-1');
  });

  it('calls updateBooking with passenger removed', async () => {
    await request(app).post(`${BASE}/rideshare/ride-1/leave`);
    expect(gateway.updateBooking).toHaveBeenCalledWith(
      'ride-1',
      expect.objectContaining({ passengers: expect.not.arrayContaining(['passenger-1']) }),
    );
  });

  it('404 — booking not found', async () => {
    gateway.findBooking.mockResolvedValue(null);
    const res = await request(app).post(`${BASE}/rideshare/nonexistent/leave`);
    expect(res.status).toBe(404);
  });

  it('400 — cannot leave a ride if not a passenger', async () => {
    gateway.findBooking.mockResolvedValue({ ...mockRide, passengers: ['someone-else'] });
    const res = await request(app).post(`${BASE}/rideshare/ride-1/leave`);
    expect(res.status).toBe(400);
  });
});
