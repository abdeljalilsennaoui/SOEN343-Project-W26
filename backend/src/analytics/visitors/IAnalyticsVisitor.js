/**
 * IAnalyticsVisitor — Visitor Pattern (visitor interface)
 *
 * Declares a single visit(event) method that all concrete visitors must
 * implement. Each element (AnalyticsEvent subclass) calls visitor.visit(this)
 * inside its accept() method, enabling double dispatch:
 *   1st dispatch: event.accept(visitor)  → selects the concrete event class
 *   2nd dispatch: visitor.visit(this)    → selects the concrete visitor
 *
 * New operations over the event hierarchy are added by creating new
 * visitor classes — no event class is ever modified.
 */
class IAnalyticsVisitor {
  /**
   * @param {import('../events/AnalyticsEvent')} event
   */
  visit(_event) {
    throw new Error('IAnalyticsVisitor.visit() must be implemented');
  }
}

module.exports = IAnalyticsVisitor;
