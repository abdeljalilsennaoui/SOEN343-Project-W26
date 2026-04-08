/**
 * Unit tests for provider Command classes — UpdateVehicleCommand and DeactivateVehicleCommand
 *
 * Verifies that the role field from request.payload is correctly forwarded
 * to MobilityService so the admin-bypass logic has the information it needs.
 */

const MobilityRequest  = require('../../../src/mvc/MobilityRequest');
const MobilityResponse = require('../../../src/mvc/MobilityResponse');
const { UserRole }     = require('../../../src/models/enums');
const ICommand         = require('../../../src/commands/ICommand');
const {
  GetProviderVehiclesCommand,
  AddVehicleCommand,
  UpdateVehicleCommand,
  DeactivateVehicleCommand,
} = require('../../../src/commands/provider.commands');

function makeReceiver(overrides = {}) {
  return {
    updateVehicle: jest.fn().mockResolvedValue({ id: 'v-1', city: 'Montreal' }),
    removeVehicle: jest.fn().mockResolvedValue({ id: 'v-1', status: 'OUT_OF_SERVICE' }),
    ...overrides,
  };
}

function makeRequest(type, userId, payload) {
  return new MobilityRequest(type, userId, payload);
}

// ── ICommand (abstract) ──────────────────────────────────────────────────────

describe('ICommand', () => {
  it('execute() throws when called on the base class', async () => {
    const cmd = new ICommand();
    await expect(cmd.execute({})).rejects.toThrow('ICommand.execute() must be implemented');
  });
});

// ── GetProviderVehiclesCommand ───────────────────────────────────────────────

describe('GetProviderVehiclesCommand', () => {
  it('calls receiver.getProviderVehicles with userId and role', async () => {
    const vehicles = [{ id: 'v-1' }];
    const receiver = { getProviderVehicles: jest.fn().mockResolvedValue(vehicles) };
    const cmd = new GetProviderVehiclesCommand(receiver);
    const req = new MobilityRequest(MobilityRequest.TYPES.GET_PROVIDER_VEHICLES, 'provider-uid', { role: UserRole.MOBILITY_PROVIDER });

    const res = await cmd.execute(req);

    expect(receiver.getProviderVehicles).toHaveBeenCalledWith('provider-uid', UserRole.MOBILITY_PROVIDER);
    expect(res).toBeInstanceOf(MobilityResponse);
    expect(res.statusCode).toBe(200);
    expect(res.data).toEqual(vehicles);
  });
});

// ── AddVehicleCommand ────────────────────────────────────────────────────────

describe('AddVehicleCommand', () => {
  it('calls receiver.addVehicle with userId and payload, returns 201', async () => {
    const vehicle = { id: 'v-new', city: 'Montreal', type: 'BIKE_SHARING' };
    const receiver = { addVehicle: jest.fn().mockResolvedValue(vehicle) };
    const cmd = new AddVehicleCommand(receiver);
    const payload = { city: 'Montreal', type: 'BIKE_SHARING', pricePerMin: 0.1 };
    const req = new MobilityRequest(MobilityRequest.TYPES.ADD_VEHICLE, 'provider-uid', payload);

    const res = await cmd.execute(req);

    expect(receiver.addVehicle).toHaveBeenCalledWith('provider-uid', payload);
    expect(res.statusCode).toBe(201);
    expect(res.data).toEqual(vehicle);
  });
});

// ── UpdateVehicleCommand ─────────────────────────────────────────────────────

describe('UpdateVehicleCommand', () => {
  it('calls receiver.updateVehicle with vehicleId, userId, fields, and role', async () => {
    const receiver = makeReceiver();
    const cmd = new UpdateVehicleCommand(receiver);
    const request = makeRequest(MobilityRequest.TYPES.UPDATE_VEHICLE, 'admin-uid', {
      vehicleId: 'v-1',
      fields: { pricePerMin: 2.0 },
      role: UserRole.CITY_ADMINISTRATOR,
    });

    const response = await cmd.execute(request);

    expect(receiver.updateVehicle).toHaveBeenCalledWith(
      'v-1',
      'admin-uid',
      { pricePerMin: 2.0 },
      UserRole.CITY_ADMINISTRATOR
    );
    expect(response).toBeInstanceOf(MobilityResponse);
    expect(response.success).toBe(true);
  });

  it('forwards MOBILITY_PROVIDER role correctly', async () => {
    const receiver = makeReceiver();
    const cmd = new UpdateVehicleCommand(receiver);
    const request = makeRequest(MobilityRequest.TYPES.UPDATE_VEHICLE, 'provider-uid', {
      vehicleId: 'v-2',
      fields: { city: 'Toronto' },
      role: UserRole.MOBILITY_PROVIDER,
    });

    await cmd.execute(request);

    expect(receiver.updateVehicle).toHaveBeenCalledWith(
      'v-2',
      'provider-uid',
      { city: 'Toronto' },
      UserRole.MOBILITY_PROVIDER
    );
  });

  it('returns a MobilityResponse wrapping the updated vehicle', async () => {
    const updatedVehicle = { id: 'v-1', city: 'Vancouver', pricePerMin: 3.0 };
    const receiver = makeReceiver({ updateVehicle: jest.fn().mockResolvedValue(updatedVehicle) });
    const cmd = new UpdateVehicleCommand(receiver);
    const request = makeRequest(MobilityRequest.TYPES.UPDATE_VEHICLE, 'owner-uid', {
      vehicleId: 'v-1',
      fields: { city: 'Vancouver', pricePerMin: 3.0 },
      role: UserRole.MOBILITY_PROVIDER,
    });

    const response = await cmd.execute(request);

    expect(response.data).toEqual(updatedVehicle);
    expect(response.statusCode).toBe(200);
  });

  it('propagates errors thrown by the receiver', async () => {
    const receiver = makeReceiver({
      updateVehicle: jest.fn().mockRejectedValue(new Error('forbidden')),
    });
    const cmd = new UpdateVehicleCommand(receiver);
    const request = makeRequest(MobilityRequest.TYPES.UPDATE_VEHICLE, 'other-uid', {
      vehicleId: 'v-1',
      fields: {},
      role: UserRole.MOBILITY_PROVIDER,
    });

    await expect(cmd.execute(request)).rejects.toThrow('forbidden');
  });
});

// ── DeactivateVehicleCommand ─────────────────────────────────────────────────

describe('DeactivateVehicleCommand', () => {
  it('calls receiver.removeVehicle with vehicleId, userId, and role', async () => {
    const receiver = makeReceiver();
    const cmd = new DeactivateVehicleCommand(receiver);
    const request = makeRequest(MobilityRequest.TYPES.DEACTIVATE_VEHICLE, 'admin-uid', {
      vehicleId: 'v-1',
      role: UserRole.CITY_ADMINISTRATOR,
    });

    const response = await cmd.execute(request);

    expect(receiver.removeVehicle).toHaveBeenCalledWith(
      'v-1',
      'admin-uid',
      UserRole.CITY_ADMINISTRATOR
    );
    expect(response).toBeInstanceOf(MobilityResponse);
    expect(response.success).toBe(true);
  });

  it('forwards SYSTEM_ADMINISTRATOR role correctly', async () => {
    const receiver = makeReceiver();
    const cmd = new DeactivateVehicleCommand(receiver);
    const request = makeRequest(MobilityRequest.TYPES.DEACTIVATE_VEHICLE, 'sysadmin-uid', {
      vehicleId: 'v-3',
      role: UserRole.SYSTEM_ADMINISTRATOR,
    });

    await cmd.execute(request);

    expect(receiver.removeVehicle).toHaveBeenCalledWith(
      'v-3',
      'sysadmin-uid',
      UserRole.SYSTEM_ADMINISTRATOR
    );
  });

  it('returns a MobilityResponse wrapping the deactivated vehicle', async () => {
    const deactivated = { id: 'v-1', status: 'OUT_OF_SERVICE' };
    const receiver = makeReceiver({ removeVehicle: jest.fn().mockResolvedValue(deactivated) });
    const cmd = new DeactivateVehicleCommand(receiver);
    const request = makeRequest(MobilityRequest.TYPES.DEACTIVATE_VEHICLE, 'owner-uid', {
      vehicleId: 'v-1',
      role: UserRole.MOBILITY_PROVIDER,
    });

    const response = await cmd.execute(request);

    expect(response.data).toEqual(deactivated);
    expect(response.statusCode).toBe(200);
  });

  it('propagates errors thrown by the receiver', async () => {
    const receiver = makeReceiver({
      removeVehicle: jest.fn().mockRejectedValue(new Error('not found')),
    });
    const cmd = new DeactivateVehicleCommand(receiver);
    const request = makeRequest(MobilityRequest.TYPES.DEACTIVATE_VEHICLE, 'uid', {
      vehicleId: 'missing',
      role: UserRole.MOBILITY_PROVIDER,
    });

    await expect(cmd.execute(request)).rejects.toThrow('not found');
  });
});
