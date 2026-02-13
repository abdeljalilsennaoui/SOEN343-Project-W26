import { useNavigate } from 'react-router-dom';

function VehicleCard({ vehicle }) {
  const navigate = useNavigate();

  const typeLabels = {
    CAR_SHARING: 'Car',
    BIKE_SHARING: 'Bike',
    SCOOTER_SHARING: 'Scooter',
  };

  return (
    <div className="vehicle-card">
      <div className="vehicle-card-header">
        <span className="vehicle-type">{typeLabels[vehicle.type] || vehicle.type}</span>
        <span className={`vehicle-status status-${vehicle.status.toLowerCase()}`}>
          {vehicle.status}
        </span>
      </div>
      <div className="vehicle-card-body">
        <p><strong>City:</strong> {vehicle.city}</p>
        <p><strong>Price:</strong> ${vehicle.pricePerMin.toFixed(2)}/min</p>
        <p><strong>Provider:</strong> {vehicle.providerId}</p>
      </div>
      {vehicle.status === 'AVAILABLE' && (
        <button
          className="btn btn-primary"
          onClick={() => navigate(`/reserve/${vehicle.id}`)}
        >
          Reserve
        </button>
      )}
    </div>
  );
}

export default VehicleCard;
