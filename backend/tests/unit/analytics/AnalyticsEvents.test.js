const AnalyticsEvent = require('../../../src/analytics/events/AnalyticsEvent');
const ReservationCreatedEvent = require('../../../src/analytics/events/ReservationCreatedEvent');
const BookingConfirmedEvent = require('../../../src/analytics/events/BookingConfirmedEvent');
const RideJoinedEvent = require('../../../src/analytics/events/RideJoinedEvent');
const TransitQueryEvent = require('../../../src/analytics/events/TransitQueryEvent');

describe('AnalyticsEvent (abstract base)', () => {
  it('type getter throws if not overridden', () => {
    const event = new AnalyticsEvent();
    expect(() => event.type).toThrow('AnalyticsEvent.type must be overridden');
  });

  it('city defaults to null', () => {
    const event = new AnalyticsEvent();
    expect(event.city).toBeNull();
  });

  it('metadata defaults to empty object', () => {
    const event = new AnalyticsEvent();
    expect(event.metadata).toEqual({});
  });

  it('accept() throws if not overridden', () => {
    const event = new AnalyticsEvent();
    expect(() => event.accept({})).toThrow('AnalyticsEvent.accept() must be implemented');
  });
});

describe('ReservationCreatedEvent', () => {
  const payload = { city: 'Montreal', vehicleType: 'CAR_SHARING', optionId: 'opt-1', userId: 'u-1', providerId: 'p-1' };
  let event;
  beforeEach(() => { event = new ReservationCreatedEvent(payload); });

  it('has type RESERVATION_CREATED', () => {
    expect(event.type).toBe('RESERVATION_CREATED');
  });

  it('exposes city', () => {
    expect(event.city).toBe('Montreal');
  });

  it('metadata contains all fields', () => {
    expect(event.metadata).toEqual({
      vehicleType: 'CAR_SHARING',
      optionId: 'opt-1',
      userId: 'u-1',
      providerId: 'p-1',
    });
  });

  it('providerId defaults to null if omitted', () => {
    const e = new ReservationCreatedEvent({ city: 'Toronto', vehicleType: 'BIKE_SHARING', optionId: 'o', userId: 'u' });
    expect(e.metadata.providerId).toBeNull();
  });

  it('accept() calls visitor.visit(this)', () => {
    const visitor = { visit: jest.fn() };
    event.accept(visitor);
    expect(visitor.visit).toHaveBeenCalledWith(event);
    expect(visitor.visit).toHaveBeenCalledTimes(1);
  });

  it('accept() passes itself (same reference) to visitor', () => {
    const visitor = { visit: jest.fn() };
    event.accept(visitor);
    expect(visitor.visit.mock.calls[0][0]).toBe(event);
  });
});

describe('BookingConfirmedEvent', () => {
  const payload = { city: 'Vancouver', bookingId: 'b-1', type: 'CAR_SHARING', amount: 75.5 };
  let event;
  beforeEach(() => { event = new BookingConfirmedEvent(payload); });

  it('has type BOOKING_CONFIRMED', () => {
    expect(event.type).toBe('BOOKING_CONFIRMED');
  });

  it('exposes city', () => {
    expect(event.city).toBe('Vancouver');
  });

  it('metadata contains bookingId, type, amount', () => {
    expect(event.metadata).toEqual({ bookingId: 'b-1', type: 'CAR_SHARING', amount: 75.5 });
  });

  it('accept() calls visitor.visit(this)', () => {
    const visitor = { visit: jest.fn() };
    event.accept(visitor);
    expect(visitor.visit).toHaveBeenCalledWith(event);
  });
});

describe('RideJoinedEvent', () => {
  const payload = { bookingId: 'b-42', passengerId: 'p-99' };
  let event;
  beforeEach(() => { event = new RideJoinedEvent(payload); });

  it('has type RIDE_JOINED', () => {
    expect(event.type).toBe('RIDE_JOINED');
  });

  it('city is null (ride join has no city context)', () => {
    expect(event.city).toBeNull();
  });

  it('metadata contains bookingId and passengerId', () => {
    expect(event.metadata).toEqual({ bookingId: 'b-42', passengerId: 'p-99' });
  });

  it('accept() calls visitor.visit(this)', () => {
    const visitor = { visit: jest.fn() };
    event.accept(visitor);
    expect(visitor.visit).toHaveBeenCalledWith(event);
  });
});

describe('TransitQueryEvent', () => {
  it('has type TRANSIT_QUERY', () => {
    const event = new TransitQueryEvent({ city: 'Montreal', line: 'Green' });
    expect(event.type).toBe('TRANSIT_QUERY');
  });

  it('exposes city', () => {
    const event = new TransitQueryEvent({ city: 'Toronto', line: '1' });
    expect(event.city).toBe('Toronto');
  });

  it('metadata contains the line', () => {
    const event = new TransitQueryEvent({ city: 'Vancouver', line: 'Canada' });
    expect(event.metadata).toEqual({ line: 'Canada' });
  });

  it('metadata line is null when not provided', () => {
    const event = new TransitQueryEvent({ city: 'Montreal', line: null });
    expect(event.metadata.line).toBeNull();
  });

  it('accept() calls visitor.visit(this)', () => {
    const event = new TransitQueryEvent({ city: 'Montreal', line: 'Orange' });
    const visitor = { visit: jest.fn() };
    event.accept(visitor);
    expect(visitor.visit).toHaveBeenCalledWith(event);
  });
});

describe('Visitor double dispatch', () => {
  it('two different events calling accept() route to visitor.visit() with the correct event reference', () => {
    const visitor = { visit: jest.fn() };
    const e1 = new ReservationCreatedEvent({ city: 'A', vehicleType: 'BIKE_SHARING', optionId: '1', userId: 'u1' });
    const e2 = new RideJoinedEvent({ bookingId: 'b1', passengerId: 'p1' });

    e1.accept(visitor);
    e2.accept(visitor);

    expect(visitor.visit).toHaveBeenCalledTimes(2);
    expect(visitor.visit.mock.calls[0][0]).toBe(e1);
    expect(visitor.visit.mock.calls[1][0]).toBe(e2);
  });
});
