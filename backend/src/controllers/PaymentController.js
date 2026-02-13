const Payment = require('../models/Payment');
const Analytics = require('../models/AnalyticsReport');

class PaymentController {
  async chargePayment(req, res, next) {
    try {
      const { reservationId, amount, simulateFailure } = req.body;
      const payment = await Payment.processPayment(reservationId, amount, simulateFailure);

      Analytics.trackEvent('PAYMENT_PROCESSED', 'unknown', {
        paymentId: payment.id,
        status: payment.status,
      });

      res.status(201).json({ data: payment });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = PaymentController;
