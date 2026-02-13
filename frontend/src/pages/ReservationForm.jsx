import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createReservation, chargePayment } from '../services/api';
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

      await chargePayment(reservation.id, 5.0);

      navigate(`/reservations/${reservation.id}`);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="reservation-form-page">
      <h2>Reserve Vehicle</h2>
      <p className="vehicle-id-label">Vehicle: <code>{vehicleId}</code></p>
      <ErrorMessage error={error} />
      <form onSubmit={handleSubmit} className="reservation-form">
        <label htmlFor="userId">Your User ID</label>
        <input
          id="userId"
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter your user ID"
          required
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Reserving...' : 'Confirm Reservation'}
        </button>
      </form>
    </div>
  );
}

export default ReservationForm;
