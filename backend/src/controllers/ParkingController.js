const Parking = require('../models/Parking');
const EventBus = require('../lib/EventBus');

class ParkingController {
  async getFacilities(req, res, next) {
    try {
      const { city } = req.query;
      const facilities = await Parking.findAllFacilities(city);
      res.json({ data: facilities });
    } catch (err) {
      next(err);
    }
  }

  async getFacilitySpots(req, res, next) {
    try {
      const { facilityId } = req.params;
      const facility = await Parking.findFacilityById(facilityId);
      if (!facility) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Facility not found' } });
      }
      const spots = await Parking.findSpotsByFacility(facilityId);
      res.json({ data: { facility, spots } });
    } catch (err) {
      next(err);
    }
  }

  async getAvailableSpots(req, res, next) {
    try {
      const { city } = req.query;
      const spots = await Parking.getAvailableSpots(city);
      res.json({ data: spots });
    } catch (err) {
      next(err);
    }
  }

  async reserveSpot(req, res, next) {
    try {
      const { spotId } = req.body;
      const spot = await Parking.reserveSpot(spotId);
      // Observer pattern: emit event — AnalyticsListener handles persistence
      EventBus.emit('PARKING_RESERVED', { city: spot.facilityId, metadata: { spotId } });
      res.status(201).json({ data: spot });
    } catch (err) {
      next(err);
    }
  }

  async releaseSpot(req, res, next) {
    try {
      const { spotId } = req.body;
      const spot = await Parking.releaseSpot(spotId);
      EventBus.emit('PARKING_RELEASED', { city: spot.facilityId, metadata: { spotId } });
      res.json({ data: spot });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ParkingController;
