import { useState, useEffect } from 'react';
import { getVehicles } from '../services/api';
import VehicleCard from '../components/VehicleCard';
import ErrorMessage from '../components/ErrorMessage';

const CITIES = ['', 'Montreal', 'Toronto', 'Vancouver'];
const TYPES = ['', 'CAR_SHARING', 'BIKE_SHARING', 'SCOOTER_SHARING'];

const TYPE_LABELS = {
  '': 'All Types',
  CAR_SHARING: 'Car',
  BIKE_SHARING: 'Bike',
  SCOOTER_SHARING: 'Scooter',
};

function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [city, setCity] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchVehicles() {
      setLoading(true);
      setError(null);
      try {
        const params = {};
        if (city) params.city = city;
        if (type) params.type = type;
        const data = await getVehicles(params);
        setVehicles(data.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    fetchVehicles();
  }, [city, type]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Available Vehicles</h2>
      <div className="flex gap-4 mb-6">
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm"
        >
          {CITIES.map((c) => (
            <option key={c} value={c}>{c || 'All Cities'}</option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>
      </div>
      <ErrorMessage error={error} />
      {loading ? (
        <p className="text-gray-400 text-center py-8">Loading vehicles...</p>
      ) : vehicles.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No vehicles found matching your filters.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {vehicles.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      )}
    </div>
  );
}

export default VehicleList;
