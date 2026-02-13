const request = require('supertest');
const app = require('../../src/app');

describe('API Integration Tests', () => {
  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/vehicles', () => {
    it('should return a list of vehicles', async () => {
      const res = await request(app).get('/api/vehicles');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should filter by city', async () => {
      const res = await request(app).get('/api/vehicles?city=Montreal');
      expect(res.status).toBe(200);
      res.body.data.forEach((v) => {
        expect(v.city).toBe('Montreal');
      });
    });

    it('should filter by type', async () => {
      const res = await request(app).get('/api/vehicles?type=BIKE_SHARING');
      expect(res.status).toBe(200);
      res.body.data.forEach((v) => {
        expect(v.type).toBe('BIKE_SHARING');
      });
    });

    it('should return 400 for invalid type', async () => {
      const res = await request(app).get('/api/vehicles?type=INVALID');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/reservations', () => {
    it('should create a reservation', async () => {
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

    it('should return 400 for missing userId', async () => {
      const res = await request(app).post('/api/reservations').send({
        vehicleId: 'some-id',
      });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for empty body', async () => {
      const res = await request(app).post('/api/reservations').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/payments/charge', () => {
    it('should process a successful payment', async () => {
      const res = await request(app).post('/api/payments/charge').send({
        reservationId: 'res-123',
        amount: 15.0,
      });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('CONFIRMED');
      expect(res.body.data.amount).toBe(15.0);
    });

    it('should handle simulated failure', async () => {
      const res = await request(app).post('/api/payments/charge').send({
        reservationId: 'res-123',
        amount: 15.0,
        simulateFailure: true,
      });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('FAILED');
    });

    it('should return 400 for missing amount', async () => {
      const res = await request(app).post('/api/payments/charge').send({
        reservationId: 'res-123',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/returns', () => {
    it('should complete a reservation', async () => {
      // First create a reservation
      const vehiclesRes = await request(app).get('/api/vehicles?city=Vancouver');
      const vehicleId = vehiclesRes.body.data[0].id;

      const createRes = await request(app).post('/api/reservations').send({
        userId: 'test-user-return',
        vehicleId,
      });
      const reservationId = createRes.body.data.id;

      // Then return it
      const res = await request(app).post('/api/returns').send({ reservationId });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.endTime).toBeDefined();
    });

    it('should return 400 for missing reservationId', async () => {
      const res = await request(app).post('/api/returns').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('Parking API', () => {
    describe('GET /api/parking/facilities', () => {
      it('should return all facilities', async () => {
        const res = await request(app).get('/api/parking/facilities');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(6);
      });

      it('should filter by city', async () => {
        const res = await request(app).get('/api/parking/facilities?city=Montreal');
        expect(res.status).toBe(200);
        res.body.data.forEach((f) => {
          expect(f.city).toBe('Montreal');
        });
      });
    });

    describe('GET /api/parking/facilities/:facilityId/spots', () => {
      it('should return spots for a facility', async () => {
        const facilitiesRes = await request(app).get('/api/parking/facilities');
        const facilityId = facilitiesRes.body.data[0].id;

        const res = await request(app).get(`/api/parking/facilities/${facilityId}/spots`);
        expect(res.status).toBe(200);
        expect(res.body.data.facility).toBeDefined();
        expect(res.body.data.spots.length).toBe(5);
      });

      it('should return 404 for unknown facility', async () => {
        const res = await request(app).get('/api/parking/facilities/unknown/spots');
        expect(res.status).toBe(404);
      });
    });

    describe('GET /api/parking/spots/available', () => {
      it('should return available spots', async () => {
        const res = await request(app).get('/api/parking/spots/available?city=Toronto');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        res.body.data.forEach((s) => {
          expect(s.status).toBe('AVAILABLE');
        });
      });
    });

    describe('POST /api/parking/spots/reserve + release', () => {
      it('should reserve and release a spot', async () => {
        const spotsRes = await request(app).get('/api/parking/spots/available?city=Montreal');
        const spotId = spotsRes.body.data[0].id;

        const reserveRes = await request(app)
          .post('/api/parking/spots/reserve')
          .send({ spotId });
        expect(reserveRes.status).toBe(201);
        expect(reserveRes.body.data.status).toBe('RESERVED');

        const releaseRes = await request(app)
          .post('/api/parking/spots/release')
          .send({ spotId });
        expect(releaseRes.status).toBe(200);
        expect(releaseRes.body.data.status).toBe('AVAILABLE');
      });

      it('should return 400 for missing spotId', async () => {
        const res = await request(app).post('/api/parking/spots/reserve').send({});
        expect(res.status).toBe(400);
      });
    });
  });

  describe('GET /api/analytics', () => {
    it('should return analytics events', async () => {
      const res = await request(app).get('/api/analytics');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.count).toBeDefined();
    });

    it('should filter by type', async () => {
      const res = await request(app).get('/api/analytics?type=PARKING_RESERVED');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
