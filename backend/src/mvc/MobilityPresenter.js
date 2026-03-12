/**
 * MobilityPresenter — MVC Controller layer (Presentation Formatter)
 *
 * Receives a MobilityResponse from MobilityController and formats it into
 * a ViewModel ready for the View layer (React frontend / HTTP response body).
 *
 * The presenter is the boundary between the Model and View — it ensures
 * the View never receives raw domain objects and never contains logic.
 *
 * Flow: Controller → [MobilityPresenter] → ViewModel → View
 */
class MobilityPresenter {
  /**
   * Format a MobilityResponse into a JSON-ready ViewModel.
   * - Arrays are wrapped with a count field.
   * - Single objects are wrapped in { data }.
   * - Errors are returned as { error: { code, message } }.
   *
   * @param {import('./MobilityResponse')} response
   * @returns {object} ViewModel for the view layer
   */
  present(response) {
    if (!response.success) {
      return { error: { code: 'ERROR', message: response.error } };
    }

    if (Array.isArray(response.data)) {
      return { data: response.data, count: response.data.length };
    }

    return { data: response.data };
  }

  /**
   * Format an Error or ApiError into a standard error ViewModel.
   *
   * @param {Error} error
   * @returns {object} ViewModel
   */
  presentError(error) {
    return {
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Something went wrong',
      },
    };
  }
}

module.exports = new MobilityPresenter();
