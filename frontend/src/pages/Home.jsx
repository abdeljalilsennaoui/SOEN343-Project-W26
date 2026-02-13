import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="home">
      <h1>Smart Urban Mobility Management System</h1>
      <p className="home-subtitle">
        Find and reserve shared vehicles across multiple cities.
        Cars, bikes, and scooters available on demand.
      </p>
      <div className="home-actions">
        <Link to="/vehicles" className="btn btn-primary btn-lg">
          Browse Vehicles
        </Link>
      </div>
      <div className="home-features">
        <div className="feature-card">
          <h3>Car Sharing</h3>
          <p>Reserve cars across Montreal, Toronto, and Vancouver.</p>
        </div>
        <div className="feature-card">
          <h3>Bike Sharing</h3>
          <p>Quick bike rentals for short urban commutes.</p>
        </div>
        <div className="feature-card">
          <h3>Scooter Sharing</h3>
          <p>Electric scooters available for last-mile transport.</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
