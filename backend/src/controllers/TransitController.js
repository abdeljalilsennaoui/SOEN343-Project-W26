const TransitAdapter = require('../services/TransitAdapter');
const ApiError = require('../models/ApiError');

class TransitController {
  /**
   * GET /api/transit/schedule?city=Montreal&line=24
   */
  async getSchedule(req, res, next) {
    try {
      const { city, line } = req.query;
      if (!city) {
        return next(ApiError.badRequest('city query parameter is required'));
      }
      const schedule = await TransitAdapter.getSchedule(city, line || null);
      res.json({ data: schedule, count: schedule.length });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/transit/stops/nearby?lat=45.5&lng=-73.6
   */
  async getNearbyStops(req, res, next) {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) {
        return next(ApiError.badRequest('lat and lng query parameters are required'));
      }
      const stops = await TransitAdapter.getNearbyStops(parseFloat(lat), parseFloat(lng));
      res.json({ data: stops, count: stops.length });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TransitController();
