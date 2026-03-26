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

module.exports = {
  findById,
  findAll,
};
