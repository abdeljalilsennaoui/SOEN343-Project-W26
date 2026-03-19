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


function PageLayout({ children }) {
   return <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>;
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
                        <div className="min-h-screen bg-gray-50">
                            <Navbar />
                            <Routes>
                            <Route path="/map" element={<MapPage />} />
                            <Route path="/old-map" element={<OldMapPage />} />
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
    )
}