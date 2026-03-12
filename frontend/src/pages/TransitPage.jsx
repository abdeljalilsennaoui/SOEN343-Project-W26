import { useState } from 'react';
import { getTransitSchedule, getNearbyStops } from '../services/api';

const CITIES = ['Montreal', 'Toronto', 'Vancouver'];
const TYPE_ICONS = { BUS: '🚌', METRO: '🚇', TRAM: '🚋' };

export default function TransitPage() {
  const [city, setCity] = useState('Montreal');
  const [line, setLine] = useState('');
  const [schedule, setSchedule] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState('');

  const [lat, setLat] = useState('45.5017');
  const [lng, setLng] = useState('-73.5673');
  const [stops, setStops] = useState([]);
  const [loadingStops, setLoadingStops] = useState(false);
  const [stopsError, setStopsError] = useState('');

  async function handleSearchSchedule(e) {
    e.preventDefault();
    setScheduleError('');
    setSchedule([]);
    setLoadingSchedule(true);
    try {
      const res = await getTransitSchedule(city, line || null);
      setSchedule(res.data);
    } catch (err) {
      setScheduleError(err.message || 'Failed to load schedule');
    } finally {
      setLoadingSchedule(false);
    }
  }

  async function handleFindStops(e) {
    e.preventDefault();
    setStopsError('');
    setStops([]);
    setLoadingStops(true);
    try {
      const res = await getNearbyStops(parseFloat(lat), parseFloat(lng));
      setStops(res.data);
    } catch (err) {
      setStopsError(err.message || 'Failed to find stops');
    } finally {
      setLoadingStops(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Public Transportation</h1>
        <p className="text-gray-500 text-sm">Check schedules and find nearby stops.</p>
      </div>

      {/* Schedule Search */}
      <section className="bg-white border rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Transit Schedule</h2>
        <form onSubmit={handleSearchSchedule} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
            <select value={city} onChange={(e) => setCity(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Line (optional)</label>
            <input value={line} onChange={(e) => setLine(e.target.value)} placeholder="e.g. 24 or Green"
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 w-40" />
          </div>
          <button type="submit" disabled={loadingSchedule}
            className="bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors">
            {loadingSchedule ? 'Loading…' : 'Get Schedule'}
          </button>
        </form>

        {scheduleError && <p className="text-red-600 text-sm mt-3">{scheduleError}</p>}

        {schedule.length > 0 && (
          <div className="mt-4 space-y-3">
            {schedule.map((entry, i) => (
              <div key={i} className="border rounded-xl p-4 bg-gray-50 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{TYPE_ICONS[entry.type] || '🚍'}</span>
                    <span className="font-medium text-gray-800">Line {entry.line}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{entry.type}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Next arrivals: {entry.nextArrivals.join(' · ')}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  entry.status === 'On time' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>{entry.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Nearby Stops */}
      <section className="bg-white border rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Nearby Stops</h2>
        <form onSubmit={handleFindStops} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
            <input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 w-36" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
            <input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 w-36" />
          </div>
          <button type="submit" disabled={loadingStops}
            className="bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors">
            {loadingStops ? 'Finding…' : 'Find Stops'}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-1">Default coordinates: Montréal downtown.</p>

        {stopsError && <p className="text-red-600 text-sm mt-3">{stopsError}</p>}

        {stops.length > 0 && (
          <div className="mt-4 space-y-2">
            {stops.map((stop) => (
              <div key={stop.id} className="border rounded-xl p-3 bg-gray-50 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{stop.name}</p>
                  <p className="text-xs text-gray-500">
                    {stop.coordinates.lat.toFixed(4)}, {stop.coordinates.lng.toFixed(4)}
                  </p>
                </div>
                <span className="text-sm text-gray-500">{stop.distanceKm} km</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
