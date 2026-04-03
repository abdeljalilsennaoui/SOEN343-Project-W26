jest.mock('../../../src/lib/firestore');

const db = require('../../../src/lib/firestore');
const Vehicle = require('../../../src/models/Vehicle');
const { VehicleStatus, TripMode } = require('../../../src/models/enums');

const montreal = (i) => ({ id: `mtl-${i}`, city: 'Montreal', type: TripMode.BIKE_SHARING, status: VehicleStatus.AVAILABLE, pricePerMin: 0.5 });
const toronto  = (i) => ({ id: `tor-${i}`, city: 'Toronto',  type: TripMode.SCOOTER_SHARING, status: VehicleStatus.AVAILABLE, pricePerMin: 0.8 });
const van      = (i) => ({ id: `van-${i}`, city: 'Vancouver', type: TripMode.CAR_SHARING,  status: VehicleStatus.AVAILABLE, pricePerMin: 1.5 });

function seed() {
  const vehicles = [
    ...Array.from({ length: 9 }, (_, i) => montreal(i + 1)),
    ...Array.from({ length: 9 }, (_, i) => toronto(i + 1)),
    ...Array.from({ length: 9 }, (_, i) => van(i + 1)),
  ];
  db._seed('vehicles', vehicles);
}

beforeEach(() => { db._reset(); seed(); });

describe('Vehicle.getAvailableVehicles()', () => {
  it('returns all available vehicles when no filters', async () => {
    const vehicles = await Vehicle.getAvailableVehicles();
    expect(vehicles.length).toBeGreaterThan(0);
    vehicles.forEach(v => expect(v.status).toBe(VehicleStatus.AVAILABLE));
  });

  it('filters by city', async () => {
    const vehicles = await Vehicle.getAvailableVehicles('Montreal');
    expect(vehicles.length).toBeGreaterThan(0);
    vehicles.forEach(v => expect(v.city).toBe('Montreal'));
  });

  it('filters by type', async () => {
    const vehicles = await Vehicle.getAvailableVehicles(null, TripMode.BIKE_SHARING);
    expect(vehicles.length).toBeGreaterThan(0);
    vehicles.forEach(v => expect(v.type).toBe(TripMode.BIKE_SHARING));
  });

  it('filters by both city and type', async () => {
    const vehicles = await Vehicle.getAvailableVehicles('Toronto', TripMode.SCOOTER_SHARING);
    expect(vehicles.length).toBeGreaterThan(0);
    vehicles.forEach(v => {
      expect(v.city).toBe('Toronto');
      expect(v.type).toBe(TripMode.SCOOTER_SHARING);
    });
  });

  it('returns empty array for nonexistent city', async () => {
    const vehicles = await Vehicle.getAvailableVehicles('Atlantis');
    expect(vehicles).toEqual([]);
  });
});

describe('Vehicle.reserveVehicle()', () => {
  it('reserves an available vehicle', async () => {
    const vehicle = await Vehicle.reserveVehicle('mtl-1');
    expect(vehicle.status).toBe(VehicleStatus.RESERVED);
  });

  it('throws NOT_FOUND for nonexistent vehicle', async () => {
    await expect(Vehicle.reserveVehicle('nonexistent')).rejects.toThrow('not found');
  });

  it('throws CONFLICT for already reserved vehicle', async () => {
    await Vehicle.reserveVehicle('mtl-1');
    await expect(Vehicle.reserveVehicle('mtl-1')).rejects.toThrow('not available');
  });
});

describe('Vehicle.releaseVehicle()', () => {
  it('releases a reserved vehicle', async () => {
    await Vehicle.reserveVehicle('mtl-1');
    const vehicle = await Vehicle.releaseVehicle('mtl-1');
    expect(vehicle.status).toBe(VehicleStatus.AVAILABLE);
  });

  it('throws NOT_FOUND for nonexistent vehicle', async () => {
    await expect(Vehicle.releaseVehicle('nonexistent')).rejects.toThrow('not found');
  });
});

describe('Vehicle.findAll()', () => {
  it('returns all seeded vehicles', async () => {
    const all = await Vehicle.findAll();
    expect(all.length).toBe(27);
  });

  it('filters by status', async () => {
    await Vehicle.reserveVehicle('mtl-1');
    const reserved = await Vehicle.findAll({ status: VehicleStatus.RESERVED });
    expect(reserved.length).toBe(1);
    expect(reserved[0].id).toBe('mtl-1');
  });
});

describe('Vehicle.findById()', () => {
  it('returns a vehicle by id', async () => {
    const vehicle = await Vehicle.findById('tor-1');
    expect(vehicle).not.toBeNull();
    expect(vehicle.id).toBe('tor-1');
  });

  it('returns null for unknown id', async () => {
    const vehicle = await Vehicle.findById('nonexistent');
    expect(vehicle).toBeNull();
  });
});
