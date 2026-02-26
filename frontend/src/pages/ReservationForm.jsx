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
      <h2 className="text-2xl font-bold mb-4">Reserve Vehicle</h2>
      <p className="text-gray-500 mb-4">
        Vehicle: <code className="bg-gray-100 px-2 py-0.5 rounded text-sm">{vehicleId}</code>
      </p>
      <ErrorMessage error={error} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label htmlFor="userId" className="font-semibold">Your User ID</label>
        <input
          id="userId"
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter your user ID"
          required
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-slate-800 text-white py-2 px-4 rounded-md hover:bg-slate-900 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? 'Reserving...' : 'Confirm Reservation'}
        </button>
      </form>
    </div>
  );
}

export default ReservationForm;
