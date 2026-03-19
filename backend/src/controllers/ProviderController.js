const ProviderService = require('../services/ProviderService');

class ProviderController {
  async getVehicles(req, res, next) {
    try {
      const vehicles = await ProviderService.getProviderVehicles(req.uid);
      res.json({ data: vehicles, count: vehicles.length });
    } catch (err) {
      next(err);
    }
  }

  async addVehicle(req, res, next) {
    try {
      const vehicle = await ProviderService.addVehicle(req.uid, req.body);
      res.status(201).json({ data: vehicle });
    } catch (err) {
      next(err);
    }
  }

  async updateVehicle(req, res, next) {
    try {
      const { vehicleId } = req.params;
      const vehicle = await ProviderService.updateVehicle(vehicleId, req.uid, req.body);
      res.json({ data: vehicle });
    } catch (err) {
      next(err);
    }
  }

  async deactivateVehicle(req, res, next) {
    try {
      const { vehicleId } = req.params;
      const vehicle = await ProviderService.deactivateVehicle(vehicleId, req.uid);
      res.json({ data: vehicle });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProviderController();
