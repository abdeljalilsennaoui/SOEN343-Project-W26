/**
 * AnalyticsListener — Observer pattern (subscriber) + Visitor Pattern (client)
 *
 * Registers handlers on EventBus for all domain events. When an event fires,
 * it applies both concrete visitors to the typed event object via accept().
 *
 * The Visitor pattern provides double dispatch:
 *   event.accept(visitor) → visitor.visitXxx(event)
 * Each visitor independently handles the event — no instanceof checks,
 * no conditional branching. New visitors (e.g. NotificationVisitor) are
 * added here without touching any event class.
 *
 * Call register() once at application startup (server.js).
 */
const EventBus = require('../lib/EventBus');
const persistenceVisitor = require('../analytics/visitors/PersistenceVisitor');
const loggingVisitor = require('../analytics/visitors/LoggingVisitor');

function register() {
  EventBus.on('RESERVATION_CREATED', (event) => {
    event.accept(persistenceVisitor);
    event.accept(loggingVisitor);
  });

  EventBus.on('BOOKING_CONFIRMED', (event) => {
    event.accept(persistenceVisitor);
    event.accept(loggingVisitor);
  });

  EventBus.on('PAYMENT_PROCESSED', (event) => {
    event.accept(persistenceVisitor);
    event.accept(loggingVisitor);
  });

  EventBus.on('VEHICLE_RETURNED', (event) => {
    event.accept(persistenceVisitor);
    event.accept(loggingVisitor);
  });

  EventBus.on('PARKING_RESERVED', (event) => {
    event.accept(persistenceVisitor);
    event.accept(loggingVisitor);
  });

  EventBus.on('PARKING_RELEASED', (event) => {
    event.accept(persistenceVisitor);
    event.accept(loggingVisitor);
  });

  EventBus.on('TRANSIT_QUERY', (event) => {
    event.accept(persistenceVisitor);
    event.accept(loggingVisitor);
  });

  EventBus.on('GATEWAY_CALL', (event) => {
    event.accept(persistenceVisitor);
    event.accept(loggingVisitor);
  });
}

module.exports = { register };
