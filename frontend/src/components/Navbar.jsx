import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/vehicles', label: 'Vehicles' },
  { to: '/map', label: 'Map' },
  { to: '/old-map', label: 'Old Map' },
  { to: '/analytics', label: 'Analytics' },
];

function Navbar() {
  const { currentUser, logout } = useAuth();

  const getNavClassName = ({ isActive }) =>
    `inline-flex w-full justify-center no-underline rounded-md p-3 text-center text-sm font-medium transition-all ${
      isActive
        ? 'bg-white text-slate-900 shadow-sm'
        : 'text-slate-300 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-white/15 bg-slate-950/90 px-5 py-3 text-white shadow-[0_10px_35px_rgba(2,6,23,0.35)] backdrop-blur-xl md:px-8">
      <nav className="mx-auto flex w-full items-center justify-between gap-4">
        <Link to="/" className="no-underline">
          <span className="inline-flex items-center rounded-md border border-white/20 bg-white/5 px-4 py-1.5 text-xl font-semibold tracking-tight text-white transition hover:bg-white/10">
            CityFlow
          </span>
        </Link>

        <ul className="hidden list-none items-center rounded-md border border-white/15 bg-white/5 px-0 md:flex">
          {navItems.map((item) => (
            <li key={item.to} className="w-28">
              <NavLink to={item.to} end={item.to === '/'} className={getNavClassName}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <span className="max-w-48 truncate rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-300 md:text-sm">
          {currentUser?.displayName || currentUser?.email}
        </span>
        <button
          onClick={logout}
          className="rounded-md border border-white/20 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-white/40 hover:bg-white/10 hover:text-white md:text-sm"
        >
          Sign out
        </button>
      </div>
      </nav>
    </header>
  );
}

export default Navbar;
