const { VehicleStatus } = require('./enums');
const ApiError = require('./ApiError');
const db = require('../lib/firestore');

const col = db.collection('vehicles');

async function findAll(filters = {}) {
  const snap = await col.get();
  let results = snap.docs.map((d) => d.data());
  if (filters.city) results = results.filter((v) => v.city.toLowerCase() === filters.city.toLowerCase());
  if (filters.type) results = results.filter((v) => v.type === filters.type);
  if (filters.status) results = results.filter((v) => v.status === filters.status);
  return results;
}

async function findById(id) {
  const snap = await col.doc(id).get();
  return snap.exists ? snap.data() : null;
}

async function updateStatus(id, status) {
  const vehicle = await findById(id);
  if (!vehicle) return null;
  await col.doc(id).update({ status });
  return { ...vehicle, status };
}

async function getAvailableVehicles(city, type) {
  const filters = { status: VehicleStatus.AVAILABLE };
  if (city) filters.city = city;
  if (type) filters.type = type;
  return findAll(filters);
}

async function reserveVehicle(id) {
  const vehicle = await findById(id);
  if (!vehicle) throw ApiError.notFound(`Vehicle ${id} not found`);
  if (vehicle.status !== VehicleStatus.AVAILABLE) {
    throw ApiError.conflict(`Vehicle ${id} is not available (status: ${vehicle.status})`);
  }
  return updateStatus(id, VehicleStatus.RESERVED);
}

async function releaseVehicle(id) {
  const vehicle = await findById(id);
  if (!vehicle) throw ApiError.notFound(`Vehicle ${id} not found`);
  return updateStatus(id, VehicleStatus.AVAILABLE);
}

async function create({ city, type, pricePerMin, providerId, lat, lng, description = '' }) {
  const { v4: uuidv4 } = require('uuid');
  const id = uuidv4();
  const vehicle = {
    id,
    city,
    type,
    pricePerMin,
    providerId,
    lat,
    lng,
    description,
    status: VehicleStatus.AVAILABLE,
    createdAt: new Date().toISOString(),
  };
  await col.doc(id).set(vehicle);
  return vehicle;
}

async function update(id, fields) {
  const vehicle = await findById(id);
  if (!vehicle) return null;
  const allowed = ['city', 'type', 'pricePerMin', 'lat', 'lng', 'description', 'status'];
  const patch = {};
  for (const key of allowed) {
    if (fields[key] !== undefined) patch[key] = fields[key];
  }
  await col.doc(id).update(patch);
  return { ...vehicle, ...patch };
}

async function deactivate(id) {
  return updateStatus(id, VehicleStatus.OUT_OF_SERVICE);
}

module.exports = {
  findAll,
  findById,
  updateStatus,
  getAvailableVehicles,
  reserveVehicle,
  releaseVehicle,
  create,
  update,
  deactivate,
};
