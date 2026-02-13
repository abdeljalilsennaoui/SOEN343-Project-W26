const Reservation = require('../models/Reservation');
const Analytics = require('../models/AnalyticsReport');

class ReturnController {
  returnVehicle(req, res, next) {
    try {
      const { reservationId } = req.body;
      const reservation = Reservation.completeReservation(reservationId);

      Analytics.trackEvent('VEHICLE_RETURNED', 'unknown', {
        reservationId: reservation.id,
        vehicleId: reservation.vehicleId,
      });

      res.json({ data: reservation });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ReturnController;
