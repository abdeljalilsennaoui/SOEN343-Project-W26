import { Routes, Route } from 'react-router-dom';
import AuthLayout from './pages/Auth/AuthLayout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import VehicleList from './pages/VehicleList';
import ReservationForm from './pages/ReservationForm';
import ReservationStatus from './pages/ReservationStatus';

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
                        <>
                        <Navbar />
                        <main className="max-w-6xl mx-auto px-4 py-8">
                            <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/vehicles" element={<VehicleList />} />
                            <Route path="/reserve/:vehicleId" element={<ReservationForm />} />
                            <Route path="/reservations/:reservationId" element={<ReservationStatus />} />
                            </Routes>
                        </main>
                        </>
                    }
                />
        </Routes>
    )
}