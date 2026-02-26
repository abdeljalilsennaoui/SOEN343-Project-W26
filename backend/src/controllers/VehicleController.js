const Vehicle = require('../models/Vehicle');

class VehicleController {
  async getVehicles(req, res, next) {
    try {
      const { city, type } = req.query;
      const vehicles = await Vehicle.getAvailableVehicles(city, type);
      res.json({ data: vehicles });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = VehicleController;
