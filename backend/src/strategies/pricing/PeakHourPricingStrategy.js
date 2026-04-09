/**
 * PeakHourPricingStrategy — Strategy Pattern (concrete strategy B)
 *
 * Applies a 1.5× surcharge when the booking starts during peak hours
 * (07:00–09:00 or 17:00–19:00). Falls back to the standard rate outside
 * those windows. This strategy is interchangeable with PerMinutePricingStrategy
 * — the context (PricingService) selects which one to use at runtime.
 */
const IPricingStrategy = require('./IPricingStrategy');

const PEAK_MULTIPLIER = 1.5;

class PeakHourPricingStrategy extends IPricingStrategy {
  calculatePrice(option, startTime, endTime) {
    const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();
    const durationMinutes = Math.max(1, durationMs / (1000 * 60));

    const hour = new Date(startTime).getHours();
    // Peak-hour detection stays local to the strategy so the pricing context can remain algorithm-agnostic.
    const isPeakHour = (hour >= 7 && hour < 9) || (hour >= 17 && hour < 19);
    const multiplier = isPeakHour ? PEAK_MULTIPLIER : 1.0;

    return Math.round(option.basePrice * durationMinutes * multiplier * 100) / 100;
  }
}

module.exports = PeakHourPricingStrategy;
