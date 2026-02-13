const Reservation = require('../models/Reservation');
const Analytics = require('../models/AnalyticsReport');

class ReservationController {
  createReservation(req, res, next) {
    try {
      const { userId, vehicleId } = req.body;
      const reservation = Reservation.createReservation(userId, vehicleId);

      Analytics.trackEvent('RESERVATION_CREATED', 'unknown', {
        reservationId: reservation.id,
      });

      res.status(201).json({ data: reservation });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ReservationController;
