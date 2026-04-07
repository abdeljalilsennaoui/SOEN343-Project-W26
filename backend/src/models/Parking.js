const { ParkingStatus } = require('./enums');
const ApiError = require('./ApiError');
const db = require('../lib/firestore');

const facilitiesCol = db.collection('parkingFacilities');
const spotsCol = db.collection('parkingSpots');

async function findAllFacilities(city) {
  let query = facilitiesCol;
  if (city) query = query.where('city', '==', city);
  const snap = await query.get();
  return snap.docs.map((d) => d.data());
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
  if (facilities.length === 0) return [];
  const facilityIds = facilities.map((f) => f.id);
  // 'in' query limits to only spots belonging to this city's facilities
  // instead of reading every spot across all cities.
  const snap = await spotsCol
    .where('facilityId', 'in', facilityIds)
    .where('status', '==', ParkingStatus.AVAILABLE)
    .get();
  return snap.docs.map((d) => d.data());
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
