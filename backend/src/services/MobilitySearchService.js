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

  // Single Firestore read for all options instead of one per option
  const availabilityMap = await AvailabilityService.checkAvailabilityBatch(candidates, startTime, endTime);

  const results = candidates.map((option) => {
    const avail = availabilityMap.get(option.id) ?? { available: false, remaining: 0, capacity: option.capacity ?? 1 };
    const estimatedPrice = PricingService.calculatePrice(option, startTime, endTime);
    return {
      optionId: option.id,
      type: option.type,
      city: option.city,
      availability: avail.available,
      remaining: avail.remaining,
      capacity: avail.capacity,
      estimatedPrice,
      shortDescription: option.description,
    };
  });

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
