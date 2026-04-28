import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ImpersonationBanner from '@/components/admin/ImpersonationBanner';
import { impersonation } from '@/lib/impersonation';

export default function AppLayout() {
  const impersonatedUser = impersonation.get();

  return (
    <div className="flex min-h-screen bg-background animated-bg">
      {impersonatedUser && (
        <ImpersonationBanner
          impersonatedUser={impersonatedUser}
          onExit={() => impersonation.stop()}
        />
      )}
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 relative z-10">
          <div className={`p-4 lg:p-8 max-w-7xl mx-auto ${impersonatedUser ? 'pt-4' : 'pt-4'}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}