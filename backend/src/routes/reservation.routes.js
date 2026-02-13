const { Router } = require('express');
const { reservationController } = require('../controllers');
const { validateBody, createReservationSchema } = require('../middleware/validation');

const router = Router();

router.post(
  '/reservations',
  validateBody(createReservationSchema),
  reservationController.createReservation.bind(reservationController),
);

module.exports = router;
