import { useNavigate } from 'react-router-dom';

const statusStyles = {
  AVAILABLE: 'bg-green-100 text-green-800',
  RESERVED: 'bg-yellow-100 text-yellow-800',
  IN_USE: 'bg-yellow-100 text-yellow-800',
  OUT_OF_SERVICE: 'bg-red-100 text-red-800',
};

const typeLabels = {
  CAR_SHARING: 'Car',
  BIKE_SHARING: 'Bike',
  SCOOTER_SHARING: 'Scooter',
};

function VehicleCard({ vehicle }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-3">
        <span className="font-semibold text-lg">{typeLabels[vehicle.type] || vehicle.type}</span>
        <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${statusStyles[vehicle.status] || ''}`}>
          {vehicle.status}
        </span>
      </div>
      <div className="space-y-1 mb-4 text-gray-700">
        <p><span className="font-medium">City:</span> {vehicle.city}</p>
        <p><span className="font-medium">Price:</span> ${vehicle.pricePerMin.toFixed(2)}/min</p>
        <p><span className="font-medium">Provider:</span> {vehicle.providerId || 'N/A'}</p>
      </div>
      {vehicle.status === 'AVAILABLE' && (
        <button
          className="w-full bg-slate-800 text-white py-2 px-4 rounded-md hover:bg-slate-900 transition-colors cursor-pointer"
          onClick={() => navigate(`/reserve/${vehicle.id}`)}
        >
          Reserve
        </button>
      )}
    </div>
  );
}

export default VehicleCard;
