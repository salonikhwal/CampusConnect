import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../auth/AuthModal';

const navItems = [
  { path: '/', label: 'Home', icon: 'cottage' },
  { path: '/community', label: 'Community', icon: 'forum' },
  { path: '/discover', label: 'Discover People', icon: 'group' },
  { path: '/groups', label: 'Groups', icon: 'diversity_3' },
  { path: '/seniors', label: 'Seniors & Guidance', icon: 'school' },
  { path: '/opportunities', label: 'Opportunities', icon: 'work_outline' },
  { path: '/messages', label: 'Messages', icon: 'chat_bubble' },
  { path: '/profile', label: 'My Profile', icon: 'account_circle' },
];

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Helper for initials
  const getInitials = (name) => {
    if (!name) return 'CC';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-on-surface/30 backdrop-blur-xs z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between p-space-md transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-space-md">
          {/* Logo & Header */}
          <div className="flex items-center justify-between px-space-xs py-space-xs">
            <div className="flex items-center gap-space-sm cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">hub</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-space-xs">
                  <span className="font-heading text-headline-sm text-on-surface font-bold tracking-tight">
                    CampusConnect
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="bg-primary-fixed text-on-primary-fixed-variant text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider font-heading">
                    MNIT CSE
                  </span>
                  <span className="text-[11px] text-on-surface-variant font-medium">
                    Jaipur Campus
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container md:hidden"
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Department Space Divider */}
          <div className="px-space-xs pt-1 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-outline uppercase font-heading">
              DEPARTMENT SPACE
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-secondary-container animate-pulse" title="Intranet active" />
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-space-sm px-space-md py-space-sm rounded-xl font-heading text-label-lg transition-all ${
                    isActive
                      ? 'bg-primary-fixed text-on-primary-fixed font-semibold shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Current Student Profile Pill / Auth Button */}
        <div className="border-t border-surface-container/60 pt-space-sm">
          {currentUser ? (
            <div className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors group">
              <div 
                onClick={() => {
                  navigate('/profile');
                  if (onClose) onClose();
                }}
                className="flex items-center gap-space-sm min-w-0 flex-1 cursor-pointer"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold font-heading text-sm">
                    {getInitials(currentUser.name)}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-secondary-container rounded-full ring-2 ring-surface-container-lowest" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-heading text-label-lg text-on-surface font-semibold truncate group-hover:text-primary transition-colors">
                    {currentUser.name}
                  </span>
                  <span className="text-label-sm text-on-surface-variant truncate font-heading">
                    {currentUser.rollNumber} {currentUser.roomNo ? `• ${currentUser.roomNo}` : ''}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-surface-container-high transition-colors ml-1"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-heading font-semibold text-label-md transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">lock_open</span>
              <span>Sign In with MNIT ID</span>
            </button>
          )}
        </div>
      </aside>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}
