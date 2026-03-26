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

function VehicleCard({ vehicle, onEdit, onDelete }) {
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
        {vehicle.lat && vehicle.lng && (
          <p><span className="font-medium">Location:</span> {vehicle.lat.toFixed(4)}, {vehicle.lng.toFixed(4)}</p>
        )}
      </div>
      <div className="flex gap-2">
        {vehicle.status === 'AVAILABLE' && (
          <button
            className="flex-1 bg-slate-800 text-white py-2 px-4 rounded-md hover:bg-slate-900 transition-colors cursor-pointer text-sm"
            onClick={() => navigate(`/reserve/${vehicle.id}`)}
          >
            Reserve
          </button>
        )}
        {onEdit && (
          <button
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors cursor-pointer text-sm"
            onClick={() => onEdit(vehicle)}
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors cursor-pointer text-sm"
            onClick={() => onDelete(vehicle.id)}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

export default VehicleCard;
