const { v4: uuidv4 } = require('uuid');
const { PaymentStatus } = require('./enums');
const { createPaymentGateway } = require('../gateways');

/**
 * Payment Model — data, storage, and business logic (MVC pattern)
 *
 * @typedef {Object} Payment
 * @property {string} id
 * @property {string} reservationId
 * @property {number} amount
 * @property {string} status - PaymentStatus enum value
 * @property {string} [paidAt] - ISO date string
 */

// In-memory storage
const payments = new Map();
const paymentGateway = createPaymentGateway();

// Data access methods
function create({ reservationId, amount, status, paidAt = null }) {
  const id = uuidv4();
  const payment = { id, reservationId, amount, status, paidAt };
  payments.set(id, payment);
  return payment;
}

function findById(id) {
  return payments.get(id) || null;
}

function findByReservationId(reservationId) {
  return Array.from(payments.values()).filter((p) => p.reservationId === reservationId);
}

// Business logic
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
