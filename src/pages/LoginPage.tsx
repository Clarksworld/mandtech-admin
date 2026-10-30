import React, { useState } from 'react';
import { loginAdmin } from '../services/authService';
import { MandtechLogo } from '../components/Logo';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onSwitchToRegister: () => void;
}

export default function LoginPage({ onLoginSuccess, onSwitchToRegister }: LoginPageProps) {
  const [email, setEmail] = useState('admin2@mandtech.com.ng');
  const [password, setPassword] = useState('mandtech_admin_2024');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await loginAdmin(email, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('admin2@mandtech.com.ng');
    setPassword('mandtech_admin_2024');
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden font-body-md">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/25 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <MandtechLogo height={36} variant="dark" />
          </div>
          <h1 className="font-headline-md text-headline-md text-white tracking-tight text-2xl font-bold">
            Admin & Operations Gateway
          </h1>
          <p className="text-white/40 text-xs mt-1">
            Authorized Technical Operations & Asset Security Log
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 bg-error-container/20 border border-error/40 text-error text-xs rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-surface-variant uppercase tracking-wider mb-2">
              Staff Email Address
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg">
                mail
              </span>
              <input
                type="email"
                required
                placeholder="admin@mandtech.com.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-white/10 border border-outline-variant/40 rounded-lg text-sm text-white placeholder-secondary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-surface-variant uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg">
                lock
              </span>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-white/10 border border-outline-variant/40 rounded-lg text-sm text-white placeholder-secondary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          {/* Quick Demo Credentials */}
          <div className="flex justify-between items-center text-xs">
            <button
              type="button"
              onClick={handleDemoFill}
              className="text-primary hover:underline font-bold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">key</span> Use Demo Admin Credentials
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-on-primary font-bold rounded-lg hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                Authenticating with Backend API...
              </>
            ) : (
              <>
                <span>Sign In to Admin Portal</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Toggle to Register */}
        <div className="mt-8 pt-6 border-t border-outline-variant/20 text-center">
          <p className="text-xs text-secondary">
            Need new staff access credentials?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-primary font-bold hover:underline"
            >
              Register New Admin / Staff
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
