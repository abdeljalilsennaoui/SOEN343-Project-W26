import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ROLE_LABELS = {
  COMMUTER: 'Commuter',
  MOBILITY_PROVIDER: 'Provider',
  CITY_ADMINISTRATOR: 'City Admin',
  SYSTEM_ADMINISTRATOR: 'Admin',
};

const ROLE_STYLES = {
  COMMUTER: 'bg-blue-100 text-blue-700',
  MOBILITY_PROVIDER: 'bg-amber-100 text-amber-700',
  CITY_ADMINISTRATOR: 'bg-purple-100 text-purple-700',
  SYSTEM_ADMINISTRATOR: 'bg-red-100 text-red-700',
};

function Navbar() {
  const { currentUser, userRole, logout } = useAuth();

  const isProvider = userRole === 'MOBILITY_PROVIDER' || userRole === 'CITY_ADMINISTRATOR' || userRole === 'SYSTEM_ADMINISTRATOR';

  return (
    <nav className="bg-slate-900 text-white flex items-center justify-between px-8 py-3">
      <div>
        <Link to="/" className="text-2xl font-bold text-white no-underline">SUMMS</Link>
      </div>
      <ul className="flex gap-5 list-none text-sm">
        <li><Link to="/" className="text-gray-300 hover:text-white no-underline transition-colors">Home</Link></li>
        <li><Link to="/vehicles" className="text-gray-300 hover:text-white no-underline transition-colors">Vehicles</Link></li>
        <li><Link to="/book" className="text-gray-300 hover:text-white no-underline transition-colors">Book</Link></li>
        <li><Link to="/bookings" className="text-gray-300 hover:text-white no-underline transition-colors">My Bookings</Link></li>
        <li><Link to="/parking" className="text-gray-300 hover:text-white no-underline transition-colors">Parking</Link></li>
        <li><Link to="/transit" className="text-gray-300 hover:text-white no-underline transition-colors">Transit</Link></li>
        <li><Link to="/map" className="text-gray-300 hover:text-white no-underline transition-colors">Map</Link></li>
        <li><Link to="/analytics" className="text-gray-300 hover:text-white no-underline transition-colors">Analytics</Link></li>
        {isProvider && (
          <li><Link to="/provider" className="text-amber-400 hover:text-amber-300 no-underline transition-colors font-medium">Provider</Link></li>
        )}
      </ul>
      <div className="flex items-center gap-3">
        {userRole && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_STYLES[userRole] || 'bg-gray-700 text-gray-300'}`}>
            {ROLE_LABELS[userRole] || userRole}
          </span>
        )}
        <span className="text-gray-400 text-sm truncate max-w-36">
          {currentUser?.displayName || currentUser?.email}
        </span>
        <button
          onClick={logout}
          className="text-sm text-gray-300 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
