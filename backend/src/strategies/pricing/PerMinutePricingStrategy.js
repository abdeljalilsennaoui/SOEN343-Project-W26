/**
 * PerMinutePricingStrategy — Strategy Pattern (concrete strategy A)
 *
 * Calculates price as: basePrice × durationInMinutes.
 * This is the standard pricing algorithm used for all non-peak bookings.
 */
const IPricingStrategy = require('./IPricingStrategy');

class PerMinutePricingStrategy extends IPricingStrategy {
  calculatePrice(option, startTime, endTime) {
    const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();
    const durationMinutes = Math.max(1, durationMs / (1000 * 60));
    return Math.round(option.basePrice * durationMinutes * 100) / 100;
  }
}

module.exports = PerMinutePricingStrategy;
