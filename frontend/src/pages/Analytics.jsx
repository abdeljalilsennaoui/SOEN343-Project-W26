import { useState, useEffect } from 'react';
import { getRentalAnalytics } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';

function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const result = await getRentalAnalytics();
        setData(result.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Rental Analytics Dashboard</h2>
      <ErrorMessage error={error} />
      
      {loading ? (
        <p className="text-gray-500">Loading analytics...</p>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Rentals</h3>
            <p className="text-4xl font-bold text-slate-800">{data.totalRentals}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Rentals by City</h3>
            {Object.keys(data.rentalsByCity).length === 0 ? (
              <p className="text-gray-500 text-sm">No data yet</p>
            ) : (
              <ul className="space-y-2">
                {Object.entries(data.rentalsByCity).map(([city, count]) => (
                  <li key={city} className="flex justify-between items-center">
                    <span className="text-gray-600 capitalize">{city}</span>
                    <span className="font-semibold bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-sm">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Rentals by Mobility Type</h3>
            {Object.keys(data.rentalsByType).length === 0 ? (
              <p className="text-gray-500 text-sm">No data yet</p>
            ) : (
              <ul className="space-y-2">
                {Object.entries(data.rentalsByType).map(([type, count]) => (
                  <li key={type} className="flex justify-between items-center">
                    <span className="text-gray-600 capitalize">{type.replace('_', ' ').toLowerCase()}</span>
                    <span className="font-semibold bg-green-100 text-green-800 py-1 px-3 rounded-full text-sm">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <p className="text-gray-500">No analytics data available.</p>
      )}
    </div>
  );
}

export default Analytics;