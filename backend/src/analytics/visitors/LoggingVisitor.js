/**
 * LoggingVisitor — Visitor Pattern (concrete visitor)
 *
 * Logs a one-line summary of every analytics event to stdout.
 * Demonstrates that a new operation over the entire event hierarchy
 * is added by creating a new visitor class — zero changes to any event class.
 * Uses the common AnalyticsEvent interface (type, city, metadata) — no instanceof needed.
 */
const IAnalyticsVisitor = require('./IAnalyticsVisitor');

class LoggingVisitor extends IAnalyticsVisitor {
  visit(event) {
    const meta = Object.entries(event.metadata)
      .map(([k, v]) => `${k}=${v}`)
      .join(' ');
    console.log(`[analytics] ${event.type} city=${event.city ?? 'n/a'} ${meta}`);
  }
}

module.exports = new LoggingVisitor();
