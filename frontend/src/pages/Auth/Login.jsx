import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    toast.success('Login successful', {
      description: 'You are now logged in',
      action: {
        label: 'Close',
        onClick: () => toast.dismiss(),
      },
    });
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
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              required
              minLength={8}
              className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black-500/50 focus:border-black-500"
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
          className="w-full py-3 px-4 bg-black text-white font-semibold rounded-md hover:from-black-500 hover:to-black-700 transition-all shadow-sm"
        >
          Sign in
        </button>

        <div className="text-center">
          <button type="button" className="text-gray-900 text-sm font-medium underline hover:no-underline">
            Forgot password?
          </button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-sm text-gray-500">or</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 rounded-md bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 rounded-md bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#F25022" d="M1 1h10v10H1z" />
              <path fill="#00A4EF" d="M1 13h10v10H1z" />
              <path fill="#7FBA00" d="M13 1h10v10H13z" />
              <path fill="#FFB900" d="M13 13h10v10H13z" />
            </svg>
            Continue with Microsoft
          </button>
        </div>
      </div>
    </>
  );
}

export default Login;
