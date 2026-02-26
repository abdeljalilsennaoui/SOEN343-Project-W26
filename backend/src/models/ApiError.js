class ApiError extends Error {
  constructor(code, message, statusCode = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
  }

  static badRequest(message) {
    return new ApiError('BAD_REQUEST', message, 400);
  }

  static notFound(message) {
    return new ApiError('NOT_FOUND', message, 404);
  }

  static conflict(message) {
    return new ApiError('CONFLICT', message, 409);
  }

  static internal(message) {
    return new ApiError('INTERNAL_ERROR', message, 500);
  }

  static forbidden(message) {
    return new ApiError('FORBIDDEN', message, 403);
  }

  static paymentFailed(message) {
    return new ApiError('PAYMENT_FAILED', message, 402);
  }

  static unauthorized(message) {
    return new ApiError('UNAUTHORIZED', message, 401);
  }
}

module.exports = ApiError;
