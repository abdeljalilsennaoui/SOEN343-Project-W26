const MobilityRequest  = require('../../../src/mvc/MobilityRequest');
const MobilityResponse = require('../../../src/mvc/MobilityResponse');
const { GetRentalAnalyticsCommand, GetGatewayAnalyticsCommand } = require('../../../src/commands/analytics.commands');

function makeRequest(type, userId = null, payload = {}) {
  return new MobilityRequest(type, userId, payload);
}

// ── GetRentalAnalyticsCommand ────────────────────────────────────────────────

describe('GetRentalAnalyticsCommand', () => {
  const analytics = { totalRentals: 42, rentalsByCity: {}, rentalsByType: {} };

  it('calls receiver.getRentalAnalytics with userId and role from payload', async () => {
    const receiver = { getRentalAnalytics: jest.fn().mockResolvedValue(analytics) };
    const cmd = new GetRentalAnalyticsCommand(receiver);
    const req = makeRequest(MobilityRequest.TYPES.GET_RENTAL_ANALYTICS, 'u-1', { role: 'CITY_ADMINISTRATOR' });

    await cmd.execute(req);

    expect(receiver.getRentalAnalytics).toHaveBeenCalledWith('u-1', 'CITY_ADMINISTRATOR');
  });

  it('returns 200 MobilityResponse with analytics data', async () => {
    const receiver = { getRentalAnalytics: jest.fn().mockResolvedValue(analytics) };
    const cmd = new GetRentalAnalyticsCommand(receiver);

    const res = await cmd.execute(makeRequest(MobilityRequest.TYPES.GET_RENTAL_ANALYTICS, 'u-1'));

    expect(res).toBeInstanceOf(MobilityResponse);
    expect(res.statusCode).toBe(200);
    expect(res.data).toEqual(analytics);
  });

  it('handles undefined payload role gracefully', async () => {
    const receiver = { getRentalAnalytics: jest.fn().mockResolvedValue(analytics) };
    const cmd = new GetRentalAnalyticsCommand(receiver);
    const req = makeRequest(MobilityRequest.TYPES.GET_RENTAL_ANALYTICS, 'u-1');

    await cmd.execute(req);

    expect(receiver.getRentalAnalytics).toHaveBeenCalledWith('u-1', undefined);
  });

  it('propagates errors from the receiver', async () => {
    const receiver = { getRentalAnalytics: jest.fn().mockRejectedValue(new Error('analytics error')) };
    const cmd = new GetRentalAnalyticsCommand(receiver);

    await expect(cmd.execute(makeRequest(MobilityRequest.TYPES.GET_RENTAL_ANALYTICS))).rejects.toThrow('analytics error');
  });
});

// ── GetGatewayAnalyticsCommand ───────────────────────────────────────────────

describe('GetGatewayAnalyticsCommand', () => {
  const gatewayData = { payment: { calls: 10, failures: 1 } };

  it('calls receiver.getGatewayAnalytics without arguments', async () => {
    const receiver = { getGatewayAnalytics: jest.fn().mockResolvedValue(gatewayData) };
    const cmd = new GetGatewayAnalyticsCommand(receiver);

    await cmd.execute(makeRequest(MobilityRequest.TYPES.GET_GATEWAY_ANALYTICS));

    expect(receiver.getGatewayAnalytics).toHaveBeenCalled();
  });

  it('returns 200 MobilityResponse with gateway data', async () => {
    const receiver = { getGatewayAnalytics: jest.fn().mockResolvedValue(gatewayData) };
    const cmd = new GetGatewayAnalyticsCommand(receiver);

    const res = await cmd.execute(makeRequest(MobilityRequest.TYPES.GET_GATEWAY_ANALYTICS));

    expect(res.statusCode).toBe(200);
    expect(res.data).toEqual(gatewayData);
  });

  it('propagates errors from the receiver', async () => {
    const receiver = { getGatewayAnalytics: jest.fn().mockRejectedValue(new Error('gateway error')) };
    const cmd = new GetGatewayAnalyticsCommand(receiver);

    await expect(cmd.execute(makeRequest(MobilityRequest.TYPES.GET_GATEWAY_ANALYTICS))).rejects.toThrow('gateway error');
  });
});
