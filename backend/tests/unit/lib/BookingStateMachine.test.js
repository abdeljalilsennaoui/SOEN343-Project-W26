const BookingStateMachine = require('../../../src/lib/BookingStateMachine');
const ApiError = require('../../../src/models/ApiError');
const { BookingStatus } = require('../../../src/models/enums');

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
