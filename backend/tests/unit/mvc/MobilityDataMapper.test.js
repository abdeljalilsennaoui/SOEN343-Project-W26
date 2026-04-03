const MobilityDataMapper = require('../../../src/mvc/MobilityDataMapper');

describe('MobilityDataMapper', () => {
  describe('toVehicle()', () => {
    const raw = {
      id: 'v-1', city: 'Montreal', type: 'BIKE_SHARING', pricePerMin: 0.5,
      lat: 45.5, lng: -73.6, status: 'AVAILABLE', providerId: 'p-1',
      description: 'A nice bike', createdAt: new Date('2024-01-01'),
    };

    it('maps all fields correctly', () => {
      const vehicle = MobilityDataMapper.toVehicle(raw);
      expect(vehicle).toEqual({
        id: 'v-1', city: 'Montreal', type: 'BIKE_SHARING', pricePerMin: 0.5,
        lat: 45.5, lng: -73.6, status: 'AVAILABLE', providerId: 'p-1',
        description: 'A nice bike', createdAt: raw.createdAt,
      });
    });

    it('defaults lat/lng to null when missing', () => {
      const v = MobilityDataMapper.toVehicle({ ...raw, lat: undefined, lng: undefined });
      expect(v.lat).toBeNull();
      expect(v.lng).toBeNull();
    });

    it('defaults providerId to null when missing', () => {
      const v = MobilityDataMapper.toVehicle({ ...raw, providerId: undefined });
      expect(v.providerId).toBeNull();
    });

    it('defaults description to empty string when missing', () => {
      const v = MobilityDataMapper.toVehicle({ ...raw, description: undefined });
      expect(v.description).toBe('');
    });

    it('defaults createdAt to null when missing', () => {
      const v = MobilityDataMapper.toVehicle({ ...raw, createdAt: undefined });
      expect(v.createdAt).toBeNull();
    });
  });

  describe('toBooking()', () => {
    const raw = {
      id: 'b-1', userId: 'u-1', optionId: 'o-1',
      startTime: '2024-06-01T10:00:00Z', endTime: '2024-06-01T11:00:00Z',
      pickupLocation: 'Station A', totalPrice: 60, status: 'DRAFT',
      rideSharing: true, maxPassengers: 2, passengers: ['p-1', 'p-2'],
      createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-02'),
    };

    it('maps all fields correctly', () => {
      const booking = MobilityDataMapper.toBooking(raw);
      expect(booking).toEqual({
        id: 'b-1', userId: 'u-1', optionId: 'o-1',
        startTime: '2024-06-01T10:00:00Z', endTime: '2024-06-01T11:00:00Z',
        pickupLocation: 'Station A', totalPrice: 60, status: 'DRAFT',
        rideSharing: true, maxPassengers: 2, passengers: ['p-1', 'p-2'],
        createdAt: raw.createdAt, updatedAt: raw.updatedAt,
      });
    });

    it('defaults rideSharing to false', () => {
      const b = MobilityDataMapper.toBooking({ ...raw, rideSharing: undefined });
      expect(b.rideSharing).toBe(false);
    });

    it('defaults maxPassengers to 0', () => {
      const b = MobilityDataMapper.toBooking({ ...raw, maxPassengers: undefined });
      expect(b.maxPassengers).toBe(0);
    });

    it('defaults passengers to empty array', () => {
      const b = MobilityDataMapper.toBooking({ ...raw, passengers: undefined });
      expect(b.passengers).toEqual([]);
    });
  });

  describe('toUser()', () => {
    it('maps all fields correctly', () => {
      const raw = { uid: 'uid-1', email: 'a@b.com', displayName: 'Alice', role: 'COMMUTER', createdAt: new Date() };
      expect(MobilityDataMapper.toUser(raw)).toEqual({
        uid: 'uid-1', email: 'a@b.com', displayName: 'Alice', role: 'COMMUTER', createdAt: raw.createdAt,
      });
    });

    it('defaults email and displayName to empty string', () => {
      const u = MobilityDataMapper.toUser({ uid: 'x', role: 'COMMUTER' });
      expect(u.email).toBe('');
      expect(u.displayName).toBe('');
    });
  });

  describe('toMobilityOption()', () => {
    it('maps all fields correctly', () => {
      const raw = {
        id: 'opt-1', city: 'Toronto', type: 'CAR_SHARING', basePrice: 1.5,
        capacity: 3, description: 'A car', providerId: 'p-2', blockedPeriods: [{ start: '...', end: '...' }],
      };
      const opt = MobilityDataMapper.toMobilityOption(raw);
      expect(opt).toEqual({
        id: 'opt-1', city: 'Toronto', type: 'CAR_SHARING', basePrice: 1.5,
        capacity: 3, description: 'A car', providerId: 'p-2', blockedPeriods: raw.blockedPeriods,
      });
    });

    it('defaults capacity to 1', () => {
      const opt = MobilityDataMapper.toMobilityOption({ id: 'x', city: 'A', type: 'B', basePrice: 1 });
      expect(opt.capacity).toBe(1);
    });

    it('defaults blockedPeriods to empty array', () => {
      const opt = MobilityDataMapper.toMobilityOption({ id: 'x', city: 'A', type: 'B', basePrice: 1 });
      expect(opt.blockedPeriods).toEqual([]);
    });
  });

  describe('toParkingSpot()', () => {
    it('maps all fields correctly', () => {
      const raw = { id: 'spot-1', facilityId: 'fac-1', status: 'AVAILABLE', city: 'Montreal' };
      expect(MobilityDataMapper.toParkingSpot(raw)).toEqual({
        id: 'spot-1', facilityId: 'fac-1', status: 'AVAILABLE', city: 'Montreal',
      });
    });

    it('defaults city to null', () => {
      const s = MobilityDataMapper.toParkingSpot({ id: 'x', facilityId: 'f', status: 'AVAILABLE' });
      expect(s.city).toBeNull();
    });
  });

  describe('fromVehicle()', () => {
    it('maps domain entity to Firestore format', () => {
      const entity = {
        city: 'Montreal', type: 'BIKE_SHARING', pricePerMin: 0.5,
        lat: 45.5, lng: -73.6, status: 'AVAILABLE', providerId: 'p-1', description: 'bike',
      };
      expect(MobilityDataMapper.fromVehicle(entity)).toEqual(entity);
    });
  });

  describe('fromBooking()', () => {
    it('maps domain booking to Firestore format (excludes id, ride-share fields)', () => {
      const entity = {
        id: 'b-1', userId: 'u-1', optionId: 'o-1',
        startTime: 'S', endTime: 'E', pickupLocation: 'P',
        totalPrice: 60, status: 'DRAFT',
        rideSharing: true, maxPassengers: 2, passengers: ['p-1'],
      };
      const result = MobilityDataMapper.fromBooking(entity);
      expect(result).toEqual({
        userId: 'u-1', optionId: 'o-1', startTime: 'S', endTime: 'E',
        pickupLocation: 'P', totalPrice: 60, status: 'DRAFT',
      });
      expect(result.id).toBeUndefined();
    });
  });
});
