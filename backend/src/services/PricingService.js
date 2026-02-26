/**
 * Calculates the total price for a booking window.
 * totalPrice = option.basePrice * durationInMinutes (minimum 1 minute)
 *
 * @param {import('../models/MobilityOption').MobilityOption} option
 * @param {string} startTime - ISO datetime
 * @param {string} endTime - ISO datetime
 * @returns {number} total price rounded to 2 decimal places
 */
function calculatePrice(option, startTime, endTime) {
  const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();
  const durationMinutes = Math.max(1, durationMs / (1000 * 60));
  return Math.round(option.basePrice * durationMinutes * 100) / 100;
}

module.exports = { calculatePrice };
