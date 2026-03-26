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
      <h2 className="text-2xl font-bold mb-4 text-[#e8eaf0]">Reservation Details</h2>
      <div className="bg-[#13161d] border border-[#1e2330] p-5 rounded-lg mb-6">
        <p className="mb-1 text-gray-300"><span className="font-medium text-[#e8eaf0]">Reservation ID:</span> {reservationId}</p>
        {returnData && (
          <>
            <p className="mb-1 text-gray-300"><span className="font-medium text-[#e8eaf0]">Status:</span> {returnData.status}</p>
            <p className="mb-1 text-gray-300"><span className="font-medium text-[#e8eaf0]">End Time:</span> {new Date(returnData.endTime).toLocaleString()}</p>
            {returnData.payment && (
              <div className="mt-4 p-4 bg-[#0d0f14] border border-[#1e2330] rounded-md">
                <h3 className="font-semibold text-lg mb-2 text-[#e8eaf0]">Payment Details</h3>
                <p className="mb-1 text-gray-300"><span className="font-medium text-[#e8eaf0]">Amount Charged:</span> ${returnData.payment.amount.toFixed(2)}</p>
                <p className="mb-1 text-gray-300"><span className="font-medium text-[#e8eaf0]">Payment Status:</span> {returnData.payment.status}</p>
              </div>
            )}
          </>
        )}
      </div>
      <ErrorMessage error={error} />
      {!returned ? (
        <button
          className="bg-gray-100 text-black py-2 px-6 rounded-md font-medium transition-colors hover:bg-white active:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleReturn}
          disabled={loading}
        >
          {loading ? 'Returning...' : 'Return Vehicle'}
        </button>
      ) : (
        <p className="text-green-400 font-semibold mt-4">Vehicle returned successfully!</p>
      )}
    </div>
  );
}

export default ReservationStatus;
