import { useCallback, useEffect, useState } from 'react';
import { listRideShares, joinRide, leaveRide } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

export default function RideShare() {
  const { currentUser } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const fetchRides = useCallback(() => {
    setLoading(true);
    setError('');
    listRideShares()
      .then((res) => setRides(res.data || []))
      .catch(() => setError('Failed to load available rides.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchRides(); }, [fetchRides]);

  async function handleJoin(bookingId) {
    setActionLoading(bookingId);
    setError('');
    setMessage('');
    try {
      await joinRide(bookingId);
      setMessage('You have joined the ride.');
      fetchRides();
    } catch (err) {
      setError(err.message || 'Failed to join ride.');
    } finally {
      setActionLoading('');
    }
  }

  async function handleLeave(bookingId) {
    setActionLoading(bookingId);
    setError('');
    setMessage('');
    try {
      await leaveRide(bookingId);
      setMessage('You have left the ride.');
      fetchRides();
    } catch (err) {
      setError(err.message || 'Failed to leave ride.');
    } finally {
      setActionLoading('');
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#e8eaf0]">Ride Share</h1>
        <p className="text-gray-400 text-sm mt-1">Join a shared car ride offered by another commuter.</p>
      </div>

      {error   && <div className="bg-red-500/15 border border-red-500/30 text-red-400 rounded-md px-4 py-3 text-sm">{error}</div>}
      {message && <div className="bg-green-500/15 border border-green-500/30 text-green-400 rounded-md px-4 py-3 text-sm">{message}</div>}

      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : rides.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-1">No shared rides available right now.</p>
          <p className="text-sm">Book a car and enable ride sharing to offer seats to others.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rides.map((ride) => {
            const seatsLeft = ride.maxPassengers - ride.passengers.length;
            const isDriver = ride.userId === currentUser?.uid;
            const isPassenger = ride.passengers.includes(currentUser?.uid);
            const isFull = seatsLeft <= 0;

            return (
              <div key={ride.id} className="bg-[#13161d] border border-[#1e2330] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-[#e8eaf0] font-mono text-sm">{ride.id.slice(0, 8)}…</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      seatsLeft > 0 ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                    }`}>
                      {seatsLeft} seat{seatsLeft !== 1 ? 's' : ''} left
                    </span>
                    {isDriver && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">Your ride</span>
                    )}
                    {isPassenger && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">Joined</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatDate(ride.startTime)} → {formatDate(ride.endTime)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Pickup: {typeof ride.pickupLocation === 'string' ? ride.pickupLocation : 'Set location'}
                  </p>
                </div>

                <div className="flex gap-2 shrink-0">
                  {!isDriver && !isPassenger && (
                    <button
                      onClick={() => handleJoin(ride.id)}
                      disabled={isFull || actionLoading === ride.id}
                      className="bg-gray-100 text-black px-4 py-1.5 rounded-md text-sm font-medium transition-colors hover:bg-white active:bg-gray-300 disabled:opacity-40"
                    >
                      {actionLoading === ride.id ? '…' : 'Join'}
                    </button>
                  )}
                  {isPassenger && (
                    <button
                      onClick={() => handleLeave(ride.id)}
                      disabled={actionLoading === ride.id}
                      className="border border-gray-500 text-gray-300 px-4 py-1.5 rounded-md text-sm transition-colors hover:border-gray-400 hover:text-white disabled:opacity-40"
                    >
                      {actionLoading === ride.id ? '…' : 'Leave'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
