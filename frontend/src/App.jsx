import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import VehicleList from './pages/VehicleList';
import ReservationForm from './pages/ReservationForm';
import ReservationStatus from './pages/ReservationStatus';
import Analytics from './pages/Analytics';
import MapPage from './pages/Map';
import Login from './pages/Login';
import Register from './pages/Register';

// Applies standard page padding — not used for /map (needs full viewport height)
function PageLayout({ children }) {
  return <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50">
                <Navbar />
                <Routes>
                  <Route path="/map" element={<MapPage />} />
                  <Route path="/" element={<PageLayout><Home /></PageLayout>} />
                  <Route path="/vehicles" element={<PageLayout><VehicleList /></PageLayout>} />
                  <Route path="/reserve/:vehicleId" element={<PageLayout><ReservationForm /></PageLayout>} />
                  <Route path="/reservations/:reservationId" element={<PageLayout><ReservationStatus /></PageLayout>} />
                  <Route path="/analytics" element={<PageLayout><Analytics /></PageLayout>} />
                </Routes>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
