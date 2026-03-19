/**
 * MobilityRequestHandler — MVC Model (Request Coordinator) + Command Pattern (Invoker)
 *
 * Receives a MobilityRequest from MobilityController, looks up the matching
 * command in CommandRegistry, and calls command.execute(request).
 *
 * As the Invoker, MobilityRequestHandler knows nothing about how any operation
 * is carried out — that knowledge lives inside each command and its receiver
 * (MobilityService). Adding a new request type = register one new command in
 * CommandRegistry; this file never changes.
 *
 * Flow: MobilityController → [MobilityRequestHandler] → CommandRegistry
 *       → ConcreteCommand.execute() → MobilityService → MobilityResponse
 */
const MobilityResponse = require('./MobilityResponse');
const registry = require('../commands/CommandRegistry');

class MobilityRequestHandler {
  /**
   * Look up the command for request.type and execute it.
   * Returns a MobilityResponse in all cases (success or failure).
   *
   * @param {import('./MobilityRequest')} request
   * @returns {Promise<MobilityResponse>}
   */
  async handle(request) {
    const command = registry.get(request.type);

    if (!command) {
      return MobilityResponse.fail(`Unknown request type: ${request.type}`, 400);
    }

    return command.execute(request);
  }
}

module.exports = new MobilityRequestHandler();
