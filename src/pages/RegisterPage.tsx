import React, { useState } from 'react';
import { createAdmin } from '../services/authService';

interface RegisterPageProps {
  onRegisterSuccess: () => void;
  onSwitchToLogin: () => void;
}

export default function RegisterPage({ onRegisterSuccess, onSwitchToLogin }: RegisterPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createAdmin(email, password, role);
      onRegisterSuccess();
    } catch (err: any) {
      setError(err.message || 'Could not register user. User may already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-deep-charcoal text-surface-white flex items-center justify-center p-6 relative overflow-hidden font-body-md">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-surface-white/5 border border-outline-variant/30 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary-container/20 border border-primary-container text-primary rounded-xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <span className="material-symbols-outlined text-3xl">person_add</span>
          </div>
          <h1 className="font-headline-md text-headline-md text-white tracking-tight text-2xl font-bold">
            Staff & Admin Registration
          </h1>
          <p className="text-surface-variant text-xs mt-1">
            Provision new credentials on Mandtech REST API
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 bg-error-container/20 border border-error/40 text-error text-xs rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-surface-variant uppercase tracking-wider mb-1.5">
              Work Email Address
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg">
                mail
              </span>
              <input
                type="email"
                required
                placeholder="engineer@mandtech.com.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-white/10 border border-outline-variant/40 rounded-lg text-sm text-white placeholder-secondary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-surface-variant uppercase tracking-wider mb-1.5">
              Role Permission
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  role === 'admin'
                    ? 'bg-primary border-primary text-on-primary'
                    : 'bg-surface-white/5 border-outline-variant/40 text-surface-variant hover:bg-surface-white/10'
                }`}
              >
                <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                System Admin
              </button>
              <button
                type="button"
                onClick={() => setRole('staff')}
                className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  role === 'staff'
                    ? 'bg-primary border-primary text-on-primary'
                    : 'bg-surface-white/5 border-outline-variant/40 text-surface-variant hover:bg-surface-white/10'
                }`}
              >
                <span className="material-symbols-outlined text-base">engineering</span>
                Field Staff
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-surface-variant uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg">
                lock
              </span>
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-white/10 border border-outline-variant/40 rounded-lg text-sm text-white placeholder-secondary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-surface-variant uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg">
                lock_reset
              </span>
              <input
                type="password"
                required
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-white/10 border border-outline-variant/40 rounded-lg text-sm text-white placeholder-secondary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-primary text-on-primary font-bold rounded-lg hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                Registering with API...
              </>
            ) : (
              <>
                <span>Create Admin Account</span>
                <span className="material-symbols-outlined text-lg">how_to_reg</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Toggle to Login */}
        <div className="mt-6 pt-5 border-t border-outline-variant/20 text-center">
          <p className="text-xs text-secondary">
            Already have admin credentials?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-primary font-bold hover:underline"
            >
              Sign In Instead
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
