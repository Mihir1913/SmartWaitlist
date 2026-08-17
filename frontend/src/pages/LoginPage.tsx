import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const roleRedirects: Record<string, string> = {
  superadmin: '/superadmin',
  owner: '/admin',
  staff: '/staff',
  kitchen: '/kitchen',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.login(email, password);
      login(token, user);
      navigate(roleRedirects[user.role] || '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-surface-900 text-white p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl">Smart Waitlist</span>
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight mb-4">
            Manage your queue.
            <br />
            Delight your guests.
          </h1>
          <p className="text-stone-400 text-lg max-w-md">
            Real-time table management, kitchen display, and analytics — all in one place.
          </p>
        </div>
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-400">4 Role-Based Portals</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="font-bold text-white">1. Owner Portal</div>
              <div className="text-[11px] text-stone-400 mt-0.5">Tables, Menu & Settings (/admin)</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="font-bold text-white">2. Table Seating Staff</div>
              <div className="text-[11px] text-stone-400 mt-0.5">Seat Guests & Assign Tables (/staff)</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="font-bold text-white">3. Kitchen Chef KDS</div>
              <div className="text-[11px] text-stone-400 mt-0.5">Live Cooking Stream (/kitchen)</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="font-bold text-white">4. Platform SuperAdmin</div>
              <div className="text-[11px] text-stone-400 mt-0.5">System Control Center (/superadmin)</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl">Smart Waitlist</span>
          </div>

          <h2 className="font-display text-2xl font-bold mb-2">Welcome back</h2>
          <p className="text-stone-500 mb-8">Sign in to your restaurant dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="email"
                  className="input pl-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@restaurant.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="password"
                  className="input pl-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>


          <Link to="/" className="block text-center text-sm text-stone-500 mt-6 hover:text-brand-600">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
