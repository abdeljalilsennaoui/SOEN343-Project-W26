import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { MenuIcon } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/vehicles', label: 'Vehicles' },
  { to: '/book', label: 'Book' },
  { to: '/bookings', label: 'My Bookings' },
  { to: '/map', label: 'Map' },
  { to: '/old-map', label: 'Old Map' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/parking', label: 'Parking' },
  { to: '/transit', label: 'Transit' },
];

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
  const [isOpen, setIsOpen] = useState(false);

  const isProvider =
    userRole === 'MOBILITY_PROVIDER' ||
    userRole === 'CITY_ADMINISTRATOR' ||
    userRole === 'SYSTEM_ADMINISTRATOR';

  const getNavClassName = ({ isActive }) =>
    `block w-full rounded-md p-3 text-sm font-medium transition ${
      isActive
        ? 'bg-white text-slate-900'
        : 'text-slate-300 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-white/15 bg-slate-950/90 px-4 py-3 text-white backdrop-blur-xl">
      <nav className="flex items-center justify-between">
        <Link to="/" className="text-xl font-semibold">
          CityFlow
        </Link>
        <ul className="hidden md:flex items-center gap-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} className={getNavClassName}>
                {item.label}
              </NavLink>
            </li>
          ))}
          {isProvider && (
            <li>
              <NavLink to="/provider" className={getNavClassName}>
                Provider
              </NavLink>
            </li>
          )}
        </ul>
        <div className="flex items-center gap-2">
          {userRole && (
            <span
              className={`hidden md:inline text-xs px-2 py-0.5 rounded-full font-medium ${
                ROLE_STYLES[userRole] || 'bg-gray-700 text-gray-300'
              }`}
            >
              {ROLE_LABELS[userRole] || userRole}
            </span>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-md hover:bg-white/10"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <button
            onClick={logout}
            className="hidden md:inline rounded-md border border-white/20 px-3 py-1 text-xs"
          >
            Sign out
          </button>
        </div>
      </nav>
      {isOpen && (
        <div className="mt-3 md:hidden rounded-md border border-white/10 bg-slate-900 p-3 space-y-2">

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={getNavClassName}
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}

          {isProvider && (
            <NavLink
              to="/provider"
              className={getNavClassName}
              onClick={() => setIsOpen(false)}
            >
              Provider
            </NavLink>
          )}
          <div className="pt-3 border-t border-white/10 text-sm text-slate-300">
            {currentUser?.displayName || currentUser?.email}
          </div>
          {userRole && (
            <span
              className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                ROLE_STYLES[userRole] || 'bg-gray-700 text-gray-300'
              }`}
            >
              {ROLE_LABELS[userRole]}
            </span>
          )}
          <button
            onClick={logout}
            className="w-full mt-3 rounded-md border border-white/20 px-3 py-2 text-sm"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}

export default Navbar;