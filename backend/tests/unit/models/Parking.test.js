const Parking = require('../../../src/models/Parking');

describe('Parking Model', () => {
  describe('findAllFacilities', () => {
    it('should return all facilities', () => {
      const facilities = Parking.findAllFacilities();
      expect(facilities.length).toBe(6);
    });

    it('should filter facilities by city', () => {
      const facilities = Parking.findAllFacilities('Montreal');
      expect(facilities.length).toBe(2);
      facilities.forEach((f) => {
        expect(f.city).toBe('Montreal');
      });
    });

    it('should return empty array for unknown city', () => {
      const facilities = Parking.findAllFacilities('Ottawa');
      expect(facilities).toEqual([]);
    });
  });

  describe('findFacilityById', () => {
    it('should return a facility by id', () => {
      const facilities = Parking.findAllFacilities();
      const facility = Parking.findFacilityById(facilities[0].id);
      expect(facility).toBeDefined();
      expect(facility.name).toBeDefined();
    });

    it('should return null for unknown id', () => {
      const facility = Parking.findFacilityById('unknown');
      expect(facility).toBeNull();
    });
  });

  describe('findSpotsByFacility', () => {
    it('should return spots for a facility', () => {
      const facilities = Parking.findAllFacilities();
      const spots = Parking.findSpotsByFacility(facilities[0].id);
      expect(spots.length).toBe(5);
      spots.forEach((s) => {
        expect(s.facilityId).toBe(facilities[0].id);
      });
    });
  });

  describe('getAvailableSpots', () => {
    it('should return available spots for a city', () => {
      const spots = Parking.getAvailableSpots('Toronto');
      expect(spots.length).toBeGreaterThan(0);
      spots.forEach((s) => {
        expect(s.status).toBe('AVAILABLE');
      });
    });
  });

  describe('reserveSpot / releaseSpot', () => {
    it('should reserve and release a spot', () => {
      const spots = Parking.getAvailableSpots('Vancouver');
      const spotId = spots[0].id;

      const reserved = Parking.reserveSpot(spotId);
      expect(reserved.status).toBe('RESERVED');

      const released = Parking.releaseSpot(spotId);
      expect(released.status).toBe('AVAILABLE');
    });

    it('should throw when reserving an already reserved spot', () => {
      const spots = Parking.getAvailableSpots('Vancouver');
      const spotId = spots[0].id;

      Parking.reserveSpot(spotId);
      expect(() => Parking.reserveSpot(spotId)).toThrow();

      // Cleanup
      Parking.releaseSpot(spotId);
    });

    it('should throw for unknown spot', () => {
      expect(() => Parking.reserveSpot('unknown')).toThrow();
    });
  });
});
