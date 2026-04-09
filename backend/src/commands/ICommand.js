/**
 * ICommand — Command Pattern (interface)
 *
 * All concrete commands must implement execute(). The command encapsulates
 * a single request as an object and delegates the actual work to a Receiver
 * (MobilityService) injected at construction time.
 * This file only defines the contract; concrete commands provide the workflow-specific behavior.
 *
 * The Invoker (MobilityRequestHandler) calls execute() without knowing
 * which operation is being performed or how it is carried out.
 */
class ICommand {
  /**
   * Execute the encapsulated operation.
   *
   * @param {import('../mvc/MobilityRequest')} request
   * @returns {Promise<import('../mvc/MobilityResponse')>}
   */
  async execute(_request) {
    throw new Error('ICommand.execute() must be implemented');
  }
}

module.exports = ICommand;
