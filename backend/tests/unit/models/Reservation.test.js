const Reservation = require('../../../src/models/Reservation');
const Vehicle = require('../../../src/models/Vehicle');
const { ReservationStatus, VehicleStatus } = require('../../../src/models/enums');

describe('Reservation Model', () => {
  describe('createReservation', () => {
    it('should create a reservation for an available vehicle', () => {
      const vehicles = Vehicle.getAvailableVehicles('Montreal');
      const vehicleId = vehicles[0].id;

      const reservation = Reservation.createReservation('user-1', vehicleId);

      expect(reservation.userId).toBe('user-1');
      expect(reservation.vehicleId).toBe(vehicleId);
      expect(reservation.status).toBe(ReservationStatus.ACTIVE);
      expect(reservation.startTime).toBeDefined();
      expect(reservation.endTime).toBeNull();

      // Clean up
      Reservation.completeReservation(reservation.id);
    });

    it('should mark the vehicle as reserved', () => {
      const vehicles = Vehicle.getAvailableVehicles('Toronto');
      const vehicleId = vehicles[0].id;

      const reservation = Reservation.createReservation('user-2', vehicleId);
      const vehicle = Vehicle.findById(vehicleId);
      expect(vehicle.status).toBe(VehicleStatus.RESERVED);

      // Clean up
      Reservation.completeReservation(reservation.id);
    });

    it('should throw when vehicle is not available', () => {
      const vehicles = Vehicle.getAvailableVehicles('Vancouver');
      const vehicleId = vehicles[0].id;

      const reservation = Reservation.createReservation('user-3', vehicleId);

      expect(() => Reservation.createReservation('user-4', vehicleId)).toThrow('not available');

      // Clean up
      Reservation.completeReservation(reservation.id);
    });
  });

  describe('getReservation', () => {
    it('should return reservation by id', () => {
      const vehicles = Vehicle.getAvailableVehicles('Montreal');
      const created = Reservation.createReservation('user-5', vehicles[0].id);

      const found = Reservation.getReservation(created.id);
      expect(found.id).toBe(created.id);

      // Clean up
      Reservation.completeReservation(created.id);
    });

    it('should throw NOT_FOUND for nonexistent reservation', () => {
      expect(() => Reservation.getReservation('nonexistent')).toThrow('not found');
    });
  });

  describe('completeReservation', () => {
    it('should complete a reservation and release the vehicle', () => {
      const vehicles = Vehicle.getAvailableVehicles('Toronto');
      const vehicleId = vehicles[0].id;
      const reservation = Reservation.createReservation('user-6', vehicleId);

      const completed = Reservation.completeReservation(reservation.id);

      expect(completed.status).toBe(ReservationStatus.COMPLETED);
      expect(completed.endTime).toBeDefined();

      const vehicle = Vehicle.findById(vehicleId);
      expect(vehicle.status).toBe(VehicleStatus.AVAILABLE);
    });

    it('should throw CONFLICT for already completed reservation', () => {
      const vehicles = Vehicle.getAvailableVehicles('Vancouver');
      const reservation = Reservation.createReservation('user-7', vehicles[0].id);

      Reservation.completeReservation(reservation.id);

      expect(() => Reservation.completeReservation(reservation.id)).toThrow('already completed');
    });
  });
});
