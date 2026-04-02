import { useState, useEffect } from 'react';
import { searchNearbyParkings, reserveParkingSpot, releaseParkingSpot } from '../services/api';

const CITIES = [
  { name: 'Montreal',  center: { lat: 45.5017, lng: -73.5673 } },
  { name: 'Toronto',   center: { lat: 43.6532, lng: -79.3832 } },
  { name: 'Vancouver', center: { lat: 49.2827, lng: -123.1207 } },
];

const STATUS_STYLES = {
  AVAILABLE:      'bg-green-500/15 text-green-400',
  RESERVED:       'bg-yellow-500/15 text-yellow-400',
  OUT_OF_SERVICE: 'bg-red-500/15 text-red-400',
};

export default function ParkingPage() {
  const [cityName, setCityName]         = useState('Montreal');
  const [spots, setSpots]               = useState([]);
  const [loading, setLoading]           = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError]               = useState('');
  const [message, setMessage]           = useState('');

  async function loadSpots(name) {
    const city = CITIES.find((c) => c.name === name);
    if (!city) return;
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const data = await searchNearbyParkings(city.center, 5000, 120);
      setSpots(data);
    } catch (err) {
      setError(err.message || 'Failed to load parking data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSpots(cityName); }, [cityName]);

  async function handleReserve(spotId) {
    setActionLoading(spotId);
    setError('');
    setMessage('');
    try {
      await reserveParkingSpot(spotId);
      setMessage('Spot reserved successfully.');
      setSpots((prev) => prev.map((s) => s.id === spotId ? { ...s, status: 'RESERVED' } : s));
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
      setSpots((prev) => prev.map((s) => s.id === spotId ? { ...s, status: 'AVAILABLE' } : s));
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
        <select
          value={cityName}
          onChange={(e) => setCityName(e.target.value)}
          className="border border-gray-600 bg-[#13161d] text-[#e8eaf0] rounded-md px-3 py-2 text-sm transition-colors focus:border-gray-300 focus:outline-none"
        >
          {CITIES.map((c) => <option key={c.name}>{c.name}</option>)}
        </select>
      </div>

      {error   && <div className="bg-red-500/15 border border-red-500/30 text-red-400 rounded-md px-4 py-3 text-sm">{error}</div>}
      {message && <div className="bg-green-500/15 border border-green-500/30 text-green-400 rounded-md px-4 py-3 text-sm">{message}</div>}

      <section>
        <h2 className="text-lg font-semibold text-gray-300 mb-3">
          Nearby Spots{!loading && spots.length > 0 && <span className="ml-2 text-sm font-normal text-gray-500">({spots.length})</span>}
        </h2>

        {loading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : spots.length === 0 ? (
          <p className="text-gray-500 text-sm">No parking spots found near {cityName}.</p>
        ) : (
          <div className="space-y-2">
            {spots.map((spot) => (
              <div key={spot.id} className="bg-[#13161d] border border-[#1e2330] rounded-lg p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-[#e8eaf0] truncate">{spot.facilityName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLES[spot.status] ?? 'bg-gray-500/15 text-gray-400'}`}>
                      {spot.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-sm text-gray-500">${spot.pricePerHour?.toFixed(2)}/hr</span>
                    {spot.distanceMeters != null && (
                      <span className="text-xs text-gray-600">
                        {spot.distanceMeters < 1000
                          ? `${Math.round(spot.distanceMeters)} m away`
                          : `${(spot.distanceMeters / 1000).toFixed(1)} km away`}
                      </span>
                    )}
                  </div>
                  {spot.notes && <p className="text-xs text-gray-600 mt-1 truncate">{spot.notes}</p>}
                </div>

                <div className="flex gap-2 shrink-0">
                  {spot.status === 'AVAILABLE' && (
                    <button
                      onClick={() => handleReserve(spot.id)}
                      disabled={actionLoading === spot.id}
                      className="bg-gray-100 text-black px-4 py-1.5 rounded-md text-sm font-medium transition-colors hover:bg-white active:bg-gray-300 disabled:opacity-50"
                    >
                      {actionLoading === spot.id ? '…' : 'Reserve'}
                    </button>
                  )}
                  {spot.status === 'RESERVED' && (
                    <button
                      onClick={() => handleRelease(spot.id)}
                      disabled={actionLoading === spot.id}
                      className="border border-gray-500 text-gray-300 px-4 py-1.5 rounded-md text-sm transition-colors hover:border-gray-400 hover:text-white disabled:opacity-50"
                    >
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
