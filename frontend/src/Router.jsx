import { Routes, Route } from 'react-router-dom';
import AuthLayout from './pages/Auth/AuthLayout';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import VehicleList from './pages/VehicleList';
import ReservationForm from './pages/ReservationForm';
import ReservationStatus from './pages/ReservationStatus';
import ProtectedRoute from '@/components/ProtectedRoute';
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

function PageLayout({ children }) {
  return <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>;
}

function ProtectedAppRoutes() {
  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      <Navbar />
      <Routes>
        <Route path="/map" element={<MapPage />} />
        <Route path="/old-map" element={<OldMapPage />} />
        <Route path="/book" element={<BookingFlow />} />
        <Route path="/" element={<PageLayout><Home /></PageLayout>} />
        <Route path="/vehicles" element={<PageLayout><VehicleList /></PageLayout>} />
        <Route path="/reserve/:vehicleId" element={<PageLayout><ReservationForm /></PageLayout>} />
        <Route path="/reservations/:reservationId" element={<PageLayout><ReservationStatus /></PageLayout>} />
        <Route path="/analytics" element={<PageLayout><Analytics /></PageLayout>} />
        <Route path="/parking" element={<PageLayout><ParkingPage /></PageLayout>} />
        <Route path="/transit" element={<PageLayout><TransitPage /></PageLayout>} />
        <Route path="/provider" element={<PageLayout><ProviderDashboard /></PageLayout>} />
        <Route path="/bookings" element={<PageLayout><MyBookings /></PageLayout>} />
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
