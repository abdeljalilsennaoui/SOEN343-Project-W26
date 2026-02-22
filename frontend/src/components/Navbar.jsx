import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="bg-slate-900 text-white flex items-center justify-between px-8 py-3">
      <div>
        <Link to="/" className="text-2xl font-bold text-white no-underline">SUMMS</Link>
      </div>
      <ul className="flex gap-6 list-none">
        <li><Link to="/" className="text-gray-300 hover:text-white no-underline transition-colors">Home</Link></li>
        <li><Link to="/vehicles" className="text-gray-300 hover:text-white no-underline transition-colors">Vehicles</Link></li>
        <li><Link to="/analytics" className="text-gray-300 hover:text-white no-underline transition-colors">Analytics</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;
