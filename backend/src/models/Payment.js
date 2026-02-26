const { v4: uuidv4 } = require('uuid');
const { PaymentStatus } = require('./enums');
const { createPaymentGateway } = require('../gateways');
const db = require('../lib/firestore');

const col = db.collection('payments');
const paymentGateway = createPaymentGateway();

async function create({ reservationId, amount, status, paidAt = null }) {
  const id = uuidv4();
  const payment = { id, reservationId, amount, status, paidAt };
  await col.doc(id).set(payment);
  return payment;
}

async function findById(id) {
  const snap = await col.doc(id).get();
  return snap.exists ? snap.data() : null;
}

async function findByReservationId(reservationId) {
  const snap = await col.where('reservationId', '==', reservationId).get();
  return snap.docs.map((d) => d.data());
}

async function processPayment(reservationId, amount, simulateFailure = false) {
  const result = await paymentGateway.charge(amount, { simulateFailure });
  const status = result.success ? PaymentStatus.CONFIRMED : PaymentStatus.FAILED;
  const paidAt = result.success ? new Date().toISOString() : null;
  return create({ reservationId, amount, status, paidAt });
}

module.exports = {
  create,
  findById,
  findByReservationId,
  processPayment,
};
