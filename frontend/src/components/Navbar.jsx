import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { currentUser, logout } = useAuth();

  return (
    <nav className="bg-slate-900 text-white flex items-center justify-between px-8 py-3">
      <div>
        <Link to="/" className="text-2xl font-bold text-white no-underline">SUMMS</Link>
      </div>
      <ul className="flex gap-6 list-none">
        <li><Link to="/" className="text-gray-300 hover:text-white no-underline transition-colors">Home</Link></li>
        <li><Link to="/vehicles" className="text-gray-300 hover:text-white no-underline transition-colors">Vehicles</Link></li>
        <li><Link to="/map" className="text-gray-300 hover:text-white no-underline transition-colors">Map</Link></li>
        <li><Link to="/analytics" className="text-gray-300 hover:text-white no-underline transition-colors">Analytics</Link></li>
      </ul>
      <div className="flex items-center gap-4">
        <span className="text-gray-400 text-sm truncate max-w-48">
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
