/**
 * IPricingStrategy — Strategy Pattern (interface)
 *
 * Defines the contract for all pricing algorithms.
 * Any concrete strategy that extends this class can be plugged
 * into PricingContext via setStrategy() without changing the caller.
 */
class IPricingStrategy {
  /**
   * Calculate the total price for a mobility option over a time window.
   *
   * @param {object} option     - Mobility option (must include basePrice)
   * @param {string} startTime  - ISO datetime
   * @param {string} endTime    - ISO datetime
   * @returns {number} total price rounded to 2 decimal places
   */
  calculatePrice(_option, _startTime, _endTime) {
    throw new Error('IPricingStrategy.calculatePrice() must be implemented');
  }
}

module.exports = IPricingStrategy;
