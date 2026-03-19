/**
 * PricingService — Strategy Pattern (context)
 *
 * Stores the active pricing strategy and delegates all price calculations
 * to it. The strategy can be swapped at runtime via setStrategy() without
 * changing any caller.
 *
 * Default strategy: PerMinutePricingStrategy.
 * To switch to peak-hour pricing at runtime:
 *   PricingService.setStrategy(new PeakHourPricingStrategy());
 */
const PerMinutePricingStrategy = require('../strategies/pricing/PerMinutePricingStrategy');

class PricingContext {
  constructor(strategy) {
    this.strategy = strategy;
  }

  /** Replace the active pricing algorithm at runtime. */
  setStrategy(strategy) {
    this.strategy = strategy;
  }

  /**
   * Calculate the total price for a booking window.
   * Delegates entirely to the current strategy — no pricing logic here.
   *
   * @param {object} option     - Mobility option (must include basePrice)
   * @param {string} startTime  - ISO datetime
   * @param {string} endTime    - ISO datetime
   * @returns {number} total price rounded to 2 decimal places
   */
  calculatePrice(option, startTime, endTime) {
    return this.strategy.calculatePrice(option, startTime, endTime);
  }
}

module.exports = new PricingContext(new PerMinutePricingStrategy());
