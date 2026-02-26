const HealthController = require('./HealthController');
const VehicleController = require('./VehicleController');
const ReservationController = require('./ReservationController');
const PaymentController = require('./PaymentController');
const ReturnController = require('./ReturnController');
const ParkingController = require('./ParkingController');
const AnalyticsController = require('./AnalyticsController');
const mobilitySearchController = require('./MobilitySearchController');
const bookingController = require('./BookingController');

const healthController = new HealthController();
const vehicleController = new VehicleController();
const reservationController = new ReservationController();
const paymentController = new PaymentController();
const returnController = new ReturnController();
const parkingController = new ParkingController();
const analyticsController = new AnalyticsController();

module.exports = {
  healthController,
  vehicleController,
  reservationController,
  paymentController,
  returnController,
  parkingController,
  analyticsController,
  mobilitySearchController,
  bookingController,
};
