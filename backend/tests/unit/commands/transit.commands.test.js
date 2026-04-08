const MobilityRequest  = require('../../../src/mvc/MobilityRequest');
const MobilityResponse = require('../../../src/mvc/MobilityResponse');
const { GetTransitScheduleCommand, GetNearbyStopsCommand } = require('../../../src/commands/transit.commands');

function makeRequest(type, payload = {}) {
  return new MobilityRequest(type, null, payload);
}

// ── GetTransitScheduleCommand ────────────────────────────────────────────────

describe('GetTransitScheduleCommand', () => {
  const schedule = [{ line: 'Green', departures: ['09:00', '09:15'] }];

  it('calls receiver.getTransitSchedule with city and line', async () => {
    const receiver = { getTransitSchedule: jest.fn().mockResolvedValue(schedule) };
    const cmd = new GetTransitScheduleCommand(receiver);

    await cmd.execute(makeRequest(MobilityRequest.TYPES.GET_TRANSIT_SCHEDULE, { city: 'Montreal', line: 'Green' }));

    expect(receiver.getTransitSchedule).toHaveBeenCalledWith('Montreal', 'Green');
  });

  it('passes null for line when not provided', async () => {
    const receiver = { getTransitSchedule: jest.fn().mockResolvedValue(schedule) };
    const cmd = new GetTransitScheduleCommand(receiver);

    await cmd.execute(makeRequest(MobilityRequest.TYPES.GET_TRANSIT_SCHEDULE, { city: 'Toronto' }));

    expect(receiver.getTransitSchedule).toHaveBeenCalledWith('Toronto', null);
  });

  it('returns 200 MobilityResponse with schedule', async () => {
    const receiver = { getTransitSchedule: jest.fn().mockResolvedValue(schedule) };
    const cmd = new GetTransitScheduleCommand(receiver);

    const res = await cmd.execute(makeRequest(MobilityRequest.TYPES.GET_TRANSIT_SCHEDULE, { city: 'Montreal' }));

    expect(res).toBeInstanceOf(MobilityResponse);
    expect(res.statusCode).toBe(200);
    expect(res.data).toEqual(schedule);
  });

  it('propagates errors from the receiver', async () => {
    const receiver = { getTransitSchedule: jest.fn().mockRejectedValue(new Error('transit unavailable')) };
    const cmd = new GetTransitScheduleCommand(receiver);

    await expect(cmd.execute(makeRequest(MobilityRequest.TYPES.GET_TRANSIT_SCHEDULE, { city: 'Montreal' }))).rejects.toThrow('transit unavailable');
  });
});

// ── GetNearbyStopsCommand ────────────────────────────────────────────────────

describe('GetNearbyStopsCommand', () => {
  const stops = [{ id: 'stop-1', name: 'Berri-UQAM' }];

  it('calls receiver.getNearbyStops with lat and lng', async () => {
    const receiver = { getNearbyStops: jest.fn().mockResolvedValue(stops) };
    const cmd = new GetNearbyStopsCommand(receiver);

    await cmd.execute(makeRequest(MobilityRequest.TYPES.GET_NEARBY_STOPS, { lat: 45.5, lng: -73.5 }));

    expect(receiver.getNearbyStops).toHaveBeenCalledWith(45.5, -73.5);
  });

  it('returns 200 MobilityResponse with stops list', async () => {
    const receiver = { getNearbyStops: jest.fn().mockResolvedValue(stops) };
    const cmd = new GetNearbyStopsCommand(receiver);

    const res = await cmd.execute(makeRequest(MobilityRequest.TYPES.GET_NEARBY_STOPS, { lat: 45.5, lng: -73.5 }));

    expect(res.statusCode).toBe(200);
    expect(res.data).toEqual(stops);
  });

  it('propagates errors from the receiver', async () => {
    const receiver = { getNearbyStops: jest.fn().mockRejectedValue(new Error('lookup failed')) };
    const cmd = new GetNearbyStopsCommand(receiver);

    await expect(cmd.execute(makeRequest(MobilityRequest.TYPES.GET_NEARBY_STOPS, { lat: 0, lng: 0 }))).rejects.toThrow('lookup failed');
  });
});
