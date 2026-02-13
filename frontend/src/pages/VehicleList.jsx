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
    <div className="vehicle-list-page">
      <h2>Available Vehicles</h2>
      <div className="filters">
        <select value={city} onChange={(e) => setCity(e.target.value)}>
          {CITIES.map((c) => (
            <option key={c} value={c}>{c || 'All Cities'}</option>
          ))}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {TYPES.map((t) => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>
      </div>
      <ErrorMessage error={error} />
      {loading ? (
        <p className="loading">Loading vehicles...</p>
      ) : vehicles.length === 0 ? (
        <p className="empty">No vehicles found matching your filters.</p>
      ) : (
        <div className="vehicle-grid">
          {vehicles.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      )}
    </div>
  );
}

export default VehicleList;
