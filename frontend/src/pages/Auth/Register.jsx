import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { registerUser } from '@/services/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function getErrorMessage(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    default:
      return 'Something went wrong. Please try again.';
  }
}


function Register() {
  const { register, refreshRole } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'COMMUTER',  // default; options: COMMUTER | MOBILITY_PROVIDER
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleRoleChange(value) {
    setFormData((prev) => ({ ...prev, role: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      toast.error('Passwords do not match.', {
        description: 'Please make sure your passwords match.',
        action: {
          label: 'Close',
          onClick: () => toast.dismiss(),
        },
      });
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      toast.error('Password must be at least 6 characters.', {
        description: 'Please make sure your password is at least 6 characters.',
        action: {
          label: 'Close',
          onClick: () => toast.dismiss(),
        },
      });
      return;
    }
    setLoading(true);
    try {
      await register(formData.email, formData.password);
      // Create the Firestore user doc with the chosen role before any
      // other API call can trigger auto-provisioning as COMMUTER.
      await registerUser(formData.role);
      // Re-fetch the role so Navbar and guards reflect the correct role immediately.
      await refreshRole();
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err.code));
      toast.error(getErrorMessage(err.code), {
        description: err.message,
        action: {
          label: 'Close',
          onClick: () => toast.dismiss(),
        },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
      <p className="text-gray-600 mb-3">
        Sign up to access the application.
      </p>

      <p className="text-gray-600 text-xs mb-6">
        Already have an account?{' '}
        <Link to="/login" className="ml-1 text-gray-900 text-sm font-medium underline hover:no-underline">
          Sign in
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Smith"
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black-500/50 focus:border-black-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john.smith@example.com"
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black-500/50 focus:border-black-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
              required
              className={`w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black-500/50 focus:border-black-500 ${error ? 'border-red-500' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
              required
              className={`w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black-500/50 focus:border-black-500 ${error ? 'border-red-500' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1.5">
            I am a…
          </label>
          <Select value={formData.role} onValueChange={handleRoleChange}>
            <SelectTrigger id="role" className="w-full px-4 py-2.5 border-gray-300 rounded-md text-gray-900 bg-white focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:border-black">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="COMMUTER">Commuter — I want to book rides</SelectItem>
              <SelectItem value="MOBILITY_PROVIDER">Mobility Provider — I manage vehicles</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-black text-white font-semibold rounded-md hover:from-black-500 hover:to-black-700 transition-all shadow-sm disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

    </>
  );
}
export default Register;
