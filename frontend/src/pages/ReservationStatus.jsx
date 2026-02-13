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
    <div>
      <h2 className="text-2xl font-bold mb-4">Reservation Details</h2>
      <div className="bg-white p-5 rounded-lg shadow-sm mb-6">
        <p className="mb-1"><span className="font-medium">Reservation ID:</span> {reservationId}</p>
        {returnData && (
          <>
            <p className="mb-1"><span className="font-medium">Status:</span> {returnData.status}</p>
            <p className="mb-1"><span className="font-medium">End Time:</span> {new Date(returnData.endTime).toLocaleString()}</p>
          </>
        )}
      </div>
      <ErrorMessage error={error} />
      {!returned ? (
        <button
          className="bg-slate-800 text-white py-2 px-6 rounded-md hover:bg-slate-900 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
          onClick={handleReturn}
          disabled={loading}
        >
          {loading ? 'Returning...' : 'Return Vehicle'}
        </button>
      ) : (
        <p className="text-green-700 font-semibold mt-4">Vehicle returned successfully!</p>
      )}
    </div>
  );
}

export default ReservationStatus;
