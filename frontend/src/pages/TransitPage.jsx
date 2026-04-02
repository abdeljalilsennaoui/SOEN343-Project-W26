import { useState } from 'react';
import { getTransitSchedule } from '../services/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CITIES = ['Montreal'];
const TYPE_ICONS = { BUS: '🚌', METRO: '🚇', TRAM: '🚋' };

function TripRow({ trip }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-[#1e2330] rounded-lg bg-[#13161d] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-white/5"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-gray-300 w-12">{trip.departsAt}</span>
          <span className="text-sm text-gray-300 truncate">{trip.direction}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{trip.stops.length} stops</span>
          <span className="text-gray-500 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[#1e2330] divide-y divide-[#1e2330] max-h-48 overflow-y-auto">
          {trip.stops.map((stop, idx) => (
            <div key={idx} className="flex items-center gap-3 px-3 py-1.5">
              <span className="text-xs font-mono text-gray-500 w-12 shrink-0">{stop.time}</span>
              <span className="text-xs text-gray-400">{stop.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TransitPage() {
  const [city, setCity] = useState('Montreal');
  const [line, setLine] = useState('');
  const [schedule, setSchedule] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState('');

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

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-[#e8eaf0]">Public Transportation</h1>
        <p className="text-gray-400 text-sm">Check schedules and find nearby stops.</p>
      </div>

      <section className="bg-[#13161d] border border-[#1e2330] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-300 mb-4">Transit Schedule</h2>
        <form onSubmit={handleSearchSchedule} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">City</label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="w-[180px] border-gray-600 bg-[#0d0f14] text-[#e8eaf0] focus-visible:border-gray-300 focus-visible:ring-0">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Line</label>
            <input value={line} onChange={(e) => setLine(e.target.value)} placeholder="e.g. 24 or 1"
              className="border border-gray-600 bg-[#0d0f14] text-[#e8eaf0] placeholder-gray-500 rounded-md px-3 py-2 text-sm w-40 transition-colors focus:border-gray-300 focus:outline-none" />
          </div>
          <button type="submit" disabled={loadingSchedule}
            className="bg-gray-100 text-black px-5 py-2 rounded-md text-sm font-medium transition-colors hover:bg-white active:bg-gray-300 disabled:opacity-50">
            {loadingSchedule ? 'Loading…' : 'Get Schedule'}
          </button>
        </form>

        {scheduleError && <p className="text-red-400 text-sm mt-3">{scheduleError}</p>}

        {schedule.length > 0 && (
          <div className="mt-4 space-y-3">
            {schedule.map((entry, i) => {
              if (entry.trips) {
                return (
                  <div key={i} className="border border-[#1e2330] rounded-lg p-4 bg-[#0d0f14]">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{TYPE_ICONS[entry.type] || '🚍'}</span>
                      <span
                        className="font-medium px-2 py-0.5 rounded text-white text-sm"
                        style={{ backgroundColor: entry.color || '#334155' }}
                      >
                        {entry.line}
                      </span>
                      {entry.name && <span className="text-sm text-gray-400">{entry.name}</span>}
                      <span className="ml-auto text-xs text-gray-500">{entry.tripsCount} trips</span>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {entry.trips.map((trip) => (
                        <TripRow key={trip.tripId} trip={trip} />
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <div key={i} className="border border-[#1e2330] rounded-lg p-4 bg-[#0d0f14] flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{TYPE_ICONS[entry.type] || '🚍'}</span>
                      <span
                        className="font-medium px-2 py-0.5 rounded text-white text-sm"
                        style={{ backgroundColor: entry.color || '#334155' }}
                      >
                        {entry.line}
                      </span>
                      {entry.name && <span className="text-sm text-gray-400">{entry.name}</span>}
                    </div>
                    <p className="text-sm text-gray-500">
                      Next arrivals: {entry.nextArrivals?.join(', ')}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-500/15 text-blue-400">
                    {entry.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
