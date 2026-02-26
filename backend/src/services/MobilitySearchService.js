const MobilityOption = require('../models/MobilityOption');
const AvailabilityService = require('./AvailabilityService');
const PricingService = require('./PricingService');

/**
 * Searches mobility options by the given filters.
 * Returns all matching options (available or not), sorted: available first, then price ascending.
 *
 * @param {{ city: string, type?: string, maxPrice?: number, startTime: string, endTime: string }} params
 * @returns {Promise<MobilityOptionViewModel[]>}
 */
async function search({ city, type, maxPrice, startTime, endTime }) {
  const candidates = await MobilityOption.findAll({ city, type });

  const results = await Promise.all(
    candidates.map(async (option) => {
      const availability = await AvailabilityService.isAvailable(option, startTime, endTime);
      const estimatedPrice = PricingService.calculatePrice(option, startTime, endTime);
      return {
        optionId: option.id,
        type: option.type,
        city: option.city,
        availability,
        estimatedPrice,
        shortDescription: option.description,
      };
    })
  );

  // Filter by maxPrice if provided
  const filtered =
    maxPrice !== undefined ? results.filter((r) => r.estimatedPrice <= maxPrice) : results;

  // Sort: available first, then estimatedPrice ascending
  filtered.sort((a, b) => {
    if (a.availability !== b.availability) return a.availability ? -1 : 1;
    return a.estimatedPrice - b.estimatedPrice;
  });

  return filtered;
}

module.exports = { search };
