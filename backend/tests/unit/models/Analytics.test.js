const Analytics = require('../../../src/models/AnalyticsReport');

describe('Analytics Model', () => {
  describe('trackEvent', () => {
    it('should create and store an event', () => {
      const event = Analytics.trackEvent('TEST_EVENT', 'Montreal', { key: 'value' });
      expect(event.id).toBeDefined();
      expect(event.type).toBe('TEST_EVENT');
      expect(event.city).toBe('Montreal');
      expect(event.createdAt).toBeDefined();
      expect(event.metadata).toEqual({ key: 'value' });
    });
  });

  describe('findByCity', () => {
    it('should return events for a city', () => {
      Analytics.trackEvent('CITY_EVENT', 'Toronto');
      const events = Analytics.findByCity('Toronto');
      expect(events.length).toBeGreaterThan(0);
      events.forEach((e) => {
        expect(e.city.toLowerCase()).toBe('toronto');
      });
    });

    it('should be case-insensitive', () => {
      const events = Analytics.findByCity('toronto');
      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('findByType', () => {
    it('should return events by type', () => {
      Analytics.trackEvent('UNIQUE_TYPE', 'Vancouver');
      const events = Analytics.findByType('UNIQUE_TYPE');
      expect(events.length).toBeGreaterThan(0);
      events.forEach((e) => {
        expect(e.type).toBe('UNIQUE_TYPE');
      });
    });
  });

  describe('findAll', () => {
    it('should return all events', () => {
      const events = Analytics.findAll();
      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('getRentalAnalytics', () => {
    it('should calculate rental analytics correctly', () => {
      // Add mock reservation events
      Analytics.trackEvent('RESERVATION_CREATED', 'Montreal', { vehicleType: 'BIKE_SHARING' });
      Analytics.trackEvent('RESERVATION_CREATED', 'Montreal', { vehicleType: 'BIKE_SHARING' });
      Analytics.trackEvent('RESERVATION_CREATED', 'Toronto', { vehicleType: 'CAR_SHARING' });

      const stats = Analytics.getRentalAnalytics();
      expect(stats.totalRentals).toBeGreaterThanOrEqual(3);
      expect(stats.rentalsByCity['Montreal']).toBeGreaterThanOrEqual(2);
      expect(stats.rentalsByCity['Toronto']).toBeGreaterThanOrEqual(1);
      expect(stats.rentalsByType['BIKE_SHARING']).toBeGreaterThanOrEqual(2);
      expect(stats.rentalsByType['CAR_SHARING']).toBeGreaterThanOrEqual(1);
    });
  });
});
