import { useCallback, useEffect, useState } from 'react';
import { listRideShares, joinRide, leaveRide, getMyBookings } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function formatPickup(pickup) {
  if (!pickup) return 'Not specified';
  if (typeof pickup === 'string') return pickup;
  if (pickup.address) return pickup.address;
  if (typeof pickup.lat === 'number') return `${pickup.lat.toFixed(5)}, ${pickup.lng.toFixed(5)}`;
  return 'Not specified';
}

export default function RideShare() {
  const { currentUser } = useAuth();
  const [myRide, setMyRide] = useState(null);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const fetchRides = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([
      listRideShares(),
      getMyBookings(),
    ])
      .then(([sharesRes, bookingsRes]) => {
        const available = sharesRes.data || [];
        setRides(available);

        const ownRide = (bookingsRes.data || []).find(
          (b) => b.status === 'ACTIVE' && b.rideSharing === true,
        ) ?? null;
        setMyRide(ownRide);
      })
      .catch(() => setError('Failed to load rides.'))
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

  const availableRides = rides.filter((r) => r.userId !== currentUser?.uid);

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
      ) : (
        <>
          {myRide && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Your active ride</h2>
              <div className="bg-[#13161d] border border-purple-500/30 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-[#e8eaf0] font-mono text-sm">{myRide.id.slice(0, 8)}…</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 font-medium">
                    Your ride
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    (myRide.maxPassengers - (myRide.passengers?.length ?? 0)) > 0
                      ? 'bg-green-500/15 text-green-400'
                      : 'bg-red-500/15 text-red-400'
                  }`}>
                    {myRide.maxPassengers - (myRide.passengers?.length ?? 0)} seat{(myRide.maxPassengers - (myRide.passengers?.length ?? 0)) !== 1 ? 's' : ''} left
                  </span>
                </div>
                <p className="text-xs text-gray-500">{formatDate(myRide.startTime)} → {formatDate(myRide.endTime)}</p>
                <p className="text-xs text-gray-500">Pickup: {formatPickup(myRide.pickupLocation)}</p>
                {myRide.passengers?.length > 0 ? (
                  <p className="text-xs text-gray-400">
                    {myRide.passengers.length} passenger{myRide.passengers.length !== 1 ? 's' : ''} joined
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">No passengers yet</p>
                )}
              </div>
            </section>
          )}

          <section className="space-y-3">
            {myRide && (
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Available rides</h2>
            )}
            {availableRides.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p className="text-lg mb-1">No shared rides available right now.</p>
                <p className="text-sm">Book a car and enable ride sharing to offer seats to others.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableRides.map((ride) => {
                  const seatsLeft = ride.maxPassengers - ride.passengers.length;
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
                          {isPassenger && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">Joined</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatDate(ride.startTime)} → {formatDate(ride.endTime)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Pickup: {formatPickup(ride.pickupLocation)}
                        </p>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        {!isPassenger && (
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
          </section>
        </>
      )}
    </div>
  );
}
