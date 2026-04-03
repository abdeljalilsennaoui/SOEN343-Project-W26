// Mock AnalyticsReport before importing PersistenceVisitor
jest.mock('../../../../src/models/AnalyticsReport', () => ({
  trackEvent: jest.fn().mockResolvedValue(undefined),
}));

const AnalyticsReport = require('../../../../src/models/AnalyticsReport');
const ReservationCreatedEvent = require('../../../../src/analytics/events/ReservationCreatedEvent');
const BookingConfirmedEvent = require('../../../../src/analytics/events/BookingConfirmedEvent');
const RideJoinedEvent = require('../../../../src/analytics/events/RideJoinedEvent');
const persistenceVisitor = require('../../../../src/analytics/visitors/PersistenceVisitor');

describe('PersistenceVisitor', () => {
  it('calls AnalyticsReport.trackEvent with correct type, city, and metadata', async () => {
    const event = new ReservationCreatedEvent({
      city: 'Montreal',
      vehicleType: 'CAR_SHARING',
      optionId: 'opt-1',
      userId: 'u-1',
    });

    persistenceVisitor.visit(event);
    // Give fire-and-forget time to execute
    await new Promise(resolve => setImmediate(resolve));

    expect(AnalyticsReport.trackEvent).toHaveBeenCalledWith(
      'RESERVATION_CREATED',
      'Montreal',
      expect.objectContaining({ vehicleType: 'CAR_SHARING', optionId: 'opt-1', userId: 'u-1' }),
    );
  });

  it('passes null city for events with no city', async () => {
    const event = new RideJoinedEvent({ bookingId: 'b-1', passengerId: 'p-1' });
    persistenceVisitor.visit(event);
    await new Promise(resolve => setImmediate(resolve));

    expect(AnalyticsReport.trackEvent).toHaveBeenCalledWith('RIDE_JOINED', null, expect.any(Object));
  });

  it('passes correct metadata for BookingConfirmedEvent', async () => {
    const event = new BookingConfirmedEvent({ city: 'Vancouver', bookingId: 'b-2', type: 'BIKE_SHARING', amount: 50 });
    persistenceVisitor.visit(event);
    await new Promise(resolve => setImmediate(resolve));

    expect(AnalyticsReport.trackEvent).toHaveBeenCalledWith(
      'BOOKING_CONFIRMED',
      'Vancouver',
      expect.objectContaining({ bookingId: 'b-2', amount: 50 }),
    );
  });

  it('swallows errors — does not throw when AnalyticsReport fails', async () => {
    AnalyticsReport.trackEvent.mockRejectedValueOnce(new Error('Firestore down'));
    const event = new RideJoinedEvent({ bookingId: 'b-3', passengerId: 'p-3' });

    expect(() => persistenceVisitor.visit(event)).not.toThrow();
    // Wait for rejected promise to settle — should be swallowed silently
    await new Promise(resolve => setImmediate(resolve));
  });
});
