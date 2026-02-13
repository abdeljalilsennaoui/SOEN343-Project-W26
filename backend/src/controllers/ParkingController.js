const Parking = require('../models/Parking');
const Analytics = require('../models/AnalyticsReport');

class ParkingController {
  getFacilities(req, res) {
    const { city } = req.query;
    const facilities = Parking.findAllFacilities(city);
    res.json({ data: facilities });
  }

  getFacilitySpots(req, res) {
    const { facilityId } = req.params;
    const facility = Parking.findFacilityById(facilityId);
    if (!facility) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Facility not found' } });
    }
    const spots = Parking.findSpotsByFacility(facilityId);
    res.json({ data: { facility, spots } });
  }

  getAvailableSpots(req, res) {
    const { city } = req.query;
    const spots = Parking.getAvailableSpots(city);
    res.json({ data: spots });
  }

  reserveSpot(req, res, next) {
    try {
      const { spotId } = req.body;
      const spot = Parking.reserveSpot(spotId);
      Analytics.trackEvent('PARKING_RESERVED', spot.facilityId, { spotId });
      res.status(201).json({ data: spot });
    } catch (err) {
      next(err);
    }
  }

  releaseSpot(req, res, next) {
    try {
      const { spotId } = req.body;
      const spot = Parking.releaseSpot(spotId);
      Analytics.trackEvent('PARKING_RELEASED', spot.facilityId, { spotId });
      res.json({ data: spot });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ParkingController;
