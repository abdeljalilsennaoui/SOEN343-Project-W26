/**
 * Unit tests for MobilityService — updateVehicle and removeVehicle
 *
 * Covers:
 *  - Owner can update/deactivate their own vehicle
 *  - Non-owner provider is forbidden (ownership enforcement)
 *  - CITY_ADMINISTRATOR bypasses ownership check
 *  - SYSTEM_ADMINISTRATOR bypasses ownership check
 *  - Not-found vehicle throws 404 in both methods
 *  - removeVehicle is idempotent when vehicle is already OUT_OF_SERVICE
 */

jest.mock('../../../src/mvc/MobilityDataGateway');

const MobilityDataGateway = require('../../../src/mvc/MobilityDataGateway');
const MobilityService     = require('../../../src/mvc/MobilityService');
const { VehicleStatus, UserRole } = require('../../../src/models/enums');

const OWNER_ID  = 'provider-uid-123';
const OTHER_ID  = 'provider-uid-999';
const VEHICLE_ID = 'vehicle-abc';

const baseVehicle = {
  id: VEHICLE_ID,
  providerId: OWNER_ID,
  city: 'Montreal',
  type: 'BIKE_SHARING',
  status: VehicleStatus.AVAILABLE,
  pricePerMin: 0.5,
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ── updateVehicle ────────────────────────────────────────────────────────────

describe('MobilityService.updateVehicle()', () => {
  it('allows the owner to update their vehicle', async () => {
    MobilityDataGateway.findVehicle.mockResolvedValue({ ...baseVehicle });
    MobilityDataGateway.updateVehicle.mockResolvedValue({ ...baseVehicle, pricePerMin: 1.0 });

    const result = await MobilityService.updateVehicle(
      VEHICLE_ID, OWNER_ID, { pricePerMin: 1.0 }, UserRole.MOBILITY_PROVIDER
    );

    expect(MobilityDataGateway.updateVehicle).toHaveBeenCalledWith(VEHICLE_ID, { pricePerMin: 1.0 });
    expect(result.pricePerMin).toBe(1.0);
  });

  it('forbids a non-owner provider from updating the vehicle', async () => {
    MobilityDataGateway.findVehicle.mockResolvedValue({ ...baseVehicle });

    await expect(
      MobilityService.updateVehicle(VEHICLE_ID, OTHER_ID, { pricePerMin: 1.0 }, UserRole.MOBILITY_PROVIDER)
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(MobilityDataGateway.updateVehicle).not.toHaveBeenCalled();
  });

  it('allows CITY_ADMINISTRATOR to update any vehicle regardless of ownership', async () => {
    MobilityDataGateway.findVehicle.mockResolvedValue({ ...baseVehicle });
    MobilityDataGateway.updateVehicle.mockResolvedValue({ ...baseVehicle, city: 'Toronto' });

    await expect(
      MobilityService.updateVehicle(VEHICLE_ID, OTHER_ID, { city: 'Toronto' }, UserRole.CITY_ADMINISTRATOR)
    ).resolves.toMatchObject({ city: 'Toronto' });

    expect(MobilityDataGateway.updateVehicle).toHaveBeenCalledWith(VEHICLE_ID, { city: 'Toronto' });
  });

  it('allows SYSTEM_ADMINISTRATOR to update any vehicle regardless of ownership', async () => {
    MobilityDataGateway.findVehicle.mockResolvedValue({ ...baseVehicle });
    MobilityDataGateway.updateVehicle.mockResolvedValue({ ...baseVehicle, city: 'Vancouver' });

    await expect(
      MobilityService.updateVehicle(VEHICLE_ID, OTHER_ID, { city: 'Vancouver' }, UserRole.SYSTEM_ADMINISTRATOR)
    ).resolves.toMatchObject({ city: 'Vancouver' });
  });

  it('throws 404 when the vehicle does not exist', async () => {
    MobilityDataGateway.findVehicle.mockResolvedValue(null);

    await expect(
      MobilityService.updateVehicle('no-such-id', OWNER_ID, {}, UserRole.MOBILITY_PROVIDER)
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ── removeVehicle ────────────────────────────────────────────────────────────

describe('MobilityService.removeVehicle()', () => {
  it('allows the owner to deactivate their vehicle', async () => {
    MobilityDataGateway.findVehicle.mockResolvedValue({ ...baseVehicle });
    MobilityDataGateway.removeMobilityOption.mockResolvedValue();
    MobilityDataGateway.deactivateVehicle.mockResolvedValue({
      ...baseVehicle, status: VehicleStatus.OUT_OF_SERVICE,
    });

    const result = await MobilityService.removeVehicle(VEHICLE_ID, OWNER_ID, UserRole.MOBILITY_PROVIDER);

    expect(MobilityDataGateway.deactivateVehicle).toHaveBeenCalledWith(VEHICLE_ID);
    expect(result.status).toBe(VehicleStatus.OUT_OF_SERVICE);
  });

  it('forbids a non-owner provider from deactivating the vehicle', async () => {
    MobilityDataGateway.findVehicle.mockResolvedValue({ ...baseVehicle });

    await expect(
      MobilityService.removeVehicle(VEHICLE_ID, OTHER_ID, UserRole.MOBILITY_PROVIDER)
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(MobilityDataGateway.deactivateVehicle).not.toHaveBeenCalled();
  });

  it('allows CITY_ADMINISTRATOR to deactivate any vehicle regardless of ownership', async () => {
    MobilityDataGateway.findVehicle.mockResolvedValue({ ...baseVehicle });
    MobilityDataGateway.removeMobilityOption.mockResolvedValue();
    MobilityDataGateway.deactivateVehicle.mockResolvedValue({
      ...baseVehicle, status: VehicleStatus.OUT_OF_SERVICE,
    });

    await expect(
      MobilityService.removeVehicle(VEHICLE_ID, OTHER_ID, UserRole.CITY_ADMINISTRATOR)
    ).resolves.toMatchObject({ status: VehicleStatus.OUT_OF_SERVICE });

    expect(MobilityDataGateway.deactivateVehicle).toHaveBeenCalledWith(VEHICLE_ID);
  });

  it('allows SYSTEM_ADMINISTRATOR to deactivate any vehicle regardless of ownership', async () => {
    MobilityDataGateway.findVehicle.mockResolvedValue({ ...baseVehicle });
    MobilityDataGateway.removeMobilityOption.mockResolvedValue();
    MobilityDataGateway.deactivateVehicle.mockResolvedValue({
      ...baseVehicle, status: VehicleStatus.OUT_OF_SERVICE,
    });

    await expect(
      MobilityService.removeVehicle(VEHICLE_ID, OTHER_ID, UserRole.SYSTEM_ADMINISTRATOR)
    ).resolves.toMatchObject({ status: VehicleStatus.OUT_OF_SERVICE });
  });

  it('is idempotent — returns vehicle immediately if already OUT_OF_SERVICE', async () => {
    const oos = { ...baseVehicle, status: VehicleStatus.OUT_OF_SERVICE };
    MobilityDataGateway.findVehicle.mockResolvedValue(oos);

    const result = await MobilityService.removeVehicle(VEHICLE_ID, OWNER_ID, UserRole.MOBILITY_PROVIDER);

    expect(result.status).toBe(VehicleStatus.OUT_OF_SERVICE);
    expect(MobilityDataGateway.deactivateVehicle).not.toHaveBeenCalled();
  });

  it('throws 404 when the vehicle does not exist', async () => {
    MobilityDataGateway.findVehicle.mockResolvedValue(null);

    await expect(
      MobilityService.removeVehicle('no-such-id', OWNER_ID, UserRole.MOBILITY_PROVIDER)
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
