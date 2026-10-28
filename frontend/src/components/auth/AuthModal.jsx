import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNumber: '',
    password: '',
    hostel: 'Hostel 4 Kaveri',
    roomNo: '',
    labGroup: 'CC-03',
  });

  if (!isOpen) return null;

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
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(formData.email, formData.password);
        if (res.success) {
          onClose();
        } else {
          setErrorMsg(res.error || 'Login failed');
        }
      } else {
        const res = await signup(formData);
        if (res.success) {
          onClose();
        } else {
          setErrorMsg(res.error || 'Signup failed');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/30 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-surface-container/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
            </div>
            <div>
              <h2 className="font-heading text-headline-sm text-on-surface font-bold">
                {mode === 'login' ? 'Student Sign In' : 'Join CampusConnect'}
              </h2>
              <p className="text-body-sm text-on-surface-variant">
                MNIT Jaipur CSE Digital Commons
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-surface-container/60 bg-surface-container-low/40">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 font-heading text-label-md font-semibold text-center transition-colors border-b-2 ${
              mode === 'login'
                ? 'border-primary text-primary bg-surface-container-lowest'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 font-heading text-label-md font-semibold text-center transition-colors border-b-2 ${
              mode === 'signup'
                ? 'border-primary text-primary bg-surface-container-lowest'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-error/10 border border-error/20 flex items-start gap-2 text-error">
            <span className="material-symbols-outlined text-[18px] flex-shrink-0 mt-0.5">error</span>
            <p className="text-body-sm leading-snug">{errorMsg}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block font-heading text-label-sm text-on-surface font-medium mb-1">
                  Full Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-xl border border-outline-variant/30 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-heading text-label-sm text-on-surface font-medium mb-1">
                  College Roll Number <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="rollNumber"
                  required
                  placeholder="e.g. 2023UCSE042"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-xl border border-outline-variant/30 text-body-sm uppercase font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </>
          )}

          <div>
            <label className="block font-heading text-label-sm text-on-surface font-medium mb-1">
              Institute Email <span className="text-error">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="e.g. 2023ucse042@mnit.ac.in"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-xl border border-outline-variant/30 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
            <span className="text-[11px] text-outline mt-1 block">
              Must end with <code className="font-mono bg-surface-container px-1 py-0.5 rounded text-primary">@mnit.ac.in</code>
            </span>
          </div>

          <div>
            <label className="block font-heading text-label-sm text-on-surface font-medium mb-1">
              Password <span className="text-error">*</span>
            </label>
            <input
              type="password"
              name="password"
              required
              placeholder={mode === 'signup' ? 'Min 8 characters' : 'Enter password'}
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-xl border border-outline-variant/30 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-heading text-label-sm text-on-surface font-medium mb-1">
                  Hostel &amp; Room
                </label>
                <input
                  type="text"
                  name="hostel"
                  placeholder="Hostel 4 Kaveri 218"
                  value={formData.hostel}
                  onChange={handleChange}
                  className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-xl border border-outline-variant/30 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block font-heading text-label-sm text-on-surface font-medium mb-1">
                  Lab Group
                </label>
                <input
                  type="text"
                  name="labGroup"
                  placeholder="CC-03"
                  value={formData.labGroup}
                  onChange={handleChange}
                  className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-xl border border-outline-variant/30 text-body-sm uppercase focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-heading font-semibold text-label-md flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    {mode === 'login' ? 'login' : 'how_to_reg'}
                  </span>
                  <span>{mode === 'login' ? 'Sign In with Institute ID' : 'Create Student Account'}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Security badge footer */}
        <div className="px-6 py-3 bg-surface-container-low border-t border-surface-container/60 flex items-center justify-center gap-1.5 text-[11px] text-outline font-heading">
          <span className="material-symbols-outlined text-[14px] text-secondary">lock</span>
          <span>Bcrypt hashed &amp; protected by HTTP-only secure cookie</span>
        </div>
      </div>
    </div>
  );
}
