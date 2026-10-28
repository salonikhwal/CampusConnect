import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface antialiased flex flex-col">
      {/* Responsive Left Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Top Navbar */}
      <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      {/* Main Page Area */}
      <div className="md:pl-64 flex flex-col flex-1">
        <main className="w-full pt-16 pb-20 md:pb-8 flex-1">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Thumb Navigation */}
      <MobileBottomNav />
    </div>
  );
}
