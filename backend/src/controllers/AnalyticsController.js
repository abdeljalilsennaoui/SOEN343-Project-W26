const Analytics = require('../models/AnalyticsReport');

class AnalyticsController {
  async getEvents(req, res, next) {
    try {
      const { city, type } = req.query;
      let events;
      if (city) {
        events = await Analytics.findByCity(city);
      } else if (type) {
        events = await Analytics.findByType(type);
      } else {
        events = await Analytics.findAll();
      }
      res.json({ data: events, count: events.length });
    } catch (err) {
      next(err);
    }
  }

  async getRentalAnalytics(_req, res, next) {
    try {
      const analytics = await Analytics.getRentalAnalytics();
      res.json({ data: analytics });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AnalyticsController;
