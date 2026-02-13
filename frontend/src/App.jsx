import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import VehicleList from './pages/VehicleList';
import ReservationForm from './pages/ReservationForm';
import ReservationStatus from './pages/ReservationStatus';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vehicles" element={<VehicleList />} />
          <Route path="/reserve/:vehicleId" element={<ReservationForm />} />
          <Route path="/reservations/:reservationId" element={<ReservationStatus />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
