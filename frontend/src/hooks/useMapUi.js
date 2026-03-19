import { useMemo } from 'react';
import { PARKING, RENTALS } from '../data/mockLocations';
import { TYPE_META } from '../components/map/mapConfig';

export function useMapUi(dataset, backendAvailable) {
  const datasetSummary = useMemo(() => {
    if (dataset === 'RENTALS') {
      return [
        { label: 'Live options', value: RENTALS.length.toString() },
        {
          label: 'Starting at',
          value: `$${Math.min(...RENTALS.map((location) => location.pricePerMinute)).toFixed(2)}/min`,
        },
        { label: 'Booking', value: backendAvailable ? 'Connected' : 'Demo' },
      ];
    }

    const indoorCount = PARKING.filter((location) => location.notes.toLowerCase().includes('indoor')).length;
    return [
      { label: 'Parking lots', value: PARKING.length.toString() },
      { label: 'Indoor spots', value: indoorCount.toString() },
      { label: 'Coverage', value: 'Island-wide' },
    ];
  }, [backendAvailable, dataset]);

  const rentalLegend = useMemo(
    () => ['BIKE_SHARING', 'SCOOTER_SHARING', 'CAR_SHARING'].map((key) => TYPE_META[key]),
    [],
  );

  return {
    datasetSummary,
    rentalLegend,
  };
}
