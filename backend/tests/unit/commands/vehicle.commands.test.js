const MobilityRequest  = require('../../../src/mvc/MobilityRequest');
const MobilityResponse = require('../../../src/mvc/MobilityResponse');
const { GetVehiclesCommand, SearchOptionsCommand } = require('../../../src/commands/vehicle.commands');

function makeRequest(type, payload = {}) {
  return new MobilityRequest(type, null, payload);
}

// ── GetVehiclesCommand ───────────────────────────────────────────────────────

describe('GetVehiclesCommand', () => {
  const vehicles = [{ id: 'v-1' }, { id: 'v-2' }];

  it('calls receiver.getVehicles with request payload', async () => {
    const receiver = { getVehicles: jest.fn().mockResolvedValue(vehicles) };
    const cmd = new GetVehiclesCommand(receiver);
    const req = makeRequest(MobilityRequest.TYPES.GET_VEHICLES, { city: 'Montreal' });

    await cmd.execute(req);

    expect(receiver.getVehicles).toHaveBeenCalledWith({ city: 'Montreal' });
  });

  it('returns 200 MobilityResponse with vehicle list', async () => {
    const receiver = { getVehicles: jest.fn().mockResolvedValue(vehicles) };
    const cmd = new GetVehiclesCommand(receiver);

    const res = await cmd.execute(makeRequest(MobilityRequest.TYPES.GET_VEHICLES, {}));

    expect(res).toBeInstanceOf(MobilityResponse);
    expect(res.statusCode).toBe(200);
    expect(res.data).toEqual(vehicles);
  });

  it('propagates errors from the receiver', async () => {
    const receiver = { getVehicles: jest.fn().mockRejectedValue(new Error('db error')) };
    const cmd = new GetVehiclesCommand(receiver);

    await expect(cmd.execute(makeRequest(MobilityRequest.TYPES.GET_VEHICLES))).rejects.toThrow('db error');
  });
});

// ── SearchOptionsCommand ─────────────────────────────────────────────────────

describe('SearchOptionsCommand', () => {
  const options = [{ optionId: 'opt-1', type: 'BIKE_SHARING' }];

  it('calls receiver.searchVehicles with request payload', async () => {
    const receiver = { searchVehicles: jest.fn().mockResolvedValue(options) };
    const cmd = new SearchOptionsCommand(receiver);
    const payload = { city: 'Montreal', type: 'BIKE_SHARING', startTime: '2026-01-01T10:00:00Z', endTime: '2026-01-01T11:00:00Z' };
    const req = makeRequest(MobilityRequest.TYPES.SEARCH_OPTIONS, payload);

    await cmd.execute(req);

    expect(receiver.searchVehicles).toHaveBeenCalledWith(payload);
  });

  it('returns 200 MobilityResponse with options list', async () => {
    const receiver = { searchVehicles: jest.fn().mockResolvedValue(options) };
    const cmd = new SearchOptionsCommand(receiver);

    const res = await cmd.execute(makeRequest(MobilityRequest.TYPES.SEARCH_OPTIONS, {}));

    expect(res.statusCode).toBe(200);
    expect(res.data).toEqual(options);
  });

  it('propagates errors from the receiver', async () => {
    const receiver = { searchVehicles: jest.fn().mockRejectedValue(new Error('search failed')) };
    const cmd = new SearchOptionsCommand(receiver);

    await expect(cmd.execute(makeRequest(MobilityRequest.TYPES.SEARCH_OPTIONS))).rejects.toThrow('search failed');
  });
});
