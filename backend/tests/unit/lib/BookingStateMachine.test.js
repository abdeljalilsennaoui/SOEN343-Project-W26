const BookingStateMachine = require('../../../src/lib/BookingStateMachine');
const BookingState = require('../../../src/lib/states/BookingState');
const ApiError = require('../../../src/models/ApiError');
const { BookingStatus } = require('../../../src/models/enums');

describe('BookingState (abstract base)', () => {
  it('getName() throws when not overridden', () => {
    const state = new BookingState();
    expect(() => state.getName()).toThrow('BookingState.getName() must be implemented');
  });
});

describe('ApiError', () => {
  it('badRequest() creates 400 error with BAD_REQUEST code', () => {
    const err = ApiError.badRequest('invalid input');
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.message).toBe('invalid input');
  });

  it('internal() creates 500 error with INTERNAL_ERROR code', () => {
    const err = ApiError.internal('something broke');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
  });

  it('paymentFailed() creates 402 error with PAYMENT_FAILED code', () => {
    const err = ApiError.paymentFailed('card declined');
    expect(err.statusCode).toBe(402);
    expect(err.code).toBe('PAYMENT_FAILED');
  });

  it('unauthorized() creates 401 error with UNAUTHORIZED code', () => {
    const err = ApiError.unauthorized('token missing');
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('forbidden() creates 403 error with FORBIDDEN code', () => {
    const err = ApiError.forbidden('access denied');
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('notFound() creates 404 error with NOT_FOUND code', () => {
    const err = ApiError.notFound('not found');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });

  it('conflict() creates 409 error with CONFLICT code', () => {
    const err = ApiError.conflict('already exists');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
  });

  it('is an instance of Error', () => {
    const err = ApiError.notFound('x');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ApiError');
  });
});

describe('BookingStateMachine', () => {
  describe('constructor', () => {
    it('accepts valid statuses without throwing', () => {
      expect(() => new BookingStateMachine(BookingStatus.DRAFT)).not.toThrow();
      expect(() => new BookingStateMachine(BookingStatus.ACTIVE)).not.toThrow();
      expect(() => new BookingStateMachine(BookingStatus.COMPLETE)).not.toThrow();
      expect(() => new BookingStateMachine(BookingStatus.FAILED)).not.toThrow();
    });

    it('throws 409 ApiError for an unknown status', () => {
      expect(() => new BookingStateMachine('INVALID')).toThrow(ApiError);
      try {
        new BookingStateMachine('INVALID');
      } catch (e) {
        expect(e.statusCode).toBe(409);
        expect(e.code).toBe('INVALID_STATE');
      }
    });
  });

  describe('DRAFT state', () => {
    let machine;
    beforeEach(() => { machine = new BookingStateMachine(BookingStatus.DRAFT); });

    it('toActive() succeeds — transitions to ACTIVE', () => {
      expect(() => machine.toActive()).not.toThrow();
      // After transition, toComplete() should succeed (ACTIVE → COMPLETE)
      expect(() => machine.toComplete()).not.toThrow();
    });

    it('toFailed() succeeds — transitions to FAILED', () => {
      expect(() => machine.toFailed()).not.toThrow();
    });

    it('toComplete() throws 409 — illegal from DRAFT', () => {
      expect(() => machine.toComplete()).toThrow(ApiError);
      try { machine.toComplete(); } catch (e) {
        expect(e.statusCode).toBe(409);
        expect(e.code).toBe('DRAFT_INVALID_STATE');
      }
    });
  });

  describe('ACTIVE state', () => {
    let machine;
    beforeEach(() => { machine = new BookingStateMachine(BookingStatus.ACTIVE); });

    it('toComplete() succeeds — transitions to COMPLETE', () => {
      expect(() => machine.toComplete()).not.toThrow();
    });

    it('toActive() throws 409 — already active', () => {
      expect(() => machine.toActive()).toThrow(ApiError);
      try { machine.toActive(); } catch (e) {
        expect(e.statusCode).toBe(409);
      }
    });

    it('toFailed() throws 409 — illegal from ACTIVE', () => {
      expect(() => machine.toFailed()).toThrow(ApiError);
    });
  });

  describe('COMPLETE state (terminal)', () => {
    let machine;
    beforeEach(() => { machine = new BookingStateMachine(BookingStatus.COMPLETE); });

    it('toActive() throws 409', () => {
      expect(() => machine.toActive()).toThrow(ApiError);
    });

    it('toComplete() throws 409', () => {
      expect(() => machine.toComplete()).toThrow(ApiError);
    });

    it('toFailed() throws 409', () => {
      expect(() => machine.toFailed()).toThrow(ApiError);
    });
  });

  describe('FAILED state (terminal)', () => {
    let machine;
    beforeEach(() => { machine = new BookingStateMachine(BookingStatus.FAILED); });

    it('toActive() throws 409', () => {
      expect(() => machine.toActive()).toThrow(ApiError);
    });

    it('toComplete() throws 409', () => {
      expect(() => machine.toComplete()).toThrow(ApiError);
    });

    it('toFailed() throws 409', () => {
      expect(() => machine.toFailed()).toThrow(ApiError);
    });
  });

  describe('chained transitions', () => {
    it('DRAFT → ACTIVE → COMPLETE is valid', () => {
      const machine = new BookingStateMachine(BookingStatus.DRAFT);
      expect(() => machine.toActive()).not.toThrow();
      expect(() => machine.toComplete()).not.toThrow();
    });

    it('DRAFT → FAILED → anything throws', () => {
      const machine = new BookingStateMachine(BookingStatus.DRAFT);
      machine.toFailed();
      expect(() => machine.toActive()).toThrow(ApiError);
      expect(() => machine.toComplete()).toThrow(ApiError);
    });
  });
});
