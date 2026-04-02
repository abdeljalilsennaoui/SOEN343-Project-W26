import { useState } from 'react';

export default function RideSharingModal({ option, onConfirm, onCancel }) {
  const [rideSharing, setRideSharing] = useState(false);
  const [maxPassengers, setMaxPassengers] = useState(1);
  const [pickupAddress, setPickupAddress] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    await onConfirm(rideSharing, maxPassengers, pickupAddress.trim());
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-lg border border-[#1e2330] bg-[#13161d] p-6 shadow-xl space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[#e8eaf0]">Confirm Car Booking</h2>
          <p className="text-sm text-gray-400 mt-1">
            {option.shortDescription || 'Car Sharing'} · Est.{' '}
            <strong className="text-[#e8eaf0]">${option.estimatedPrice?.toFixed(2)}</strong> for 60 min
          </p>
        </div>

        <div className="border border-[#1e2330] rounded-md p-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rideSharing}
              onChange={(e) => setRideSharing(e.target.checked)}
              className="w-4 h-4 accent-gray-300"
            />
            <div>
              <p className="text-sm text-[#e8eaf0] font-medium">Offer ride sharing</p>
              <p className="text-xs text-gray-500">Let other commuters join your car</p>
            </div>
          </label>

          {rideSharing && (
            <div className="space-y-3 pl-7">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-400 shrink-0">Max passengers:</label>
                <input
                  type="number"
                  min={1}
                  max={3}
                  value={maxPassengers}
                  onChange={(e) => setMaxPassengers(Number(e.target.value))}
                  className="w-16 border border-gray-600 bg-[#0d0f14] text-[#e8eaf0] rounded-md px-2 py-1 text-sm text-center focus:border-gray-300 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-400">Pickup address <span className="text-gray-600">(where passengers meet you)</span></label>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="e.g. 1234 Rue Sainte-Catherine, Montreal"
                  className="w-full border border-gray-600 bg-[#0d0f14] text-[#e8eaf0] rounded-md px-3 py-1.5 text-sm placeholder-gray-600 focus:border-gray-300 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 bg-gray-100 text-black py-2 rounded-md text-sm font-medium transition-colors hover:bg-white active:bg-gray-300 disabled:opacity-40"
          >
            {loading ? 'Booking…' : 'Book & Confirm'}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 border border-gray-500 text-gray-300 py-2 rounded-md text-sm transition-colors hover:border-gray-400 hover:text-white disabled:opacity-40"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
