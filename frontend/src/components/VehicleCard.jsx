import { useNavigate } from 'react-router-dom';

const statusStyles = {
  AVAILABLE: 'bg-green-500/15 text-green-400',
  RESERVED: 'bg-yellow-500/15 text-yellow-400',
  IN_USE: 'bg-yellow-500/15 text-yellow-400',
  OUT_OF_SERVICE: 'bg-red-500/15 text-red-400',
};

const typeLabels = {
  CAR_SHARING: 'Car',
  BIKE_SHARING: 'Bike',
  SCOOTER_SHARING: 'Scooter',
};

function VehicleCard({ vehicle, onEdit, onDelete }) {
  const navigate = useNavigate();

  return (
    <div className="bg-[#13161d] rounded-lg p-5 border border-[#1e2330]">
      <div className="flex justify-between items-center mb-3">
        <span className="font-semibold text-lg text-[#e8eaf0]">{typeLabels[vehicle.type] || vehicle.type}</span>
        <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${statusStyles[vehicle.status] || ''}`}>
          {vehicle.status}
        </span>
      </div>
      <div className="space-y-1 mb-4 text-gray-400">
        <p><span className="font-medium text-gray-300">City:</span> {vehicle.city}</p>
        <p><span className="font-medium text-gray-300">Price:</span> ${vehicle.pricePerMin.toFixed(2)}/min</p>
        <p><span className="font-medium text-gray-300">Provider:</span> {vehicle.providerId || 'N/A'}</p>
        {vehicle.lat && vehicle.lng && (
          <p><span className="font-medium text-gray-300">Location:</span> {vehicle.lat.toFixed(4)}, {vehicle.lng.toFixed(4)}</p>
        )}
      </div>
      <div className="flex gap-2">
        {vehicle.status === 'AVAILABLE' && (
          <button
            className="flex-1 bg-gray-100 text-black py-2 px-4 rounded-md text-sm font-medium transition-colors hover:bg-white active:bg-gray-300"
            onClick={() => navigate(`/reserve/${vehicle.id}`)}
          >
            Reserve
          </button>
        )}
        {onEdit && (
          <button
            className="flex-1 border border-blue-500/50 text-blue-400 py-2 px-4 rounded-md text-sm transition-colors hover:border-blue-400 hover:text-blue-300"
            onClick={() => onEdit(vehicle)}
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button
            className="flex-1 border border-red-500/50 text-red-400 py-2 px-4 rounded-md text-sm transition-colors hover:border-red-400 hover:text-red-300"
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
