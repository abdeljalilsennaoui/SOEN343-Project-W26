const Reservation = require('../models/Reservation');
const Analytics = require('../models/AnalyticsReport');
const Vehicle = require('../models/Vehicle');

class ReservationController {
  createReservation(req, res, next) {
    try {
      const { userId, vehicleId } = req.body;
      const reservation = Reservation.createReservation(userId, vehicleId);

      const vehicle = Vehicle.findById(vehicleId);

      Analytics.trackEvent('RESERVATION_CREATED', vehicle.city, {
        reservationId: reservation.id,
        vehicleType: vehicle.type
      });

      res.status(201).json({ data: reservation });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ReservationController;
