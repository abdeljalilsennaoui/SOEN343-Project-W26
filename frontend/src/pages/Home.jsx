import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="text-center pt-12">
      <h1 className="text-4xl font-bold mb-3">Smart Urban Mobility Management System</h1>
      <p className="text-gray-500 text-lg mb-8">
        Find and reserve shared vehicles across multiple cities.
        Cars, bikes, and scooters available on demand.
      </p>
      <div className="mb-12">
        <Link
          to="/vehicles"
          className="inline-block bg-slate-800 text-white px-8 py-3 rounded-md text-lg hover:bg-slate-900 transition-colors no-underline"
        >
          Browse Vehicles
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold text-lg mb-2">Car Sharing</h3>
          <p className="text-gray-600">Reserve cars across Montreal, Toronto, and Vancouver.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold text-lg mb-2">Bike Sharing</h3>
          <p className="text-gray-600">Quick bike rentals for short urban commutes.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold text-lg mb-2">Scooter Sharing</h3>
          <p className="text-gray-600">Electric scooters available for last-mile transport.</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
