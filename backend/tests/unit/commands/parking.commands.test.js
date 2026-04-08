const MobilityRequest  = require('../../../src/mvc/MobilityRequest');
const {
  GetParkingFacilitiesCommand,
  GetFacilitySpotsCommand,
  GetAvailableSpotsCommand,
  ReserveParkingSpotCommand,
  ReleaseParkingSpotCommand,
  GetNearbyParkingsCommand,
} = require('../../../src/commands/parking.commands');

function makeRequest(type, payload = {}) {
  return new MobilityRequest(type, null, payload);
}

// ── GetParkingFacilitiesCommand ──────────────────────────────────────────────

describe('GetParkingFacilitiesCommand', () => {
  it('calls receiver.getParkingFacilities with city', async () => {
    const facilities = [{ id: 'f-1' }];
    const receiver = { getParkingFacilities: jest.fn().mockResolvedValue(facilities) };
    const cmd = new GetParkingFacilitiesCommand(receiver);

    const res = await cmd.execute(makeRequest(MobilityRequest.TYPES.GET_PARKING_FACILITIES, { city: 'Montreal' }));

    expect(receiver.getParkingFacilities).toHaveBeenCalledWith('Montreal');
    expect(res.statusCode).toBe(200);
    expect(res.data).toEqual(facilities);
  });
});

// ── GetFacilitySpotsCommand ──────────────────────────────────────────────────

describe('GetFacilitySpotsCommand', () => {
  it('returns 200 with facility and spots when found', async () => {
    const result = { facility: { id: 'f-1' }, spots: [{ id: 's-1' }] };
    const receiver = { getFacilityWithSpots: jest.fn().mockResolvedValue(result) };
    const cmd = new GetFacilitySpotsCommand(receiver);

    const res = await cmd.execute(makeRequest(MobilityRequest.TYPES.GET_FACILITY_SPOTS, { facilityId: 'f-1' }));

    expect(receiver.getFacilityWithSpots).toHaveBeenCalledWith('f-1');
    expect(res.statusCode).toBe(200);
    expect(res.data).toEqual(result);
  });

  it('returns 404 when facility is not found', async () => {
    const receiver = { getFacilityWithSpots: jest.fn().mockResolvedValue(null) };
    const cmd = new GetFacilitySpotsCommand(receiver);

    const res = await cmd.execute(makeRequest(MobilityRequest.TYPES.GET_FACILITY_SPOTS, { facilityId: 'missing' }));

    expect(res.statusCode).toBe(404);
    expect(res.success).toBe(false);
  });
});

// ── GetAvailableSpotsCommand ─────────────────────────────────────────────────

describe('GetAvailableSpotsCommand', () => {
  it('calls receiver.getAvailableSpots with city and returns results', async () => {
    const spots = [{ id: 's-1', status: 'AVAILABLE' }];
    const receiver = { getAvailableSpots: jest.fn().mockResolvedValue(spots) };
    const cmd = new GetAvailableSpotsCommand(receiver);

    const res = await cmd.execute(makeRequest(MobilityRequest.TYPES.GET_AVAILABLE_SPOTS, { city: 'Toronto' }));

    expect(receiver.getAvailableSpots).toHaveBeenCalledWith('Toronto');
    expect(res.statusCode).toBe(200);
    expect(res.data).toEqual(spots);
  });
});

// ── ReserveParkingSpotCommand ────────────────────────────────────────────────

describe('ReserveParkingSpotCommand', () => {
  it('calls receiver.reserveParkingSpot with spotId and returns result', async () => {
    const reserved = { id: 's-1', status: 'RESERVED' };
    const receiver = { reserveParkingSpot: jest.fn().mockResolvedValue(reserved) };
    const cmd = new ReserveParkingSpotCommand(receiver);

    const res = await cmd.execute(makeRequest(MobilityRequest.TYPES.RESERVE_PARKING_SPOT, { spotId: 's-1' }));

    expect(receiver.reserveParkingSpot).toHaveBeenCalledWith('s-1');
    expect(res.statusCode).toBe(200);
    expect(res.data).toEqual(reserved);
  });

  it('propagates errors from the receiver', async () => {
    const receiver = { reserveParkingSpot: jest.fn().mockRejectedValue(new Error('already reserved')) };
    const cmd = new ReserveParkingSpotCommand(receiver);

    await expect(cmd.execute(makeRequest(MobilityRequest.TYPES.RESERVE_PARKING_SPOT, { spotId: 's-1' }))).rejects.toThrow('already reserved');
  });
});

// ── ReleaseParkingSpotCommand ────────────────────────────────────────────────

describe('ReleaseParkingSpotCommand', () => {
  it('calls receiver.releaseParkingSpot with spotId and returns result', async () => {
    const released = { id: 's-1', status: 'AVAILABLE' };
    const receiver = { releaseParkingSpot: jest.fn().mockResolvedValue(released) };
    const cmd = new ReleaseParkingSpotCommand(receiver);

    const res = await cmd.execute(makeRequest(MobilityRequest.TYPES.RELEASE_PARKING_SPOT, { spotId: 's-1' }));

    expect(receiver.releaseParkingSpot).toHaveBeenCalledWith('s-1');
    expect(res.statusCode).toBe(200);
    expect(res.data).toEqual(released);
  });

  it('propagates errors from the receiver', async () => {
    const receiver = { releaseParkingSpot: jest.fn().mockRejectedValue(new Error('not reserved')) };
    const cmd = new ReleaseParkingSpotCommand(receiver);

    await expect(cmd.execute(makeRequest(MobilityRequest.TYPES.RELEASE_PARKING_SPOT, { spotId: 's-1' }))).rejects.toThrow('not reserved');
  });
});

// ── GetNearbyParkingsCommand ─────────────────────────────────────────────────

describe('GetNearbyParkingsCommand', () => {
  it('calls receiver.getNearbyParkings with lat, lng, radius, maxResults', async () => {
    const nearby = [{ id: 'f-1', distanceMeters: 200 }];
    const receiver = { getNearbyParkings: jest.fn().mockResolvedValue(nearby) };
    const cmd = new GetNearbyParkingsCommand(receiver);
    const payload = { lat: 45.5, lng: -73.5, radius: 500, maxResults: 10 };

    const res = await cmd.execute(makeRequest(MobilityRequest.TYPES.GET_NEARBY_PARKINGS, payload));

    expect(receiver.getNearbyParkings).toHaveBeenCalledWith({ lat: 45.5, lng: -73.5 }, 500, 10);
    expect(res.statusCode).toBe(200);
    expect(res.data).toEqual(nearby);
  });
});
