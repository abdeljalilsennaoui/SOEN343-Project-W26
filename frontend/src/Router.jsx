import { Routes, Route } from 'react-router-dom';
import AuthLayout from './pages/Auth/AuthLayout';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import VehicleList from './pages/VehicleList';
import ReservationForm from './pages/ReservationForm';
import ReservationStatus from './pages/ReservationStatus';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleGuard from '@/components/RoleGuard';
import MapPage from '@/pages/Map';
import OldMapPage from '@/pages/OldMap';
import Analytics from '@/pages/Analytics';
import Login from '@/pages/Auth/Login';
import Register from '@/pages/Auth/Register';
import BookingFlow from '@/pages/BookingFlow';
import ProviderDashboard from '@/pages/ProviderDashboard';
import ParkingPage from '@/pages/ParkingPage';
import TransitPage from '@/pages/TransitPage';
import MyBookings from '@/pages/MyBookings';
import RideShare from '@/pages/RideShare';

const PROVIDER_ROLES = ['MOBILITY_PROVIDER', 'CITY_ADMINISTRATOR', 'SYSTEM_ADMINISTRATOR'];
const ANALYTICS_ROLES = ['MOBILITY_PROVIDER', 'CITY_ADMINISTRATOR', 'SYSTEM_ADMINISTRATOR'];

function PageLayout({ children }) {
  return <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>;
}

function ProtectedAppRoutes() {
  return (
    <div className="min-h-screen bg-[#0d0f14] text-[#e8eaf0]">
      <Navbar />
      <Routes>
        <Route path="/map" element={<MapPage />} />
        <Route path="/old-map" element={<OldMapPage />} />
        <Route path="/book" element={<BookingFlow />} />
        <Route path="/" element={<PageLayout><Home /></PageLayout>} />
        <Route path="/vehicles" element={<PageLayout><VehicleList /></PageLayout>} />
        <Route path="/reserve/:vehicleId" element={<PageLayout><ReservationForm /></PageLayout>} />
        <Route path="/reservations/:reservationId" element={<PageLayout><ReservationStatus /></PageLayout>} />
        <Route path="/analytics" element={<RoleGuard allowed={ANALYTICS_ROLES}><PageLayout><Analytics /></PageLayout></RoleGuard>} />
        <Route path="/parking" element={<PageLayout><ParkingPage /></PageLayout>} />
        <Route path="/transit" element={<PageLayout><TransitPage /></PageLayout>} />
        <Route path="/provider" element={<RoleGuard allowed={PROVIDER_ROLES}><PageLayout><ProviderDashboard /></PageLayout></RoleGuard>} />
        <Route path="/bookings" element={<PageLayout><MyBookings /></PageLayout>} />
        <Route path="/rideshare" element={<PageLayout><RideShare /></PageLayout>} />
      </Routes>
    </div>
  );
}

export default function Router() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <ProtectedAppRoutes />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
