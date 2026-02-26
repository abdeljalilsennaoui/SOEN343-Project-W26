const Reservation = require('../models/Reservation');
const Analytics = require('../models/AnalyticsReport');
const Payment = require('../models/Payment');
const Vehicle = require('../models/Vehicle');

class ReturnController {
  async returnVehicle(req, res, next) {
    try {
      const { reservationId } = req.body;
      const reservation = await Reservation.completeReservation(reservationId);
      const vehicle = await Vehicle.findById(reservation.vehicleId);

      const startTime = new Date(reservation.startTime);
      const endTime = new Date(reservation.endTime);
      let durationMin = Math.ceil((endTime - startTime) / (1000 * 60));
      if (durationMin < 1) durationMin = 1;

      const amount = durationMin * vehicle.pricePerMin;
      const payment = await Payment.processPayment(reservationId, amount);

      Analytics.trackEvent('VEHICLE_RETURNED', vehicle.city, {
        reservationId: reservation.id,
        vehicleId: reservation.vehicleId,
        vehicleType: vehicle.type,
        durationMin,
        amount,
      }).catch(() => {});

      res.json({ data: { ...reservation, payment } });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ReturnController;
