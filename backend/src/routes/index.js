const { Router } = require('express');
const healthRoutes = require('./health.routes');
const vehicleRoutes = require('./vehicle.routes');
const reservationRoutes = require('./reservation.routes');
const paymentRoutes = require('./payment.routes');
const returnRoutes = require('./return.routes');
const parkingRoutes = require('./parking.routes');
const analyticsRoutes = require('./analytics.routes');

const router = Router();

router.use(healthRoutes);
router.use(vehicleRoutes);
router.use(reservationRoutes);
router.use(paymentRoutes);
router.use(returnRoutes);
router.use(parkingRoutes);
router.use(analyticsRoutes);

module.exports = router;
