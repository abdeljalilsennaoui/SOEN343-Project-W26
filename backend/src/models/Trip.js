/**
 * @typedef {Object} Trip
 * @property {string} id
 * @property {string} userId
 * @property {string} mode - TripMode enum value
 * @property {number} distanceKm
 * @property {number} durationMin
 * @property {number} carbonKgCO2e
 * @property {string} startedAt - ISO date string
 * @property {string} [endedAt] - ISO date string
 */

function createTrip({ id, userId, mode, distanceKm, durationMin, carbonKgCO2e, startedAt, endedAt = null }) {
  return { id, userId, mode, distanceKm, durationMin, carbonKgCO2e, startedAt, endedAt };
}

module.exports = { createTrip };
