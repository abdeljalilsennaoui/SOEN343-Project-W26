import { useState, useEffect } from 'react';
import { getRentalAnalytics, getGatewayAnalytics, getProviderVehicles } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

function StatCard({ title, children }) {
  return (
    <div className="bg-[#13161d] border border-[#1e2330] p-6 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-300 mb-4">{title}</h3>
      {children}
    </div>
  );
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0d0f14] border border-[#1e2330] px-3 py-2 rounded text-sm">
        <p className="text-gray-300">{payload[0].payload.name || payload[0].name}</p>
        <p className="text-blue-400 font-semibold">{payload[0].value}</p>
      </div>
    );
  }
  return null;
}

function Analytics() {
  const { userRole } = useAuth();
  const isProvider = userRole === 'MOBILITY_PROVIDER';
  const isAdmin = userRole === 'CITY_ADMINISTRATOR' || userRole === 'SYSTEM_ADMINISTRATOR';
  const [rentals, setRentals] = useState(null);
  const [gateway, setGateway] = useState(null);
  const [fleetVehiclesCount, setFleetVehiclesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const requests = [getRentalAnalytics(), getGatewayAnalytics()];
        if (isProvider || isAdmin) requests.push(getProviderVehicles());

        const [r, g, providerVehicles] = await Promise.all(requests);
        setRentals(r.data);
        setGateway(g.data);
        if (isProvider || isAdmin) {
          setFleetVehiclesCount(providerVehicles?.data?.length ?? 0);
        } else {
          setFleetVehiclesCount(0);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [isProvider, isAdmin]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-[#e8eaf0]">Analytics Dashboard</h2>
      <ErrorMessage error={error} />

      {loading ? (
        <p className="text-gray-500">Loading analytics…</p>
      ) : (
        <div className="space-y-8">
          <section>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
              {isProvider ? 'My Fleet Rental Analytics' : 'Rental Analytics'}
            </h3>
            {isProvider && (
              <p className="text-xs text-gray-500 mb-3">
                You are viewing rental data for your fleet only.
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard title={isProvider ? 'Vehicles in My Fleet' : isAdmin ? 'Total Vehicles' : 'Total Rentals'}>
                <p className="text-4xl font-bold text-[#e8eaf0]">{isProvider || isAdmin ? fleetVehiclesCount : (rentals?.totalRentals ?? 0)}</p>
                {(isProvider || isAdmin) && (
                  <p className="text-xs text-gray-500 mt-2">
                    Rentals: {rentals?.totalRentals ?? 0}
                  </p>
                )}
              </StatCard>

              <StatCard title="Active Cities">
                <p className="text-4xl font-bold text-[#e8eaf0]">{rentals ? Object.keys(rentals.rentalsByCity).length : 0}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {rentals && Object.keys(rentals.rentalsByCity).length > 0
                    ? `Top: ${Object.entries(rentals.rentalsByCity).reduce((a, b) => b[1] > a[1] ? b : a)[0]}`
                    : 'No data'}
                </p>
              </StatCard>

              <StatCard title="Vehicle Types">
                <p className="text-4xl font-bold text-[#e8eaf0]">{rentals ? Object.keys(rentals.rentalsByType).length : 0}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {rentals && Object.keys(rentals.rentalsByType).length > 0
                    ? `Popular: ${Object.entries(rentals.rentalsByType).reduce((a, b) => b[1] > a[1] ? b : a)[0][0].replace(/_/g, ' ').toLowerCase()}`
                    : 'No data'}
                </p>
              </StatCard>

              <StatCard title="Avg per City">
                <p className="text-4xl font-bold text-[#e8eaf0]">
                  {rentals && Object.keys(rentals.rentalsByCity).length > 0
                    ? Math.round(rentals.totalRentals / Object.keys(rentals.rentalsByCity).length)
                    : 0}
                </p>
                <p className="text-xs text-gray-500 mt-2">rentals per location</p>
              </StatCard>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatCard title="Rentals by City">
                {!rentals || Object.keys(rentals.rentalsByCity).length === 0 ? (
                  <p className="text-gray-500 text-sm">No data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={Object.entries(rentals.rentalsByCity).map(([city, count]) => ({ name: city, count }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2330" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip content={<CustomTooltip />} cursor={false} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </StatCard>

              <StatCard title="Rentals by Type">
                {!rentals || Object.keys(rentals.rentalsByType).length === 0 ? (
                  <p className="text-gray-500 text-sm">No data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={Object.entries(rentals.rentalsByType).map(([type, count]) => ({
                          name: type.replace(/_/g, ' ').toLowerCase(),
                          value: count
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        isAnimationActive={false}
                      >
                        {Object.keys(rentals.rentalsByType).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} cursor={false} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </StatCard>
            </div>
          </section>

          {!isProvider && <section>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Service Gateway Analytics</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard title="Total Gateway Calls">
                <p className="text-4xl font-bold text-[#e8eaf0]">{gateway?.totalGatewayCalls ?? 0}</p>
              </StatCard>

              <StatCard title="Transit Queries">
                <p className="text-4xl font-bold text-[#e8eaf0]">{gateway?.transitQueries ?? 0}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {gateway?.totalGatewayCalls > 0
                    ? `${Math.round((gateway.transitQueries / gateway.totalGatewayCalls) * 100)}% of total`
                    : '0%'}
                </p>
              </StatCard>

              <StatCard title="Parking Reservations">
                <p className="text-4xl font-bold text-[#e8eaf0]">{gateway?.parkingReservations ?? 0}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {gateway?.totalGatewayCalls > 0
                    ? `${Math.round((gateway.parkingReservations / gateway.totalGatewayCalls) * 100)}% of total`
                    : '0%'}
                </p>
              </StatCard>

              <StatCard title="Services Used">
                <p className="text-4xl font-bold text-[#e8eaf0]">{gateway?.callsByService ? Object.keys(gateway.callsByService).length : 0}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {gateway?.callsByService && Object.keys(gateway.callsByService).length > 0
                    ? `Avg: ${Math.round(gateway.totalGatewayCalls / Object.keys(gateway.callsByService).length)} per service`
                    : 'No data'}
                </p>
              </StatCard>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatCard title="Calls by Service">
                {!gateway || Object.keys(gateway.callsByService).length === 0 ? (
                  <p className="text-gray-500 text-sm">No data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={Object.entries(gateway.callsByService).map(([svc, count]) => ({ name: svc, count }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2330" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip content={<CustomTooltip />} cursor={false} />
                      <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </StatCard>

              <StatCard title="External Service Events">
                {((gateway?.transitQueries ?? 0) + (gateway?.parkingReservations ?? 0)) === 0 ? (
                  <p className="text-gray-500 text-sm">No data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'transit queries', value: gateway?.transitQueries ?? 0 },
                          { name: 'parking reservations', value: gateway?.parkingReservations ?? 0 },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        dataKey="value"
                        isAnimationActive={false}
                      >
                        <Cell fill="#6366f1" />
                        <Cell fill="#f97316" />
                      </Pie>
                      <Tooltip content={<CustomTooltip />} cursor={false} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </StatCard>
            </div>
          </section>}
        </div>
      )}
    </div>
  );
}

export default Analytics;
