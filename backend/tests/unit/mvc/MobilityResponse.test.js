const MobilityResponse = require('../../../src/mvc/MobilityResponse');

describe('MobilityResponse', () => {
  describe('constructor', () => {
    it('stores all provided options', () => {
      const res = new MobilityResponse({ success: true, data: { id: 1 }, error: null, statusCode: 200 });

      expect(res.success).toBe(true);
      expect(res.data).toEqual({ id: 1 });
      expect(res.error).toBeNull();
      expect(res.statusCode).toBe(200);
    });

    it('defaults data to null and error to null when omitted', () => {
      const res = new MobilityResponse({ success: true, statusCode: 200 });

      expect(res.data).toBeNull();
      expect(res.error).toBeNull();
    });

    it('defaults statusCode to 200 when omitted', () => {
      const res = new MobilityResponse({ success: true });

      expect(res.statusCode).toBe(200);
    });
  });

  describe('MobilityResponse.ok()', () => {
    it('returns a successful 200 response wrapping the data', () => {
      const data = { items: [1, 2, 3] };
      const res = MobilityResponse.ok(data);

      expect(res).toBeInstanceOf(MobilityResponse);
      expect(res.success).toBe(true);
      expect(res.statusCode).toBe(200);
      expect(res.data).toEqual(data);
      expect(res.error).toBeNull();
    });

    it('works with null data', () => {
      const res = MobilityResponse.ok(null);

      expect(res.success).toBe(true);
      expect(res.data).toBeNull();
    });
  });

  describe('MobilityResponse.created()', () => {
    it('returns a successful 201 response wrapping the data', () => {
      const data = { id: 'new-1' };
      const res = MobilityResponse.created(data);

      expect(res).toBeInstanceOf(MobilityResponse);
      expect(res.success).toBe(true);
      expect(res.statusCode).toBe(201);
      expect(res.data).toEqual(data);
    });
  });

  describe('MobilityResponse.fail()', () => {
    it('returns a failure response with default 400 status', () => {
      const error = { code: 'VALIDATION_ERROR', message: 'bad input' };
      const res = MobilityResponse.fail(error);

      expect(res).toBeInstanceOf(MobilityResponse);
      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(400);
      expect(res.error).toEqual(error);
      expect(res.data).toBeNull();
    });

    it('accepts a custom status code', () => {
      const res = MobilityResponse.fail({ code: 'NOT_FOUND' }, 404);

      expect(res.statusCode).toBe(404);
      expect(res.success).toBe(false);
    });

    it('accepts 409 conflict status', () => {
      const res = MobilityResponse.fail({ code: 'CONFLICT' }, 409);

      expect(res.statusCode).toBe(409);
    });
  });
});
