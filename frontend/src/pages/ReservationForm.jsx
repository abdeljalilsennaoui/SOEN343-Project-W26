import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createReservation } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';

function ReservationForm() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userId.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const resData = await createReservation(userId.trim(), vehicleId);
      const reservation = resData.data;

      navigate(`/reservations/${reservation.id}`);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md">
      <h2 className="text-2xl font-bold mb-4 text-[#e8eaf0]">Reserve Vehicle</h2>
      <p className="text-gray-400 mb-4">
        Vehicle: <code className="bg-[#1e2330] px-2 py-0.5 rounded text-sm text-gray-300">{vehicleId}</code>
      </p>
      <ErrorMessage error={error} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label htmlFor="userId" className="font-semibold text-gray-300">Your User ID</label>
        <input
          id="userId"
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter your user ID"
          required
          className="px-3 py-2 border border-gray-600 bg-[#0d0f14] text-[#e8eaf0] placeholder-gray-500 rounded-md text-sm transition-colors focus:border-gray-300 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-gray-100 text-black py-2 px-4 rounded-md font-medium transition-colors hover:bg-white active:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Reserving...' : 'Confirm Reservation'}
        </button>
      </form>
    </div>
  );
}

export default ReservationForm;
