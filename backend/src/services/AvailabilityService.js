const MobilityDataGateway = require('../mvc/MobilityDataGateway');

/**
 * Check how many slots are available for an option in a time window.
 *
 * @param {object} option - mobility option (must have id, blockedPeriods, capacity)
 * @param {string} startTime - ISO datetime
 * @param {string} endTime - ISO datetime
 * @param {string} [excludeBookingId] - booking id to exclude from conflict check
 * @returns {Promise<{ available: boolean, remaining: number, capacity: number, conflicting: number }>}
 */
async function checkAvailability(option, startTime, endTime, excludeBookingId) {
  const capacity = option.capacity ?? 1;
  const reqStart = new Date(startTime).getTime();
  const reqEnd = new Date(endTime).getTime();

  // Check hard-coded blocked periods on the option itself
  for (const period of (option.blockedPeriods || [])) {
    const blockStart = new Date(period.start).getTime();
    const blockEnd = new Date(period.end).getTime();
    if (reqStart < blockEnd && reqEnd > blockStart) {
      return { available: false, remaining: 0, capacity, conflicting: capacity };
    }
  }

  // Count existing bookings that conflict (only reads DRAFT+ACTIVE, not completed/failed)
  const allBookings = await MobilityDataGateway.findActiveAndDraftBookings();
  const conflicting = allBookings.filter((b) => {
    if (b.optionId !== option.id) return false;
    if (excludeBookingId && b.id === excludeBookingId) return false;
    const bookStart = new Date(b.startTime).getTime();
    const bookEnd = new Date(b.endTime).getTime();
    return reqStart < bookEnd && reqEnd > bookStart;
  });

  const remaining = Math.max(0, capacity - conflicting.length);
  return { available: remaining > 0, remaining, capacity, conflicting: conflicting.length };
}

/**
 * Backward-compatible boolean check.
 */
async function isAvailable(option, startTime, endTime, excludeBookingId) {
  const result = await checkAvailability(option, startTime, endTime, excludeBookingId);
  return result.available;
}

/**
 * Batch availability check — reads bookings ONCE for all options.
 * Returns a Map<optionId, { available, remaining, capacity, conflicting }>.
 */
async function checkAvailabilityBatch(options, startTime, endTime) {
  const reqStart = new Date(startTime).getTime();
  const reqEnd = new Date(endTime).getTime();

  // Single Firestore read for only DRAFT+ACTIVE bookings
  const activeBookings = await MobilityDataGateway.findActiveAndDraftBookings();

  const results = new Map();

  for (const option of options) {
    const capacity = option.capacity ?? 1;

    // Check blocked periods
    let blocked = false;
    for (const period of (option.blockedPeriods || [])) {
      const blockStart = new Date(period.start).getTime();
      const blockEnd = new Date(period.end).getTime();
      if (reqStart < blockEnd && reqEnd > blockStart) {
        blocked = true;
        break;
      }
    }

    if (blocked) {
      results.set(option.id, { available: false, remaining: 0, capacity, conflicting: capacity });
      continue;
    }

    const conflicting = activeBookings.filter((b) => {
      if (b.optionId !== option.id) return false;
      const bookStart = new Date(b.startTime).getTime();
      const bookEnd = new Date(b.endTime).getTime();
      return reqStart < bookEnd && reqEnd > bookStart;
    });

    const remaining = Math.max(0, capacity - conflicting.length);
    results.set(option.id, { available: remaining > 0, remaining, capacity, conflicting: conflicting.length });
  }

  return results;
}

module.exports = { isAvailable, checkAvailability, checkAvailabilityBatch };
