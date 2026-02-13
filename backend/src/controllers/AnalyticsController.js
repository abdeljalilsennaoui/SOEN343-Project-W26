const Analytics = require('../models/AnalyticsReport');

class AnalyticsController {
  getEvents(req, res) {
    const { city, type } = req.query;

    let events;
    if (city) {
      events = Analytics.findByCity(city);
    } else if (type) {
      events = Analytics.findByType(type);
    } else {
      events = Analytics.findAll();
    }

    res.json({ data: events, count: events.length });
  }
}

module.exports = AnalyticsController;
