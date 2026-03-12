/**
 * MobilityResponse — MVC Model (Output DTO)
 *
 * Represents the result returned by MobilityRequestHandler after processing.
 * Received by MobilityController and forwarded to MobilityPresenter for formatting.
 *
 * Flow: MobilityRequestHandler → [MobilityResponse] → Controller → Presenter → View
 */
class MobilityResponse {
  /**
   * @param {object} options
   * @param {boolean} options.success    - Whether the operation succeeded
   * @param {any}     options.data       - Result payload on success
   * @param {string}  options.error      - Error message on failure
   * @param {number}  options.statusCode - HTTP status code
   */
  constructor({ success, data = null, error = null, statusCode = 200 }) {
    this.success = success;
    this.data = data;
    this.error = error;
    this.statusCode = statusCode;
  }

  /** Successful response with data. */
  static ok(data) {
    return new MobilityResponse({ success: true, data, statusCode: 200 });
  }

  /** Successful creation response. */
  static created(data) {
    return new MobilityResponse({ success: true, data, statusCode: 201 });
  }

  /** Failure response with error message and HTTP status. */
  static fail(error, statusCode = 400) {
    return new MobilityResponse({ success: false, error, statusCode });
  }
}

module.exports = MobilityResponse;
