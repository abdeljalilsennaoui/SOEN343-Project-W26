/**
 * PersistenceVisitor — Visitor Pattern (concrete visitor)
 *
 * Persists every analytics event to Firestore.
 * Receives any AnalyticsEvent via visit(event) and uses the common
 * interface (event.type, event.city, event.metadata) — no instanceof needed.
 * Fire-and-forget: errors are swallowed so analytics never block a response.
 */
const IAnalyticsVisitor = require('./IAnalyticsVisitor');
const AnalyticsReport = require('../../models/AnalyticsReport');

class PersistenceVisitor extends IAnalyticsVisitor {
  visit(event) {
    AnalyticsReport.trackEvent(event.type, event.city, event.metadata).catch(() => {});
  }
}

module.exports = new PersistenceVisitor();
