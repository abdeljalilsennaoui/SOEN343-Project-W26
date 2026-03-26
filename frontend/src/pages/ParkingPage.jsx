import { useState, useEffect } from 'react';
import { getParkingFacilities, getAvailableSpots, reserveParkingSpot, releaseParkingSpot } from '../services/api';

const CITIES = ['Montreal', 'Toronto', 'Vancouver'];

const STATUS_STYLES = {
  AVAILABLE: 'bg-green-500/15 text-green-400',
  RESERVED: 'bg-yellow-500/15 text-yellow-400',
  OUT_OF_SERVICE: 'bg-red-500/15 text-red-400',
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
        <h1 className="text-2xl font-bold text-[#e8eaf0]">Parking</h1>
        <p className="text-gray-400 text-sm">Find and reserve parking spots in your city.</p>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-400">City:</label>
        <select value={city} onChange={(e) => setCity(e.target.value)}
          className="border border-gray-600 bg-[#13161d] text-[#e8eaf0] rounded-md px-3 py-2 text-sm transition-colors focus:border-gray-300 focus:outline-none">
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {error && <div className="bg-red-500/15 border border-red-500/30 text-red-400 rounded-md px-4 py-3 text-sm">{error}</div>}
      {message && <div className="bg-green-500/15 border border-green-500/30 text-green-400 rounded-md px-4 py-3 text-sm">{message}</div>}

      {/* Facilities */}
      <section>
        <h2 className="text-lg font-semibold text-gray-300 mb-3">Facilities in {city}</h2>
        {loadingFacilities ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : facilities.length === 0 ? (
          <p className="text-gray-500 text-sm">No facilities found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {facilities.map((f) => (
              <div key={f.id} className="bg-[#13161d] border border-[#1e2330] rounded-lg p-4">
                <p className="font-medium text-[#e8eaf0]">{f.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">{f.address}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Available Spots */}
      <section>
        <h2 className="text-lg font-semibold text-gray-300 mb-3">Available Spots</h2>
        {loadingSpots ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : spots.length === 0 ? (
          <p className="text-gray-500 text-sm">No available spots in {city} right now.</p>
        ) : (
          <div className="space-y-2">
            {spots.map((spot) => (
              <div key={spot.id} className="bg-[#13161d] border border-[#1e2330] rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#e8eaf0]">Spot {spot.spotNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[spot.status] || 'bg-gray-500/15 text-gray-400'}`}>
                      {spot.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">${spot.pricePerHour?.toFixed(2)}/hr</p>
                </div>
                <div className="flex gap-2">
                  {spot.status === 'AVAILABLE' && (
                    <button onClick={() => handleReserve(spot.id)}
                      disabled={actionLoading === spot.id}
                      className="bg-gray-100 text-black px-4 py-1.5 rounded-md text-sm font-medium transition-colors hover:bg-white active:bg-gray-300 disabled:opacity-50">
                      {actionLoading === spot.id ? '…' : 'Reserve'}
                    </button>
                  )}
                  {spot.status === 'RESERVED' && (
                    <button onClick={() => handleRelease(spot.id)}
                      disabled={actionLoading === spot.id}
                      className="border border-gray-500 text-gray-300 px-4 py-1.5 rounded-md text-sm transition-colors hover:border-gray-400 hover:text-white disabled:opacity-50">
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
