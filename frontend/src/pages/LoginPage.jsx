import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        if (!res.user.isOnboarded) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      } else {
        setErrorMsg(res.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail('2023ucse042@mnit.ac.in');
    setPassword('StrongPassword123');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-12">
      {/* Container */}
      <div className="w-full max-w-md">
        
        {/* Department Logo & Title */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-on-primary shadow-sm mb-3">
            <span className="material-symbols-outlined text-[28px]">hub</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-heading text-headline-md text-on-surface font-bold tracking-tight">
              CampusConnect
            </h1>
            <span className="bg-primary-fixed text-on-primary-fixed-variant text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-heading">
              MNIT CSE
            </span>
          </div>
          <p className="text-body-md text-on-surface-variant max-w-xs">
            Digital Commons for Computer Science &amp; Engineering students at MNIT Jaipur
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-outline-variant/30 p-space-lg">
          
          <div className="mb-6">
            <h2 className="font-heading text-headline-sm text-on-surface font-bold">
              Sign In to Your Commons
            </h2>
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              Enter your official department credentials to proceed
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-error/10 border border-error/20 flex items-start gap-2.5 text-error">
              <span className="material-symbols-outlined text-[20px] flex-shrink-0 mt-0.5">error</span>
              <p className="text-body-sm leading-snug">{errorMsg}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Email Field */}
            <div>
              <label className="block font-heading text-label-md text-on-surface font-semibold mb-1">
                Institute Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                  alternate_email
                </span>
                <input
                  type="email"
                  required
                  placeholder="2023ucse042@mnit.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface placeholder:text-outline/70 pl-10 pr-3 py-2.5 rounded-xl border border-outline-variant/30 text-body-sm focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans"
                />
              </div>
              <p className="text-[11px] text-on-surface-variant/80 mt-1 flex items-center gap-1 font-heading">
                <span className="material-symbols-outlined text-[13px] text-secondary">verified</span>
                Must end in <code className="font-mono font-medium text-primary bg-primary-fixed/50 px-1 rounded">@mnit.ac.in</code>
              </p>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-heading text-label-md text-on-surface font-semibold">
                  Password
                </label>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface placeholder:text-outline/70 pl-10 pr-10 py-2.5 rounded-xl border border-outline-variant/30 text-body-sm focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors p-1"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-heading font-semibold text-label-lg flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  <span>Sign In to Commons</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Shortcut */}
          <div className="mt-4 pt-3 border-t border-surface-container/60 flex items-center justify-between">
            <span className="text-[12px] text-on-surface-variant font-medium font-heading">
              Need a test login?
            </span>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-[12px] font-heading font-semibold text-primary hover:text-primary-container transition-colors"
            >
              Autofill Aarav (2023UCSE042)
            </button>
          </div>

        </div>

        {/* Bottom Switcher */}
        <div className="mt-6 text-center">
          <p className="text-body-sm text-on-surface-variant">
            New to MNIT CSE?{' '}
            <Link
              to="/signup"
              className="font-heading font-semibold text-primary hover:underline hover:text-primary-container transition-colors"
            >
              Create your student account
            </Link>
          </p>
        </div>

        {/* Security Footer Notice */}
        <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-outline font-heading">
          <span className="material-symbols-outlined text-[14px] text-secondary">security</span>
          <span>Bcrypt hashed • Secure HTTP-only JWT • Rate limited</span>
        </div>

      </div>
    </div>
  );
}
