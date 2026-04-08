const MobilityRequest = require('../../../src/mvc/MobilityRequest');

describe('MobilityRequest', () => {
  it('stores type, userId, and payload on construction', () => {
    const req = new MobilityRequest('GET_VEHICLES', 'u-1', { city: 'Montreal' });

    expect(req.type).toBe('GET_VEHICLES');
    expect(req.userId).toBe('u-1');
    expect(req.payload).toEqual({ city: 'Montreal' });
  });

  it('defaults payload to empty object when not provided', () => {
    const req = new MobilityRequest('GET_VEHICLES', 'u-1');

    expect(req.payload).toEqual({});
  });

  it('sets a timestamp ISO string on construction', () => {
    const before = new Date().toISOString();
    const req = new MobilityRequest('GET_VEHICLES', 'u-1');
    const after = new Date().toISOString();

    expect(req.timestamp >= before).toBe(true);
    expect(req.timestamp <= after).toBe(true);
  });

  it('exposes all TYPES as frozen constants', () => {
    expect(MobilityRequest.TYPES).toBeDefined();
    expect(Object.isFrozen(MobilityRequest.TYPES)).toBe(true);
    expect(MobilityRequest.TYPES.GET_VEHICLES).toBe('GET_VEHICLES');
    expect(MobilityRequest.TYPES.CREATE_BOOKING_DRAFT).toBe('CREATE_BOOKING_DRAFT');
    expect(MobilityRequest.TYPES.CONFIRM_BOOKING).toBe('CONFIRM_BOOKING');
    expect(MobilityRequest.TYPES.COMPLETE_BOOKING).toBe('COMPLETE_BOOKING');
    expect(MobilityRequest.TYPES.GET_MY_BOOKINGS).toBe('GET_MY_BOOKINGS');
    expect(MobilityRequest.TYPES.LIST_RIDE_SHARES).toBe('LIST_RIDE_SHARES');
    expect(MobilityRequest.TYPES.JOIN_RIDE).toBe('JOIN_RIDE');
    expect(MobilityRequest.TYPES.LEAVE_RIDE).toBe('LEAVE_RIDE');
  });

  it('each instance has an independent timestamp', () => {
    const req1 = new MobilityRequest('A', 'u-1');
    const req2 = new MobilityRequest('B', 'u-2');

    expect(req1.timestamp).toBeDefined();
    expect(req2.timestamp).toBeDefined();
  });
});
