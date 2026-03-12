/**
 * AnalyticsListener — Observer pattern (subscriber)
 *
 * Registers handlers on EventBus for all domain events that require
 * analytics tracking. Controllers emit events; this module persists them.
 * Neither side imports the other — they are decoupled through EventBus.
 *
 * Call register() once at application startup (app.js).
 */
const EventBus = require('../lib/EventBus');
const AnalyticsReport = require('../models/AnalyticsReport');

function register() {
  EventBus.on('RESERVATION_CREATED', ({ city, metadata }) => {
    AnalyticsReport.trackEvent('RESERVATION_CREATED', city, metadata).catch(() => {});
  });

  EventBus.on('BOOKING_CONFIRMED', ({ city, metadata }) => {
    AnalyticsReport.trackEvent('BOOKING_CONFIRMED', city, metadata).catch(() => {});
  });

  EventBus.on('VEHICLE_RETURNED', ({ city, metadata }) => {
    AnalyticsReport.trackEvent('VEHICLE_RETURNED', city, metadata).catch(() => {});
  });

  EventBus.on('PAYMENT_PROCESSED', ({ city, metadata }) => {
    AnalyticsReport.trackEvent('PAYMENT_PROCESSED', city, metadata).catch(() => {});
  });

  EventBus.on('PARKING_RESERVED', ({ city, metadata }) => {
    AnalyticsReport.trackEvent('PARKING_RESERVED', city, metadata).catch(() => {});
  });

  EventBus.on('PARKING_RELEASED', ({ city, metadata }) => {
    AnalyticsReport.trackEvent('PARKING_RELEASED', city, metadata).catch(() => {});
  });

  EventBus.on('TRANSIT_QUERY', ({ city, metadata }) => {
    AnalyticsReport.trackEvent('TRANSIT_QUERY', city, metadata).catch(() => {});
  });

  EventBus.on('GATEWAY_CALL', ({ metadata }) => {
    AnalyticsReport.trackEvent('GATEWAY_CALL', null, metadata).catch(() => {});
  });
}

module.exports = { register };
