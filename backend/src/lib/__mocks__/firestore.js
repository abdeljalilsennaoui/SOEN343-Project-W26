/**
 * Stateful in-memory Firestore mock.
 * Placed adjacent to lib/firestore.js so tests can call
 * jest.mock('../../../src/lib/firestore') (or relative equivalent)
 * to get a working fake database instead of hitting Firebase.
 *
 * Supports: doc get/set/update, collection where/get/add.
 * Resets between test files automatically (module registry is per-file).
 * Reset within a file: db._reset() / db._seed(collectionName, arrayOfDocs).
 */

const store = {}; // { [collectionName]: { [docId]: docData } }

function matchesFilter({ field, op, val }, doc) {
  const docVal = doc[field];
  if (op === '==') return docVal === val;
  if (op === '!=') return docVal !== val;
  if (op === 'in') return Array.isArray(val) && val.includes(docVal);
  if (op === 'not-in') return Array.isArray(val) && !val.includes(docVal);
  return true;
}

function makeQuery(collectionName, filters) {
  return {
    where: (field, op, val) => makeQuery(collectionName, [...filters, { field, op, val }]),
    orderBy: () => makeQuery(collectionName, filters),
    limit: () => makeQuery(collectionName, filters),
    get: async () => {
      const all = Object.values(store[collectionName] || {});
      const matched = all.filter(doc => filters.every(f => matchesFilter(f, doc)));
      return {
        docs: matched.map(data => ({ data: () => ({ ...data }), exists: true, id: data.id })),
        size: matched.length,
        forEach: (fn) => matched.forEach(data => fn({ data: () => ({ ...data }) })),
      };
    },
  };
}

function makeDocRef(collectionName, docId) {
  return {
    id: docId,
    get: async () => {
      const data = (store[collectionName] || {})[docId];
      return { exists: !!data, data: () => (data ? { ...data } : null), id: docId };
    },
    set: async (data) => {
      if (!store[collectionName]) store[collectionName] = {};
      store[collectionName][docId] = { ...data };
    },
    update: async (updates) => {
      if (store[collectionName] && store[collectionName][docId]) {
        store[collectionName][docId] = { ...store[collectionName][docId], ...updates };
      }
    },
    delete: async () => {
      if (store[collectionName]) delete store[collectionName][docId];
    },
  };
}

function collection(name) {
  if (!store[name]) store[name] = {};
  return {
    doc: (id) => makeDocRef(name, id),
    add: async (data) => {
      const id = `auto-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      if (!store[name]) store[name] = {};
      store[name][id] = { id, ...data };
      return { id };
    },
    get: async () => makeQuery(name, []).get(),
    where: (field, op, val) => makeQuery(name, [{ field, op, val }]),
    limit: () => makeQuery(name, []),
    orderBy: () => makeQuery(name, []),
  };
}

const db = {
  collection,
  FieldValue: {
    serverTimestamp: () => new Date().toISOString(),
    arrayUnion: (...args) => args.flat(),
    arrayRemove: (...items) => items,
  },
  // Test helpers
  _reset: () => { Object.keys(store).forEach(k => delete store[k]); },
  _seed: (collectionName, docs) => {
    store[collectionName] = {};
    docs.forEach(doc => { store[collectionName][doc.id] = { ...doc }; });
  },
  _store: store,
};

module.exports = db;
