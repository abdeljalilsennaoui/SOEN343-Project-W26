jest.mock('../../../src/lib/firestore');

const db = require('../../../src/lib/firestore');
const Analytics = require('../../../src/models/AnalyticsReport');

beforeEach(() => { db._reset(); });

describe('Analytics.trackEvent()', () => {
  it('creates and stores an event', async () => {
    const event = await Analytics.trackEvent('TEST_EVENT', 'Montreal', { key: 'value' });
    expect(event.id).toBeDefined();
    expect(event.type).toBe('TEST_EVENT');
    expect(event.city).toBe('Montreal');
    expect(event.createdAt).toBeDefined();
    expect(event.metadata).toEqual({ key: 'value' });
  });
});

describe('Analytics.findByCity()', () => {
  it('returns events for a city (exact match)', async () => {
    await Analytics.trackEvent('CITY_EVENT', 'Toronto');
    const events = await Analytics.findByCity('Toronto');
    expect(events.length).toBeGreaterThan(0);
    events.forEach((e) => expect(e.city).toBe('Toronto'));
  });

  it('returns empty array when city casing does not match', async () => {
    await Analytics.trackEvent('CITY_EVENT', 'Toronto');
    const events = await Analytics.findByCity('toronto');
    expect(events).toEqual([]);
  });
});

describe('Analytics.findByType()', () => {
  it('returns events by type', async () => {
    await Analytics.trackEvent('UNIQUE_TYPE', 'Vancouver');
    const events = await Analytics.findByType('UNIQUE_TYPE');
    expect(events.length).toBeGreaterThan(0);
    events.forEach((e) => expect(e.type).toBe('UNIQUE_TYPE'));
  });
});

describe('Analytics.findAll()', () => {
  it('returns all stored events', async () => {
    await Analytics.trackEvent('TYPE_A', 'Montreal');
    await Analytics.trackEvent('TYPE_B', 'Toronto');
    const events = await Analytics.findAll();
    expect(events.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Analytics.getRentalAnalytics()', () => {
  it('calculates rental analytics from RESERVATION_CREATED events', async () => {
    await Analytics.trackEvent('RESERVATION_CREATED', 'Montreal', { vehicleType: 'BIKE_SHARING' });
    await Analytics.trackEvent('RESERVATION_CREATED', 'Montreal', { vehicleType: 'BIKE_SHARING' });
    await Analytics.trackEvent('RESERVATION_CREATED', 'Toronto',  { vehicleType: 'CAR_SHARING' });

    const stats = await Analytics.getRentalAnalytics();
    expect(stats.totalRentals).toBeGreaterThanOrEqual(3);
    expect(stats.rentalsByCity['Montreal']).toBeGreaterThanOrEqual(2);
    expect(stats.rentalsByCity['Toronto']).toBeGreaterThanOrEqual(1);
    expect(stats.rentalsByType['BIKE_SHARING']).toBeGreaterThanOrEqual(2);
    expect(stats.rentalsByType['CAR_SHARING']).toBeGreaterThanOrEqual(1);
  });

  it('returns zero counts when no RESERVATION_CREATED events exist', async () => {
    const stats = await Analytics.getRentalAnalytics();
    expect(stats.totalRentals).toBe(0);
    expect(stats.rentalsByCity).toEqual({});
    expect(stats.rentalsByType).toEqual({});
  });
});
