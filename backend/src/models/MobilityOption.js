const { v4: uuidv4 } = require('uuid');
const db = require('../lib/firestore');

const col = db.collection('mobilityOptions');

async function findById(id) {
  const snap = await col.doc(id).get();
  return snap.exists ? snap.data() : null;
}

async function findAll({ city, type } = {}) {
  let query = col;
  if (city) query = query.where('city', '==', city);
  if (type) query = query.where('type', '==', type);
  const snap = await query.get();
  return snap.docs.map((d) => d.data());
}

async function create(data) {
  const id = data.id || uuidv4();
  const doc = { id, blockedPeriods: [], ...data };
  await col.doc(id).set(doc);
  return doc;
}

async function remove(id) {
  await col.doc(id).delete();
}

module.exports = {
  findById,
  findAll,
  create,
  remove,
};
