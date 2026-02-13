const { v4: uuidv4 } = require('uuid');
const { ParkingStatus } = require('./enums');
const ApiError = require('./ApiError');

/**
 * Parking Model — data, storage, and business logic (MVC pattern)
 *
 * @typedef {Object} ParkingFacility
 * @property {string} id
 * @property {string} name
 * @property {string} city
 * @property {string} address
 *
 * @typedef {Object} ParkingSpot
 * @property {string} id
 * @property {string} facilityId
 * @property {string} status - ParkingStatus enum value
 * @property {number} pricePerHour
 * @property {string} spotNumber
 */

// In-memory storage
const facilities = new Map();
const spots = new Map();

// Seed mock data on module load
function _seedData() {
  const facilityData = [
    { name: 'Downtown Parking Garage', city: 'Montreal', address: '100 Rue Sainte-Catherine' },
    { name: 'Old Port Parking', city: 'Montreal', address: '333 Rue de la Commune' },
    { name: 'Bay Street Parking', city: 'Toronto', address: '200 Bay Street' },
    { name: 'Union Station Lot', city: 'Toronto', address: '65 Front Street' },
    { name: 'Robson Square Parking', city: 'Vancouver', address: '800 Robson Street' },
    { name: 'Waterfront Parkade', city: 'Vancouver', address: '200 Burrard Street' },
  ];

  for (const data of facilityData) {
    const facilityId = uuidv4();
    facilities.set(facilityId, { id: facilityId, ...data });

    // Create 5 spots per facility
    for (let i = 1; i <= 5; i++) {
      const spotId = uuidv4();
      spots.set(spotId, {
        id: spotId,
        facilityId,
        status: ParkingStatus.AVAILABLE,
        pricePerHour: data.city === 'Toronto' ? 8.0 : data.city === 'Montreal' ? 6.0 : 7.0,
        spotNumber: `${String.fromCharCode(64 + Math.ceil(i / 5))}${i}`,
      });
    }
  }
}

_seedData();

// ---------- Facility data access ----------
function findAllFacilities(city) {
  let results = Array.from(facilities.values());
  if (city) {
    results = results.filter((f) => f.city.toLowerCase() === city.toLowerCase());
  }
  return results;
}

function findFacilityById(id) {
  return facilities.get(id) || null;
}

// ---------- Spot data access ----------
function findSpotsByFacility(facilityId) {
  return Array.from(spots.values()).filter((s) => s.facilityId === facilityId);
}

function findSpotById(id) {
  return spots.get(id) || null;
}

// ---------- Business logic ----------
function getAvailableSpots(city) {
  const cityFacilities = findAllFacilities(city);
  const facilityIds = new Set(cityFacilities.map((f) => f.id));
  return Array.from(spots.values()).filter(
    (s) => facilityIds.has(s.facilityId) && s.status === ParkingStatus.AVAILABLE
  );
}

function reserveSpot(spotId) {
  const spot = findSpotById(spotId);
  if (!spot) throw ApiError.notFound(`Parking spot ${spotId} not found`);
  if (spot.status !== ParkingStatus.AVAILABLE) {
    throw ApiError.conflict(`Parking spot ${spotId} is not available (status: ${spot.status})`);
  }
  spot.status = ParkingStatus.RESERVED;
  spots.set(spotId, spot);
  return spot;
}

function releaseSpot(spotId) {
  const spot = findSpotById(spotId);
  if (!spot) throw ApiError.notFound(`Parking spot ${spotId} not found`);
  spot.status = ParkingStatus.AVAILABLE;
  spots.set(spotId, spot);
  return spot;
}

module.exports = {
  findAllFacilities,
  findFacilityById,
  findSpotsByFacility,
  findSpotById,
  getAvailableSpots,
  reserveSpot,
  releaseSpot,
};
