const Vehicle = require('../../../src/models/Vehicle');
const { VehicleStatus, TripMode } = require('../../../src/models/enums');

describe('Vehicle Model', () => {
  describe('getAvailableVehicles', () => {
    it('should return all available vehicles when no filters', () => {
      const vehicles = Vehicle.getAvailableVehicles();
      expect(vehicles.length).toBeGreaterThan(0);
      vehicles.forEach((v) => {
        expect(v.status).toBe(VehicleStatus.AVAILABLE);
      });
    });

    it('should filter by city', () => {
      const vehicles = Vehicle.getAvailableVehicles('Montreal');
      expect(vehicles.length).toBeGreaterThan(0);
      vehicles.forEach((v) => {
        expect(v.city).toBe('Montreal');
      });
    });

    it('should filter by type', () => {
      const vehicles = Vehicle.getAvailableVehicles(null, TripMode.BIKE_SHARING);
      expect(vehicles.length).toBeGreaterThan(0);
      vehicles.forEach((v) => {
        expect(v.type).toBe(TripMode.BIKE_SHARING);
      });
    });

    it('should filter by both city and type', () => {
      const vehicles = Vehicle.getAvailableVehicles('Toronto', TripMode.SCOOTER_SHARING);
      expect(vehicles.length).toBeGreaterThan(0);
      vehicles.forEach((v) => {
        expect(v.city).toBe('Toronto');
        expect(v.type).toBe(TripMode.SCOOTER_SHARING);
      });
    });

    it('should return empty array for nonexistent city', () => {
      const vehicles = Vehicle.getAvailableVehicles('Atlantis');
      expect(vehicles).toEqual([]);
    });
  });

  describe('reserveVehicle', () => {
    it('should reserve an available vehicle', () => {
      const vehicles = Vehicle.getAvailableVehicles('Montreal');
      const vehicle = Vehicle.reserveVehicle(vehicles[0].id);
      expect(vehicle.status).toBe(VehicleStatus.RESERVED);
      // Clean up
      Vehicle.releaseVehicle(vehicles[0].id);
    });

    it('should throw NOT_FOUND for nonexistent vehicle', () => {
      expect(() => Vehicle.reserveVehicle('nonexistent')).toThrow('not found');
    });

    it('should throw CONFLICT for already reserved vehicle', () => {
      const vehicles = Vehicle.getAvailableVehicles('Montreal');
      Vehicle.reserveVehicle(vehicles[0].id);
      expect(() => Vehicle.reserveVehicle(vehicles[0].id)).toThrow('not available');
      // Clean up
      Vehicle.releaseVehicle(vehicles[0].id);
    });
  });

  describe('releaseVehicle', () => {
    it('should release a reserved vehicle', () => {
      const vehicles = Vehicle.getAvailableVehicles('Montreal');
      Vehicle.reserveVehicle(vehicles[0].id);
      const vehicle = Vehicle.releaseVehicle(vehicles[0].id);
      expect(vehicle.status).toBe(VehicleStatus.AVAILABLE);
    });

    it('should throw NOT_FOUND for nonexistent vehicle', () => {
      expect(() => Vehicle.releaseVehicle('nonexistent')).toThrow('not found');
    });
  });

  describe('findAll', () => {
    it('should return seeded vehicles', () => {
      const all = Vehicle.findAll();
      expect(all.length).toBeGreaterThanOrEqual(27);
    });

    it('should filter by status', () => {
      const results = Vehicle.findAll({ status: VehicleStatus.AVAILABLE });
      results.forEach((v) => expect(v.status).toBe(VehicleStatus.AVAILABLE));
    });
  });

  describe('findById', () => {
    it('should return vehicle by id', () => {
      const all = Vehicle.findAll();
      const found = Vehicle.findById(all[0].id);
      expect(found).toEqual(all[0]);
    });

    it('should return null for unknown id', () => {
      expect(Vehicle.findById('nonexistent')).toBeNull();
    });
  });
});
