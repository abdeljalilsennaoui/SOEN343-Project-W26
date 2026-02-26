const MobilitySearchService = require('../services/MobilitySearchService');

class MobilitySearchController {
  /**
   * GET /api/mobility/options/search
   * Query params validated by mobilitySearchSchema (validateQuery middleware)
   *
   * Response 200: { data: MobilityOptionViewModel[], count: number }
   */
  async searchOptions(req, res, next) {
    try {
      const { city, type, maxPrice, startTime, endTime } = req.query;
      const options = await MobilitySearchService.search({ city, type, maxPrice, startTime, endTime });
      res.json({ data: options, count: options.length });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MobilitySearchController();
