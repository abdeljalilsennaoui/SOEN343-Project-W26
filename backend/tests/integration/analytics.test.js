/**
 * Integration tests: Analytics API flows
 *
 * Two auth personas used:
 *   - CITY_ADMINISTRATOR (has access to analytics endpoints)
 *   - COMMUTER          (should be rejected with 403)
 *
 * Mocks: requireAuth (role-injecting), MobilityDataGateway, AnalyticsReport.
 */
// Role is controlled per test via this module-level object (mutable, closure-safe)
const mockUser = { uid: 'admin-1', role: 'CITY_ADMINISTRATOR' };

jest.mock('../../src/middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.uid = mockUser.uid;
    req.role = mockUser.role;
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

const rentalData = {
  totalRentals: 42,
  rentalsByCity: { Montreal: 20, Toronto: 22 },
  rentalsByType: { BIKE_SHARING: 15, CAR_SHARING: 27 },
};

const gatewayData = {
  totalGatewayCalls: 100,
  callsByService: { payment: 50, transit: 30, parking: 20 },
  transitQueries: 30,
  parkingReservations: 20,
};

describe('GET /api/analytics/rentals', () => {
  beforeEach(() => {
    mockUser.role = 'CITY_ADMINISTRATOR';
    mockUser.uid = 'admin-1';
    gateway.getRentalAnalytics.mockResolvedValue(rentalData);
  });

  it('200 — returns rental analytics for CITY_ADMINISTRATOR', async () => {
    const res = await request(app).get('/api/analytics/rentals');
    expect(res.status).toBe(200);
    expect(res.body.data.totalRentals).toBe(42);
    expect(res.body.data.rentalsByCity).toHaveProperty('Montreal', 20);
    expect(res.body.data.rentalsByType).toHaveProperty('BIKE_SHARING', 15);
  });

  it('200 — returns rental analytics for MOBILITY_PROVIDER', async () => {
    mockUser.role = 'MOBILITY_PROVIDER';
    mockUser.uid = 'provider-1';
    gateway.getRentalAnalytics.mockResolvedValue(rentalData);
    const res = await request(app).get('/api/analytics/rentals');
    expect(res.status).toBe(200);
    expect(res.body.data.totalRentals).toBe(42);
  });

  it('200 — returns rental analytics for SYSTEM_ADMINISTRATOR', async () => {
    mockUser.role = 'SYSTEM_ADMINISTRATOR';
    const res = await request(app).get('/api/analytics/rentals');
    expect(res.status).toBe(200);
  });

  it('403 — COMMUTER cannot access rental analytics', async () => {
    mockUser.role = 'COMMUTER';
    const res = await request(app).get('/api/analytics/rentals');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('calls getRentalAnalytics on the gateway', async () => {
    await request(app).get('/api/analytics/rentals');
    expect(gateway.getRentalAnalytics).toHaveBeenCalled();
  });
});

describe('GET /api/analytics/gateway', () => {
  beforeEach(() => {
    mockUser.role = 'CITY_ADMINISTRATOR';
    mockUser.uid = 'admin-1';
    gateway.getGatewayAnalytics.mockResolvedValue(gatewayData);
  });

  it('200 — returns gateway analytics with totalGatewayCalls', async () => {
    const res = await request(app).get('/api/analytics/gateway');
    expect(res.status).toBe(200);
    expect(res.body.data.totalGatewayCalls).toBe(100);
    expect(res.body.data.transitQueries).toBe(30);
    expect(res.body.data.parkingReservations).toBe(20);
  });

  it('200 — callsByService is included in response', async () => {
    const res = await request(app).get('/api/analytics/gateway');
    expect(res.body.data.callsByService).toEqual({ payment: 50, transit: 30, parking: 20 });
  });

  it('403 — COMMUTER cannot access gateway analytics', async () => {
    mockUser.role = 'COMMUTER';
    const res = await request(app).get('/api/analytics/gateway');
    expect(res.status).toBe(403);
  });

  it('calls getGatewayAnalytics on the gateway', async () => {
    await request(app).get('/api/analytics/gateway');
    expect(gateway.getGatewayAnalytics).toHaveBeenCalled();
  });
});
