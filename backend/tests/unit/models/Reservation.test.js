jest.mock('../../../src/lib/firestore');

const db = require('../../../src/lib/firestore');
const Reservation = require('../../../src/models/Reservation');
const Vehicle = require('../../../src/models/Vehicle');
const { ReservationStatus, VehicleStatus, TripMode } = require('../../../src/models/enums');

function seed() {
  const vehicles = [
    { id: 'mtl-1', city: 'Montreal',  type: TripMode.BIKE_SHARING,     status: VehicleStatus.AVAILABLE, pricePerMin: 0.5 },
    { id: 'mtl-2', city: 'Montreal',  type: TripMode.BIKE_SHARING,     status: VehicleStatus.AVAILABLE, pricePerMin: 0.5 },
    { id: 'tor-1', city: 'Toronto',   type: TripMode.SCOOTER_SHARING,  status: VehicleStatus.AVAILABLE, pricePerMin: 0.8 },
    { id: 'tor-2', city: 'Toronto',   type: TripMode.SCOOTER_SHARING,  status: VehicleStatus.AVAILABLE, pricePerMin: 0.8 },
    { id: 'van-1', city: 'Vancouver', type: TripMode.CAR_SHARING,      status: VehicleStatus.AVAILABLE, pricePerMin: 1.5 },
    { id: 'van-2', city: 'Vancouver', type: TripMode.CAR_SHARING,      status: VehicleStatus.AVAILABLE, pricePerMin: 1.5 },
  ];
  db._seed('vehicles', vehicles);
}

beforeEach(() => { db._reset(); seed(); });

describe('Reservation.createReservation()', () => {
  it('creates a reservation for an available vehicle', async () => {
    const vehicles = await Vehicle.getAvailableVehicles('Montreal');
    const vehicleId = vehicles[0].id;

    const reservation = await Reservation.createReservation('user-1', vehicleId);

    expect(reservation.userId).toBe('user-1');
    expect(reservation.vehicleId).toBe(vehicleId);
    expect(reservation.status).toBe(ReservationStatus.ACTIVE);
    expect(reservation.startTime).toBeDefined();
    expect(reservation.endTime).toBeNull();
  });

  it('marks the vehicle as reserved', async () => {
    const vehicles = await Vehicle.getAvailableVehicles('Toronto');
    const vehicleId = vehicles[0].id;

    await Reservation.createReservation('user-2', vehicleId);
    const vehicle = await Vehicle.findById(vehicleId);
    expect(vehicle.status).toBe(VehicleStatus.RESERVED);
  });

  it('throws when vehicle is not available', async () => {
    const vehicles = await Vehicle.getAvailableVehicles('Vancouver');
    const vehicleId = vehicles[0].id;

    await Reservation.createReservation('user-3', vehicleId);

    await expect(Reservation.createReservation('user-4', vehicleId)).rejects.toThrow('not available');
  });
});

describe('Reservation.getReservation()', () => {
  it('returns a reservation by id', async () => {
    const vehicles = await Vehicle.getAvailableVehicles('Montreal');
    const created = await Reservation.createReservation('user-5', vehicles[0].id);

    const found = await Reservation.getReservation(created.id);
    expect(found.id).toBe(created.id);
  });

  it('throws NOT_FOUND for nonexistent reservation', async () => {
    await expect(Reservation.getReservation('nonexistent')).rejects.toThrow('not found');
  });
});

describe('Reservation.completeReservation()', () => {
  it('completes a reservation and releases the vehicle', async () => {
    const vehicles = await Vehicle.getAvailableVehicles('Toronto');
    const vehicleId = vehicles[0].id;
    const reservation = await Reservation.createReservation('user-6', vehicleId);

    const completed = await Reservation.completeReservation(reservation.id);

    expect(completed.status).toBe(ReservationStatus.COMPLETED);
    expect(completed.endTime).toBeDefined();

    const vehicle = await Vehicle.findById(vehicleId);
    expect(vehicle.status).toBe(VehicleStatus.AVAILABLE);
  });

  it('throws CONFLICT for already completed reservation', async () => {
    const vehicles = await Vehicle.getAvailableVehicles('Vancouver');
    const reservation = await Reservation.createReservation('user-7', vehicles[0].id);

    await Reservation.completeReservation(reservation.id);

    await expect(Reservation.completeReservation(reservation.id)).rejects.toThrow('already completed');
  });
});
