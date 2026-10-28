import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary animate-pulse shadow-sm">
        <span className="material-symbols-outlined text-[24px]">hub</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
      </div>
      <p className="font-heading text-label-md text-on-surface-variant font-medium">
        Connecting to Campus Commons...
      </p>
    </div>
  );
}

/**
 * Route guard that requires an authenticated user.
 * Redirects to /login if unauthenticated, or to /onboarding if profile is incomplete.
 */
export function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Guide new users to onboarding if not completed yet
  if (!currentUser.isOnboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return children ? children : <Outlet />;
}

/**
 * Route guard for guest-only pages (e.g. /login, /signup).
 * Redirects authenticated users to the home feed or onboarding.
 */
export function PublicOnlyRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (currentUser) {
    if (!currentUser.isOnboarded) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
}

/**
 * Route guard specifically for /onboarding.
 * Requires authentication, but allows access even if isOnboarded is false.
 */
export function OnboardingRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
}
