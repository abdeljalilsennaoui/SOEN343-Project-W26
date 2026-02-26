const db = require('../lib/firestore');

const col = db.collection('mobilityOptions');

async function findById(id) {
  const snap = await col.doc(id).get();
  return snap.exists ? snap.data() : null;
}

async function findAll({ city, type } = {}) {
  const snap = await col.get();
  let results = snap.docs.map((d) => d.data());
  if (city) results = results.filter((o) => o.city.toLowerCase() === city.toLowerCase());
  if (type) results = results.filter((o) => o.type === type);
  return results;
}

module.exports = {
  findById,
  findAll,
};
