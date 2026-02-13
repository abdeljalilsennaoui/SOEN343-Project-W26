import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { returnVehicle } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';

function ReservationStatus() {
  const { reservationId } = useParams();
  const [returned, setReturned] = useState(false);
  const [returnData, setReturnData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleReturn() {
    setLoading(true);
    setError(null);
    try {
      const data = await returnVehicle(reservationId);
      setReturnData(data.data);
      setReturned(true);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="reservation-status-page">
      <h2>Reservation Details</h2>
      <div className="reservation-info">
        <p><strong>Reservation ID:</strong> {reservationId}</p>
        {returnData && (
          <>
            <p><strong>Status:</strong> {returnData.status}</p>
            <p><strong>End Time:</strong> {new Date(returnData.endTime).toLocaleString()}</p>
          </>
        )}
      </div>
      <ErrorMessage error={error} />
      {!returned ? (
        <button
          className="btn btn-primary"
          onClick={handleReturn}
          disabled={loading}
        >
          {loading ? 'Returning...' : 'Return Vehicle'}
        </button>
      ) : (
        <p className="success-message">Vehicle returned successfully!</p>
      )}
    </div>
  );
}

export default ReservationStatus;
