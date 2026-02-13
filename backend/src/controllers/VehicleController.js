const Vehicle = require('../models/Vehicle');

class VehicleController {
  getVehicles(req, res) {
    const { city, type } = req.query;
    const vehicles = Vehicle.getAvailableVehicles(city, type);
    res.json({ data: vehicles });
  }
}

module.exports = VehicleController;
