/**
 * EventBus — Observer pattern (singleton)
 *
 * Controllers emit domain events (e.g. 'BOOKING_CONFIRMED').
 * Subscribers (e.g. AnalyticsListener) register handlers without
 * being imported by or coupled to the controllers.
 *
 * Publishers: BookingController, ParkingController, PaymentController, TransitController
 * Subscribers: services/AnalyticsListener.js
 */
const EventEmitter = require('events');

const bus = new EventEmitter();
bus.setMaxListeners(20);

module.exports = bus;
