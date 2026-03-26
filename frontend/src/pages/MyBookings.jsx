import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyBookings } from '@/services/api';

const STATUS_STYLES = {
  DRAFT:    'bg-yellow-500/15 text-yellow-400',
  ACTIVE:   'bg-blue-500/15 text-blue-400',
  COMPLETE: 'bg-green-500/15 text-green-400',
  FAILED:   'bg-red-500/15 text-red-400',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function BookingRow({ booking }) {
  return (
    <div className="bg-[#13161d] border border-[#1e2330] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[#e8eaf0] text-sm">{booking.id.slice(0, 8)}…</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[booking.status] || 'bg-gray-500/15 text-gray-400'}`}>
            {booking.status}
          </span>
        </div>
        <p className="text-xs text-gray-500">Option: {booking.optionId}</p>
        <p className="text-xs text-gray-500">
          {formatDate(booking.startTime)} → {formatDate(booking.endTime)}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-lg font-semibold text-[#e8eaf0]">${booking.totalPrice?.toFixed(2) ?? '—'}</p>
        <p className="text-xs text-gray-500">Booked {formatDate(booking.createdAt)}</p>
      </div>
    </div>
  );
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBookings = useCallback(() => {
    setLoading(true);
    setError('');
    getMyBookings()
      .then((res) => setBookings(res.data))
      .catch(() => setError('Failed to load bookings.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Refresh when the tab/window regains focus (e.g. after completing a booking)
  useEffect(() => {
    const onFocus = () => fetchBookings();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchBookings]);

  const active   = bookings.filter((b) => b.status === 'ACTIVE');
  const draft    = bookings.filter((b) => b.status === 'DRAFT');
  const past     = bookings.filter((b) => b.status === 'COMPLETE' || b.status === 'FAILED');

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#e8eaf0]">My Bookings</h1>
        <Link
          to="/book"
          className="text-sm bg-gray-100 text-black px-4 py-2 rounded-md font-medium transition-colors hover:bg-white active:bg-gray-300 no-underline"
        >
          + New Booking
        </Link>
      </div>

      {loading && <p className="text-gray-500">Loading…</p>}
      {error   && <p className="text-red-400">{error}</p>}

      {!loading && !error && bookings.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">No bookings yet.</p>
          <Link to="/book" className="text-gray-300 underline hover:no-underline">Book a ride</Link>
        </div>
      )}

      {active.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Active</h2>
          <div className="space-y-3">{active.map((b) => <BookingRow key={b.id} booking={b} />)}</div>
        </section>
      )}

      {draft.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Drafts</h2>
          <div className="space-y-3">{draft.map((b) => <BookingRow key={b.id} booking={b} />)}</div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Past</h2>
          <div className="space-y-3">{past.map((b) => <BookingRow key={b.id} booking={b} />)}</div>
        </section>
      )}
    </div>
  );
}
