const { v4: uuidv4 } = require('uuid');
const db = require('../lib/firestore');

const col = db.collection('paymentReceipts');

async function create({ bookingId, amount, providerRef, status }) {
  const id = uuidv4();
  const receipt = {
    id,
    bookingId,
    amount,
    providerRef,
    status,
    timestamp: new Date().toISOString(),
  };
  await col.doc(id).set(receipt);
  return receipt;
}

async function findByBookingId(bookingId) {
  const snap = await col.where('bookingId', '==', bookingId).get();
  if (snap.empty) return null;
  return snap.docs[0].data();
}

module.exports = {
  create,
  findByBookingId,
};
