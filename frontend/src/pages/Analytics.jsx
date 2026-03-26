import { useState, useEffect } from 'react';
import { getRentalAnalytics, getGatewayAnalytics } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';

function StatCard({ title, children }) {
  return (
    <div className="bg-[#13161d] border border-[#1e2330] p-6 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-300 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Analytics() {
  const [rentals, setRentals] = useState(null);
  const [gateway, setGateway] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [r, g] = await Promise.all([getRentalAnalytics(), getGatewayAnalytics()]);
        setRentals(r.data);
        setGateway(g.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-[#e8eaf0]">Analytics Dashboard</h2>
      <ErrorMessage error={error} />

      {loading ? (
        <p className="text-gray-500">Loading analytics…</p>
      ) : (
        <div className="space-y-8">
          {/* Rental Analytics */}
          <section>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Rental Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Total Rentals">
                <p className="text-4xl font-bold text-[#e8eaf0]">{rentals?.totalRentals ?? 0}</p>
              </StatCard>

              <StatCard title="Rentals by City">
                {!rentals || Object.keys(rentals.rentalsByCity).length === 0 ? (
                  <p className="text-gray-500 text-sm">No data yet</p>
                ) : (
                  <ul className="space-y-2">
                    {Object.entries(rentals.rentalsByCity).map(([city, count]) => (
                      <li key={city} className="flex justify-between items-center">
                        <span className="text-gray-400">{city}</span>
                        <span className="font-semibold bg-blue-500/15 text-blue-400 py-1 px-3 rounded-full text-sm">{count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </StatCard>

              <StatCard title="Rentals by Type">
                {!rentals || Object.keys(rentals.rentalsByType).length === 0 ? (
                  <p className="text-gray-500 text-sm">No data yet</p>
                ) : (
                  <ul className="space-y-2">
                    {Object.entries(rentals.rentalsByType).map(([type, count]) => (
                      <li key={type} className="flex justify-between items-center">
                        <span className="text-gray-400 capitalize">{type.replace(/_/g, ' ').toLowerCase()}</span>
                        <span className="font-semibold bg-green-500/15 text-green-400 py-1 px-3 rounded-full text-sm">{count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </StatCard>
            </div>
          </section>

          {/* Gateway Analytics */}
          <section>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Service Gateway Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Total Gateway Calls">
                <p className="text-4xl font-bold text-[#e8eaf0]">{gateway?.totalGatewayCalls ?? 0}</p>
              </StatCard>

              <StatCard title="Calls by Service">
                {!gateway || Object.keys(gateway.callsByService).length === 0 ? (
                  <p className="text-gray-500 text-sm">No data yet</p>
                ) : (
                  <ul className="space-y-2">
                    {Object.entries(gateway.callsByService).map(([svc, count]) => (
                      <li key={svc} className="flex justify-between items-center">
                        <span className="text-gray-400 capitalize">{svc}</span>
                        <span className="font-semibold bg-purple-500/15 text-purple-400 py-1 px-3 rounded-full text-sm">{count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </StatCard>

              <StatCard title="External Service Events">
                <ul className="space-y-2">
                  <li className="flex justify-between items-center">
                    <span className="text-gray-400">Transit queries</span>
                    <span className="font-semibold bg-indigo-500/15 text-indigo-400 py-1 px-3 rounded-full text-sm">{gateway?.transitQueries ?? 0}</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-gray-400">Parking reservations</span>
                    <span className="font-semibold bg-orange-500/15 text-orange-400 py-1 px-3 rounded-full text-sm">{gateway?.parkingReservations ?? 0}</span>
                  </li>
                </ul>
              </StatCard>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Analytics;
