import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Wallet from '@/pages/Wallet';
import Plans from '@/pages/Plans';
import Network from '@/pages/Network';
import Career from '@/pages/Career';
import Profile from '@/pages/Profile';
import AdminPanel from '@/pages/admin/AdminPanel';
import Indicacao from '@/pages/Indicacao';
import Register from '@/pages/Register';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      const path = window.location.pathname.toLowerCase().replace(/^\//, '');
      const search = window.location.search;

      // Fix Google Translate URL mangling: ref__ -> ref
      const params = new URLSearchParams(search);
      const ref = params.get('ref') || params.get('ref__') || params.get('ref_');

      // Handle /registrar (Google Translate of /register)
      if (path === 'registrar' || path.startsWith('registrar')) {
        const dest = ref ? `/register?ref=${ref}` : '/register';
        window.location.replace(dest);
        return null;
      }

      // Allow /register page without authentication
      if (path === 'register' || path.startsWith('register')) {
        return (
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/registrar" element={<Register />} />
            <Route path="*" element={<Register />} />
          </Routes>
        );
      }
      // Check if there's a ref param on the root URL — redirect to /register
      const rootParams = new URLSearchParams(window.location.search);
      const rootRef = rootParams.get('ref') || rootParams.get('ref__') || rootParams.get('ref_');
      if (rootRef) {
        window.location.replace('/register?ref=' + rootRef);
        return null;
      }

      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/Dashboard" element={<Navigate to="/" replace />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/network" element={<Network />} />
        <Route path="/indicacao" element={<Indicacao />} />
        <Route path="/career" element={<Career />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Route>
      <Route path="/register" element={<Register />} />
      <Route path="/registrar" element={<Register />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App