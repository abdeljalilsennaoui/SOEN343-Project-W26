/**
 * AnalyticsEvent — Visitor Pattern (abstract element base)
 *
 * All concrete analytics event classes extend this base.
 * Each subclass must implement accept(visitor), which calls the
 * matching visitor method — enabling double dispatch:
 *   1st dispatch: event.accept(visitor)  → selects the concrete event class
 *   2nd dispatch: visitor.visitXxx(this) → selects the matching visitor method
 */
class AnalyticsEvent {
  /** @returns {string} event type identifier */
  get type() {
    throw new Error('AnalyticsEvent.type must be overridden');
  }

  /** @returns {string|null} city associated with the event, or null */
  get city() {
    return null;
  }

  /** @returns {object} event-specific metadata for persistence */
  get metadata() {
    return {};
  }

  /**
   * Accept a visitor — subclasses call the specific visitor method for
   * their type (double dispatch).
   *
   * @param {import('../visitors/IAnalyticsVisitor')} _visitor
   */
  accept(_visitor) {
    throw new Error('AnalyticsEvent.accept() must be implemented');
  }
}

module.exports = AnalyticsEvent;
