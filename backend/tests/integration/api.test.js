/**
 * Integration tests: legacy API flows + MVC vehicle/parking routes
 *
 * Mocks: requireAuth (CITY_ADMINISTRATOR), firestore (stateful in-memory).
 * Real:  full controller → model chain for all routes tested here.
 */
jest.mock('../../src/middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.uid  = 'admin-uid';
    req.role = 'CITY_ADMINISTRATOR';
    next();
  },
}));

jest.mock('../../src/lib/firestore');

const db      = require('../../src/lib/firestore');
const request = require('supertest');
const app     = require('../../src/app');

// ── Seed helpers ────────────────────────────────────────────────────────────

function seedVehicles() {
  const cities  = ['Montreal', 'Toronto', 'Vancouver'];
  const types   = ['BIKE_SHARING', 'SCOOTER_SHARING', 'CAR_SHARING'];
  const vehicles = cities.flatMap((city, _ci) =>
    types.map((type, ti) => ({
      id: `${city.toLowerCase().slice(0, 3)}-${ti + 1}`,
      city,
      type,
      status: 'AVAILABLE',
      pricePerMin: 0.5 + ti * 0.3,
    })),
  );
  db._seed('vehicles', vehicles);
}

function seedParking() {
  const cities = ['Montreal', 'Toronto', 'Vancouver'];
  const facilities = cities.flatMap((city) => [
    { id: `fac-${city.toLowerCase()}-1`, city, name: `${city} Lot 1` },
    { id: `fac-${city.toLowerCase()}-2`, city, name: `${city} Lot 2` },
  ]);
  const spots = facilities.flatMap((fac) =>
    Array.from({ length: 5 }, (_, i) => ({
      id: `spot-${fac.id}-${i + 1}`,
      facilityId: fac.id,
      city: fac.city,
      status: 'AVAILABLE',
    })),
  );
  db._seed('parkingFacilities', facilities);
  db._seed('parkingSpots', spots);
}

beforeEach(() => {
  db._reset();
  seedVehicles();
  seedParking();
});

// ── Health ───────────────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  it('returns healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.timestamp).toBeDefined();
  });
});

// ── Vehicles ─────────────────────────────────────────────────────────────────

describe('GET /api/vehicles', () => {
  it('returns a list of vehicles', async () => {
    const res = await request(app).get('/api/vehicles');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('filters by city', async () => {
    const res = await request(app).get('/api/vehicles?city=Montreal');
    expect(res.status).toBe(200);
    res.body.data.forEach((v) => expect(v.city).toBe('Montreal'));
  });

  it('filters by type', async () => {
    const res = await request(app).get('/api/vehicles?type=BIKE_SHARING');
    expect(res.status).toBe(200);
    res.body.data.forEach((v) => expect(v.type).toBe('BIKE_SHARING'));
  });

  it('returns 400 for invalid type', async () => {
    const res = await request(app).get('/api/vehicles?type=INVALID');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ── Legacy: reservations ──────────────────────────────────────────────────────

describe('POST /api/reservations', () => {
  it('creates a reservation', async () => {
    const vehiclesRes = await request(app).get('/api/vehicles?city=Toronto');
    const vehicleId = vehiclesRes.body.data[0].id;

    const res = await request(app).post('/api/reservations').send({
      userId: 'test-user-1',
      vehicleId,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.userId).toBe('test-user-1');
    expect(res.body.data.vehicleId).toBe(vehicleId);
    expect(res.body.data.status).toBe('ACTIVE');
  });

  it('returns 400 for missing userId', async () => {
    const res = await request(app).post('/api/reservations').send({ vehicleId: 'v-1' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for empty body', async () => {
    const res = await request(app).post('/api/reservations').send({});
    expect(res.status).toBe(400);
  });
});

// ── Legacy: payments ─────────────────────────────────────────────────────────

describe('POST /api/payments/charge', () => {
  it('processes a successful payment', async () => {
    const res = await request(app).post('/api/payments/charge').send({
      reservationId: 'res-123',
      amount: 15.0,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('CONFIRMED');
    expect(res.body.data.amount).toBe(15.0);
  });

  it('handles simulated failure', async () => {
    const res = await request(app).post('/api/payments/charge').send({
      reservationId: 'res-123',
      amount: 15.0,
      simulateFailure: true,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('FAILED');
  });

  it('returns 400 for missing amount', async () => {
    const res = await request(app).post('/api/payments/charge').send({ reservationId: 'res-123' });
    expect(res.status).toBe(400);
  });
});

// ── Legacy: returns ───────────────────────────────────────────────────────────

describe('POST /api/returns', () => {
  it('completes a reservation', async () => {
    const vehiclesRes = await request(app).get('/api/vehicles?city=Vancouver');
    const vehicleId = vehiclesRes.body.data[0].id;

    const createRes = await request(app).post('/api/reservations').send({
      userId: 'test-user-return',
      vehicleId,
    });
    const reservationId = createRes.body.data.id;

    const res = await request(app).post('/api/returns').send({ reservationId });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('COMPLETED');
    expect(res.body.data.endTime).toBeDefined();
  });

  it('returns 400 for missing reservationId', async () => {
    const res = await request(app).post('/api/returns').send({});
    expect(res.status).toBe(400);
  });
});

// ── Parking ───────────────────────────────────────────────────────────────────

describe('GET /api/parking/facilities', () => {
  it('returns all facilities', async () => {
    const res = await request(app).get('/api/parking/facilities');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(6);
  });

  it('filters by city', async () => {
    const res = await request(app).get('/api/parking/facilities?city=Montreal');
    expect(res.status).toBe(200);
    res.body.data.forEach((f) => expect(f.city).toBe('Montreal'));
  });
});

describe('GET /api/parking/facilities/:facilityId/spots', () => {
  it('returns facility and its spots', async () => {
    const facilitiesRes = await request(app).get('/api/parking/facilities');
    const facilityId = facilitiesRes.body.data[0].id;

    const res = await request(app).get(`/api/parking/facilities/${facilityId}/spots`);
    expect(res.status).toBe(200);
    expect(res.body.data.facility).toBeDefined();
    expect(res.body.data.spots.length).toBe(5);
  });

  it('returns 404 for unknown facility', async () => {
    const res = await request(app).get('/api/parking/facilities/unknown/spots');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/parking/spots/available', () => {
  it('returns available spots', async () => {
    const res = await request(app).get('/api/parking/spots/available?city=Toronto');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach((s) => expect(s.status).toBe('AVAILABLE'));
  });
});

describe('POST /api/parking/spots/reserve + release', () => {
  it('reserves and releases a spot', async () => {
    const spotsRes = await request(app).get('/api/parking/spots/available?city=Montreal');
    const spotId = spotsRes.body.data[0].id;

    const reserveRes = await request(app)
      .post('/api/parking/spots/reserve')
      .send({ spotId });
    expect(reserveRes.status).toBe(200);
    expect(reserveRes.body.data.status).toBe('RESERVED');

    const releaseRes = await request(app)
      .post('/api/parking/spots/release')
      .send({ spotId });
    expect(releaseRes.status).toBe(200);
    expect(releaseRes.body.data.status).toBe('AVAILABLE');
  });

  it('returns 400 for missing spotId', async () => {
    const res = await request(app).post('/api/parking/spots/reserve').send({});
    expect(res.status).toBe(400);
  });
});

// ── Analytics ─────────────────────────────────────────────────────────────────

describe('GET /api/analytics', () => {
  it('returns analytics events array', async () => {
    const res = await request(app).get('/api/analytics');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.count).toBeDefined();
  });

  it('filters by type', async () => {
    const res = await request(app).get('/api/analytics?type=PARKING_RESERVED');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/analytics/rentals', () => {
  it('returns rental analytics', async () => {
    const res = await request(app).get('/api/analytics/rentals');
    expect(res.status).toBe(200);
    expect(res.body.data.totalRentals).toBeDefined();
    expect(res.body.data.rentalsByCity).toBeDefined();
    expect(res.body.data.rentalsByType).toBeDefined();
  });
});
