jest.mock('../../../src/lib/firestore');

const db = require('../../../src/lib/firestore');
const Parking = require('../../../src/models/Parking');

function seed() {
  const cities = ['Montreal', 'Toronto', 'Vancouver'];
  const facilities = cities.flatMap((city, ci) => [
    { id: `fac-${city.toLowerCase()}-1`, city, name: `${city} Facility 1` },
    { id: `fac-${city.toLowerCase()}-2`, city, name: `${city} Facility 2` },
  ]);

  const spots = facilities.flatMap((fac) =>
    Array.from({ length: 5 }, (_, i) => ({
      id: `spot-${fac.id}-${i + 1}`,
      facilityId: fac.id,
      status: 'AVAILABLE',
      city: fac.city,
    })),
  );

  db._seed('parkingFacilities', facilities);
  db._seed('parkingSpots', spots);
}

beforeEach(() => { db._reset(); seed(); });

describe('Parking.findAllFacilities()', () => {
  it('returns all facilities', async () => {
    const facilities = await Parking.findAllFacilities();
    expect(facilities.length).toBe(6);
  });

  it('filters facilities by city', async () => {
    const facilities = await Parking.findAllFacilities('Montreal');
    expect(facilities.length).toBe(2);
    facilities.forEach((f) => expect(f.city).toBe('Montreal'));
  });

  it('returns empty array for unknown city', async () => {
    const facilities = await Parking.findAllFacilities('Ottawa');
    expect(facilities).toEqual([]);
  });
});

describe('Parking.findFacilityById()', () => {
  it('returns a facility by id', async () => {
    const facility = await Parking.findFacilityById('fac-montreal-1');
    expect(facility).not.toBeNull();
    expect(facility.name).toBeDefined();
  });

  it('returns null for unknown id', async () => {
    const facility = await Parking.findFacilityById('unknown');
    expect(facility).toBeNull();
  });
});

describe('Parking.findSpotsByFacility()', () => {
  it('returns 5 spots for a facility', async () => {
    const spots = await Parking.findSpotsByFacility('fac-montreal-1');
    expect(spots.length).toBe(5);
    spots.forEach((s) => expect(s.facilityId).toBe('fac-montreal-1'));
  });
});

describe('Parking.getAvailableSpots()', () => {
  it('returns available spots for a city', async () => {
    const spots = await Parking.getAvailableSpots('Toronto');
    expect(spots.length).toBeGreaterThan(0);
    spots.forEach((s) => expect(s.status).toBe('AVAILABLE'));
  });

  it('returns empty array for unknown city', async () => {
    const spots = await Parking.getAvailableSpots('Ottawa');
    expect(spots).toEqual([]);
  });
});

describe('Parking.reserveSpot() / releaseSpot()', () => {
  it('reserves and releases a spot', async () => {
    const spotId = 'spot-fac-vancouver-1-1';

    const reserved = await Parking.reserveSpot(spotId);
    expect(reserved.status).toBe('RESERVED');

    const released = await Parking.releaseSpot(spotId);
    expect(released.status).toBe('AVAILABLE');
  });

  it('throws CONFLICT when reserving an already reserved spot', async () => {
    const spotId = 'spot-fac-vancouver-1-2';

    await Parking.reserveSpot(spotId);
    await expect(Parking.reserveSpot(spotId)).rejects.toThrow();
  });

  it('throws NOT_FOUND for unknown spot', async () => {
    await expect(Parking.reserveSpot('unknown')).rejects.toThrow();
  });
});
