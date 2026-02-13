const { Router } = require('express');
const { paymentController } = require('../controllers');
const { validateBody, chargePaymentSchema } = require('../middleware/validation');

const router = Router();

router.post(
  '/payments/charge',
  validateBody(chargePaymentSchema),
  paymentController.chargePayment.bind(paymentController),
);

module.exports = router;
