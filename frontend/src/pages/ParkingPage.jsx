import { useState, useEffect } from 'react';
import { getParkingFacilities, getAvailableSpots, reserveParkingSpot, releaseParkingSpot } from '../services/api';

const CITIES = ['Montreal', 'Toronto', 'Vancouver'];

const STATUS_STYLES = {
  AVAILABLE: 'bg-green-100 text-green-700',
  RESERVED: 'bg-yellow-100 text-yellow-700',
  OUT_OF_SERVICE: 'bg-red-100 text-red-600',
};

export default function ParkingPage() {
  const [city, setCity] = useState('Montreal');
  const [facilities, setFacilities] = useState([]);
  const [spots, setSpots] = useState([]);
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [loadingSpots, setLoadingSpots] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadData(selectedCity) {
    setError('');
    setMessage('');
    setLoadingFacilities(true);
    setLoadingSpots(true);
    try {
      const [fRes, sRes] = await Promise.all([
        getParkingFacilities(selectedCity),
        getAvailableSpots(selectedCity),
      ]);
      setFacilities(fRes.data);
      setSpots(sRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load parking data');
    } finally {
      setLoadingFacilities(false);
      setLoadingSpots(false);
    }
  }

  useEffect(() => { loadData(city); }, [city]);

  async function handleReserve(spotId) {
    setActionLoading(spotId);
    setError('');
    setMessage('');
    try {
      await reserveParkingSpot(spotId);
      setMessage(`Spot reserved successfully.`);
      loadData(city);
    } catch (err) {
      setError(err.message || 'Failed to reserve spot');
    } finally {
      setActionLoading('');
    }
  }

  async function handleRelease(spotId) {
    setActionLoading(spotId);
    setError('');
    setMessage('');
    try {
      await releaseParkingSpot(spotId);
      setMessage('Spot released.');
      loadData(city);
    } catch (err) {
      setError(err.message || 'Failed to release spot');
    } finally {
      setActionLoading('');
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Parking</h1>
        <p className="text-gray-500 text-sm">Find and reserve parking spots in your city.</p>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">City:</label>
        <select value={city} onChange={(e) => setCity(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
      {message && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">{message}</div>}

      {/* Facilities */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Facilities in {city}</h2>
        {loadingFacilities ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : facilities.length === 0 ? (
          <p className="text-gray-400 text-sm">No facilities found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {facilities.map((f) => (
              <div key={f.id} className="bg-white border rounded-xl p-4 shadow-sm">
                <p className="font-medium text-gray-800">{f.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">{f.address}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Available Spots */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Available Spots</h2>
        {loadingSpots ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : spots.length === 0 ? (
          <p className="text-gray-400 text-sm">No available spots in {city} right now.</p>
        ) : (
          <div className="space-y-2">
            {spots.map((spot) => (
              <div key={spot.id} className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">Spot {spot.spotNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[spot.status] || 'bg-gray-100 text-gray-500'}`}>
                      {spot.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">${spot.pricePerHour?.toFixed(2)}/hr</p>
                </div>
                <div className="flex gap-2">
                  {spot.status === 'AVAILABLE' && (
                    <button onClick={() => handleReserve(spot.id)}
                      disabled={actionLoading === spot.id}
                      className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-slate-700 disabled:opacity-50 transition-colors">
                      {actionLoading === spot.id ? '…' : 'Reserve'}
                    </button>
                  )}
                  {spot.status === 'RESERVED' && (
                    <button onClick={() => handleRelease(spot.id)}
                      disabled={actionLoading === spot.id}
                      className="border border-gray-300 text-gray-600 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors">
                      {actionLoading === spot.id ? '…' : 'Release'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
