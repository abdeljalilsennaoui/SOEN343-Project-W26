const { v4: uuidv4 } = require('uuid');
const { ParkingStatus } = require('./enums');
const ApiError = require('./ApiError');
const db = require('../lib/firestore');

const facilitiesCol = db.collection('parkingFacilities');
const spotsCol = db.collection('parkingSpots');

async function findAllFacilities(city) {
  const snap = await facilitiesCol.get();
  let results = snap.docs.map((d) => d.data());
  if (city) results = results.filter((f) => f.city.toLowerCase() === city.toLowerCase());
  return results;
}

async function findFacilityById(id) {
  const snap = await facilitiesCol.doc(id).get();
  return snap.exists ? snap.data() : null;
}

async function findSpotsByFacility(facilityId) {
  const snap = await spotsCol.where('facilityId', '==', facilityId).get();
  return snap.docs.map((d) => d.data());
}

async function findSpotById(id) {
  const snap = await spotsCol.doc(id).get();
  return snap.exists ? snap.data() : null;
}

async function getAvailableSpots(city) {
  const facilities = await findAllFacilities(city);
  const facilityIds = new Set(facilities.map((f) => f.id));
  const snap = await spotsCol.where('status', '==', ParkingStatus.AVAILABLE).get();
  return snap.docs.map((d) => d.data()).filter((s) => facilityIds.has(s.facilityId));
}

async function reserveSpot(spotId) {
  const spot = await findSpotById(spotId);
  if (!spot) throw ApiError.notFound(`Parking spot ${spotId} not found`);
  if (spot.status !== ParkingStatus.AVAILABLE) {
    throw ApiError.conflict(`Parking spot ${spotId} is not available (status: ${spot.status})`);
  }
  await spotsCol.doc(spotId).update({ status: ParkingStatus.RESERVED });
  return { ...spot, status: ParkingStatus.RESERVED };
}

async function releaseSpot(spotId) {
  const spot = await findSpotById(spotId);
  if (!spot) throw ApiError.notFound(`Parking spot ${spotId} not found`);
  await spotsCol.doc(spotId).update({ status: ParkingStatus.AVAILABLE });
  return { ...spot, status: ParkingStatus.AVAILABLE };
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
