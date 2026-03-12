const Vehicle = require('../models/Vehicle');
const ApiError = require('../models/ApiError');
const { VehicleStatus, TripMode } = require('../models/enums');

const VALID_TYPES = Object.values(TripMode).filter((t) =>
  [TripMode.CAR_SHARING, TripMode.BIKE_SHARING, TripMode.SCOOTER_SHARING].includes(t),
);

async function addVehicle(providerId, { city, type, pricePerMin, description }) {
  if (!VALID_TYPES.includes(type)) {
    throw ApiError.badRequest(`Invalid vehicle type: ${type}. Must be one of: ${VALID_TYPES.join(', ')}`);
  }
  return Vehicle.create({ city, type, pricePerMin, providerId, description });
}

async function updateVehicle(vehicleId, providerId, fields) {
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    throw ApiError.notFound(`Vehicle ${vehicleId} not found`);
  }
  if (vehicle.providerId !== providerId) {
    throw ApiError.forbidden('You do not own this vehicle');
  }
  return Vehicle.update(vehicleId, fields);
}

async function deactivateVehicle(vehicleId, providerId) {
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    throw ApiError.notFound(`Vehicle ${vehicleId} not found`);
  }
  if (vehicle.providerId !== providerId) {
    throw ApiError.forbidden('You do not own this vehicle');
  }
  if (vehicle.status === VehicleStatus.OUT_OF_SERVICE) {
    return vehicle;
  }
  return Vehicle.deactivate(vehicleId);
}

async function getProviderVehicles(providerId) {
  const all = await Vehicle.findAll();
  return all.filter((v) => v.providerId === providerId);
}

module.exports = { addVehicle, updateVehicle, deactivateVehicle, getProviderVehicles };
