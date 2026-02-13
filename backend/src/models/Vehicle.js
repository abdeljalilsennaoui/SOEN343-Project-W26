const { v4: uuidv4 } = require('uuid');
const { VehicleStatus, TripMode } = require('./enums');
const ApiError = require('./ApiError');

/**
 * Vehicle Model — data, storage, and business logic (MVC pattern)
 *
 * @typedef {Object} Vehicle
 * @property {string} id
 * @property {string} type - CAR_SHARING, BIKE_SHARING, or SCOOTER_SHARING
 * @property {string} city
 * @property {string} status - VehicleStatus enum value
 * @property {number} pricePerMin
 * @property {string} [providerId]
 */

// In-memory storage
const vehicles = new Map();

// Seed mock data on module load
function _seedData() {
  const cities = ['Montreal', 'Toronto', 'Vancouver'];
  const types = [TripMode.BIKE_SHARING, TripMode.SCOOTER_SHARING, TripMode.CAR_SHARING];
  const prices = {
    [TripMode.BIKE_SHARING]: 0.15,
    [TripMode.SCOOTER_SHARING]: 0.25,
    [TripMode.CAR_SHARING]: 0.50,
  };

  for (const city of cities) {
    for (const type of types) {
      for (let i = 0; i < 3; i++) {
        const id = uuidv4();
        vehicles.set(id, {
          id,
          type,
          city,
          status: VehicleStatus.AVAILABLE,
          pricePerMin: prices[type],
          providerId: null,
        });
      }
    }
  }
}

_seedData();

// Data access methods
function findAll(filters = {}) {
  let results = Array.from(vehicles.values());
  if (filters.city) {
    results = results.filter((v) => v.city.toLowerCase() === filters.city.toLowerCase());
  }
  if (filters.type) {
    results = results.filter((v) => v.type === filters.type);
  }
  if (filters.status) {
    results = results.filter((v) => v.status === filters.status);
  }
  return results;
}

function findById(id) {
  return vehicles.get(id) || null;
}

function updateStatus(id, status) {
  const vehicle = vehicles.get(id);
  if (!vehicle) return null;
  vehicle.status = status;
  vehicles.set(id, vehicle);
  return vehicle;
}

// Business logic
function getAvailableVehicles(city, type) {
  const filters = { status: VehicleStatus.AVAILABLE };
  if (city) filters.city = city;
  if (type) filters.type = type;
  return findAll(filters);
}

function reserveVehicle(id) {
  const vehicle = findById(id);
  if (!vehicle) throw ApiError.notFound(`Vehicle ${id} not found`);
  if (vehicle.status !== VehicleStatus.AVAILABLE) {
    throw ApiError.conflict(`Vehicle ${id} is not available (status: ${vehicle.status})`);
  }
  return updateStatus(id, VehicleStatus.RESERVED);
}

function releaseVehicle(id) {
  const vehicle = findById(id);
  if (!vehicle) throw ApiError.notFound(`Vehicle ${id} not found`);
  return updateStatus(id, VehicleStatus.AVAILABLE);
}

module.exports = {
  findAll,
  findById,
  updateStatus,
  getAvailableVehicles,
  reserveVehicle,
  releaseVehicle,
};
