/**
 * Automatic Jest mock for 'firebase-admin'.
 *
 * Placed adjacent to node_modules so Jest uses it automatically for all tests
 * without requiring jest.mock('firebase-admin') in each file.
 *
 * Key design: admin.apps = [{}] (non-empty) so firebaseAdmin.js skips initializeApp.
 */

function makeQuery() {
  const query = {};
  query.get = jest.fn().mockResolvedValue({ docs: [], forEach: jest.fn() });
  query.where = jest.fn().mockReturnValue(query);
  query.orderBy = jest.fn().mockReturnValue(query);
  query.limit = jest.fn().mockReturnValue(query);
  return query;
}

function makeCollection() {
  const query = makeQuery();
  return {
    doc: jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({ exists: false, data: () => null, id: 'mock-doc-id' }),
      set: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
    }),
    add: jest.fn().mockResolvedValue({ id: 'mock-id' }),
    get: jest.fn().mockResolvedValue({ docs: [] }),
    where: jest.fn().mockReturnValue(query),
  };
}

const FieldValue = {
  serverTimestamp: jest.fn().mockReturnValue(new Date('2024-01-01')),
  arrayUnion: jest.fn((...args) => args.flat()),
  arrayRemove: jest.fn((...args) => args.flat()),
};

const mockDb = {
  collection: jest.fn().mockImplementation(() => makeCollection()),
  FieldValue,
};

function firestoreFn() {
  return mockDb;
}
firestoreFn.FieldValue = FieldValue;

const admin = {
  // Non-empty → firebaseAdmin.js skips the initializeApp block
  apps: [{}],
  initializeApp: jest.fn(),
  credential: { cert: jest.fn().mockReturnValue({}) },
  auth: jest.fn().mockReturnValue({
    verifyIdToken: jest.fn().mockResolvedValue({ uid: 'test-uid', email: 'test@test.com', name: 'Test User' }),
  }),
  firestore: firestoreFn,
};

module.exports = admin;
