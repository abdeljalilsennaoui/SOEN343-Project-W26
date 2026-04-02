import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { MenuIcon } from 'lucide-react';

const NAV_ITEMS_BY_ROLE = {
  COMMUTER: [
    { to: '/', label: 'Home' },
    { to: '/book', label: 'Book' },
    { to: '/bookings', label: 'My Bookings' },
    { to: '/rideshare', label: 'Ride Share' },
    { to: '/map', label: 'Map' },
    { to: '/parking', label: 'Parking' },
    { to: '/transit', label: 'Transit' },
  ],
  MOBILITY_PROVIDER: [
    { to: '/', label: 'Home' },
    { to: '/provider', label: 'My Fleet' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/map', label: 'Map' },
  ],
  CITY_ADMINISTRATOR: [
    { to: '/', label: 'Home' },
    { to: '/vehicles', label: 'Vehicles' },
    { to: '/provider', label: 'Provider Mgmt' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/map', label: 'Map' },
    { to: '/parking', label: 'Parking' },
    { to: '/transit', label: 'Transit' },
  ],
  SYSTEM_ADMINISTRATOR: [
    { to: '/', label: 'Home' },
    { to: '/vehicles', label: 'Vehicles' },
    { to: '/book', label: 'Book' },
    { to: '/bookings', label: 'My Bookings' },
    { to: '/rideshare', label: 'Ride Share' },
    { to: '/map', label: 'Map' },
    { to: '/old-map', label: 'Old Map' },
    { to: '/parking', label: 'Parking' },
    { to: '/transit', label: 'Transit' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/provider', label: 'Provider' },
  ],
};

const ROLE_LABELS = {
  COMMUTER: 'Commuter',
  MOBILITY_PROVIDER: 'Provider',
  CITY_ADMINISTRATOR: 'City Admin',
  SYSTEM_ADMINISTRATOR: 'Admin',
};

const ROLE_STYLES = {
  COMMUTER: 'bg-blue-500/20 text-blue-300',
  MOBILITY_PROVIDER: 'bg-amber-500/20 text-amber-300',
  CITY_ADMINISTRATOR: 'bg-purple-500/20 text-purple-300',
  SYSTEM_ADMINISTRATOR: 'bg-red-500/20 text-red-300',
};

function Navbar() {
  const { currentUser, userRole, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = NAV_ITEMS_BY_ROLE[userRole] ?? NAV_ITEMS_BY_ROLE.COMMUTER;

  const getNavClassName = ({ isActive }) =>
    `block w-full rounded-md p-3 text-sm font-medium transition ${
      isActive
        ? 'bg-white text-slate-900'
        : 'text-slate-300 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-[#1e2330] bg-[#13161d]/90 px-4 py-3 text-white backdrop-blur-xl">
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
            className="hidden md:inline rounded-md border border-gray-500 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:border-gray-400 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </nav>
      {isOpen && (
        <div className="mt-3 md:hidden rounded-md border border-[#1e2330] bg-[#0d0f14] p-3 space-y-2">
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
          <div className="pt-3 border-t border-[#1e2330] text-sm text-gray-300">
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
            className="w-full mt-3 rounded-md border border-gray-500 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-gray-400 hover:text-white"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}

export default Navbar;