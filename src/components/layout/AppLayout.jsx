import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
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
      <main className="flex-1 min-h-screen relative z-10">
        <div className={`p-4 lg:p-8 max-w-7xl mx-auto ${impersonatedUser ? 'pt-20 lg:pt-16' : 'pt-16 lg:pt-8'}`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}