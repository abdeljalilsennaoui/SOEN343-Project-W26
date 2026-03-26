import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="text-center pt-12">
      <h1 className="text-4xl font-bold mb-3 text-[#e8eaf0]">Smart Urban Mobility Management System</h1>
      <p className="text-gray-400 text-lg mb-8">
        Find and reserve shared vehicles across multiple cities.
        Cars, bikes, and scooters available on demand.
      </p>
      <div className="mb-12">
        <Link
          to="/vehicles"
          className="inline-block bg-gray-100 text-black px-8 py-3 rounded-md text-lg font-semibold transition-colors hover:bg-white active:bg-gray-300 no-underline"
        >
          Browse Vehicles
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#13161d] border border-[#1e2330] p-6 rounded-lg">
          <h3 className="font-semibold text-lg mb-2 text-[#e8eaf0]">Car Sharing</h3>
          <p className="text-gray-400">Reserve cars across Montreal, Toronto, and Vancouver.</p>
        </div>
        <div className="bg-[#13161d] border border-[#1e2330] p-6 rounded-lg">
          <h3 className="font-semibold text-lg mb-2 text-[#e8eaf0]">Bike Sharing</h3>
          <p className="text-gray-400">Quick bike rentals for short urban commutes.</p>
        </div>
        <div className="bg-[#13161d] border border-[#1e2330] p-6 rounded-lg">
          <h3 className="font-semibold text-lg mb-2 text-[#e8eaf0]">Scooter Sharing</h3>
          <p className="text-gray-400">Electric scooters available for last-mile transport.</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
