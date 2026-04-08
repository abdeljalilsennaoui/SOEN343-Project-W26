import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

function getErrorMessage(code) {
  switch (code) {
    case 'auth/user-not-found':
      return 'User not found.';
    case 'auth/wrong-password':
      return 'Wrong password.';
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      toast.error(getErrorMessage(err.code), {
        description: err.message,
        action: {
          label: 'Close',
          onClick: () => toast.dismiss(),
        },
      });
    
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2 className="text-xl font-bold text-gray-900">Welcome back on CityFlow!</h2>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Connect to your account</h1>
      <p className="text-gray-600 mb-1">
        Sign in to access your application.
      </p>

      <p className="text-gray-600 text-xs mb-6">
        You don&apos;t have an account yet?{' '}
        <Link to="/register" className="ml-1 text-gray-900 text-sm font-medium underline hover:no-underline">
          Create an account
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className={`block text-sm font-medium text-gray-700 mb-1.5 ${error ? 'text-red-700' : ''}`}>
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john.smith@example.com"
            required
            className={`w-full px-4 py-2.5 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black-500/50 focus:border-black-500 ${error ? 'border-red-500' : ''}`}
          />
        </div>

        <div>
          <label htmlFor="password" className={`block text-sm font-medium text-gray-700 mb-1.5 ${error ? 'text-red-700' : ''}`}>
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              required
              minLength={8}
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

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-black text-white font-semibold rounded-md hover:from-black-500 hover:to-black-700 transition-all shadow-sm disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="text-center">
          <button type="button" className="text-gray-900 text-sm font-medium underline hover:no-underline">
            Forgot password?
          </button>
        </div>
      </form>

    </>
  );
}
export default Login;
