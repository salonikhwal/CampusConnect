import React from 'react';
import { NavLink } from 'react-router-dom';

const mobileNavItems = [
  { path: '/', label: 'Home', icon: 'cottage' },
  { path: '/community', label: 'Community', icon: 'forum' },
  { path: '/discover', label: 'Discover', icon: 'group' },
  { path: '/groups', label: 'Groups', icon: 'diversity_3' },
  { path: '/messages', label: 'Chat', icon: 'chat_bubble' },
];

export default function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/30 md:hidden px-2 py-1 flex items-center justify-around shadow-lg">
      {mobileNavItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive
                ? 'text-primary font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`
          }
        >
          <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
          <span className="text-[10px] font-heading font-medium mt-0.5">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
