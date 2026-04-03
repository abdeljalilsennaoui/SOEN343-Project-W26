const ReservationCreatedEvent = require('../../../../src/analytics/events/ReservationCreatedEvent');
const RideJoinedEvent = require('../../../../src/analytics/events/RideJoinedEvent');
// Import the singleton
const loggingVisitor = require('../../../../src/analytics/visitors/LoggingVisitor');

describe('LoggingVisitor', () => {
  let consoleSpy;
  beforeEach(() => { consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {}); });
  afterEach(() => consoleSpy.mockRestore());

  it('logs event type to console', () => {
    const event = new ReservationCreatedEvent({ city: 'Montreal', vehicleType: 'BIKE_SHARING', optionId: 'o1', userId: 'u1' });
    loggingVisitor.visit(event);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const logged = consoleSpy.mock.calls[0][0];
    expect(logged).toContain('RESERVATION_CREATED');
  });

  it('includes city in the log output', () => {
    const event = new ReservationCreatedEvent({ city: 'Toronto', vehicleType: 'CAR_SHARING', optionId: 'o2', userId: 'u2' });
    loggingVisitor.visit(event);
    expect(consoleSpy.mock.calls[0][0]).toContain('city=Toronto');
  });

  it('uses city=n/a when city is null', () => {
    const event = new RideJoinedEvent({ bookingId: 'b1', passengerId: 'p1' });
    loggingVisitor.visit(event);
    expect(consoleSpy.mock.calls[0][0]).toContain('city=n/a');
  });

  it('includes metadata key-value pairs in the log', () => {
    const event = new ReservationCreatedEvent({ city: 'Montreal', vehicleType: 'BIKE_SHARING', optionId: 'opt-99', userId: 'usr-1' });
    loggingVisitor.visit(event);
    const logged = consoleSpy.mock.calls[0][0];
    expect(logged).toContain('optionId=opt-99');
    expect(logged).toContain('userId=usr-1');
  });

  it('log line starts with [analytics] prefix', () => {
    const event = new RideJoinedEvent({ bookingId: 'b1', passengerId: 'p1' });
    loggingVisitor.visit(event);
    expect(consoleSpy.mock.calls[0][0]).toMatch(/^\[analytics\]/);
  });
});
