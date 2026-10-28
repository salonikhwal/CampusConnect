import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNumber: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Client-side validations
    if (!formData.email.toLowerCase().endsWith('@mnit.ac.in')) {
      setErrorMsg('Only official @mnit.ac.in emails are permitted.');
      return;
    }

    if (formData.password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const res = await signup({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        rollNumber: formData.rollNumber.trim().toUpperCase(),
        password: formData.password,
      });

      if (res.success) {
        // Direct transition to onboarding step!
        navigate('/onboarding', { replace: true });
      } else {
        setErrorMsg(res.error || 'Registration failed. Please check your inputs.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-12">
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
            Quiet, low-pressure collaboration for MNIT Jaipur CSE students
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-outline-variant/30 p-space-lg">
          
          <div className="mb-6">
            <h2 className="font-heading text-headline-sm text-on-surface font-bold">
              Join the Commons
            </h2>
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              Instant registration using your verified college credentials
            </p>
          </div>

          {/* Instant Access Notice */}
          <div className="mb-5 p-3 rounded-xl bg-secondary/10 border border-secondary/20 flex items-start gap-2.5 text-secondary">
            <span className="material-symbols-outlined text-[20px] flex-shrink-0 mt-0.5">bolt</span>
            <p className="text-body-sm leading-snug">
              <strong>Instant Activation:</strong> Email verification is skipped for instant intranet access. Proceed directly to setup your peer profile.
            </p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-error/10 border border-error/20 flex items-start gap-2.5 text-error">
              <span className="material-symbols-outlined text-[20px] flex-shrink-0 mt-0.5">error</span>
              <p className="text-body-sm leading-snug">{errorMsg}</p>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Full Name */}
            <div>
              <label className="block font-heading text-label-md text-on-surface font-semibold mb-1">
                Full Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Diya Sharma"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-surface-container-low text-on-surface placeholder:text-outline/70 px-3 py-2.5 rounded-xl border border-outline-variant/30 text-body-sm focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans"
              />
            </div>

            {/* Roll Number */}
            <div>
              <label className="block font-heading text-label-md text-on-surface font-semibold mb-1">
                College Roll Number <span className="text-error">*</span>
              </label>
              <input
                type="text"
                name="rollNumber"
                required
                placeholder="e.g. 2024UCSE088"
                value={formData.rollNumber}
                onChange={handleChange}
                className="w-full bg-surface-container-low text-on-surface placeholder:text-outline/70 px-3 py-2.5 rounded-xl border border-outline-variant/30 text-body-sm uppercase font-mono focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block font-heading text-label-md text-on-surface font-semibold mb-1">
                Institute Email <span className="text-error">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="2024ucse088@mnit.ac.in"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-surface-container-low text-on-surface placeholder:text-outline/70 px-3 py-2.5 rounded-xl border border-outline-variant/30 text-body-sm focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans"
              />
              <span className="text-[11px] text-outline mt-1 block font-heading">
                Must end with <code className="font-mono bg-surface-container px-1 py-0.5 rounded text-primary">@mnit.ac.in</code>
              </span>
            </div>

            {/* Password */}
            <div>
              <label className="block font-heading text-label-md text-on-surface font-semibold mb-1">
                Password <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-surface-container-low text-on-surface placeholder:text-outline/70 pl-3 pr-10 py-2.5 rounded-xl border border-outline-variant/30 text-body-sm focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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

            {/* Confirm Password */}
            <div>
              <label className="block font-heading text-label-md text-on-surface font-semibold mb-1">
                Confirm Password <span className="text-error">*</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                required
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full bg-surface-container-low text-on-surface placeholder:text-outline/70 px-3 py-2.5 rounded-xl border border-outline-variant/30 text-body-sm focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-3 w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-heading font-semibold text-label-lg flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  <span>Continue to Onboarding</span>
                </>
              )}
            </button>
          </form>

        </div>

        {/* Bottom Switcher */}
        <div className="mt-6 text-center">
          <p className="text-body-sm text-on-surface-variant">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-heading font-semibold text-primary hover:underline hover:text-primary-container transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
