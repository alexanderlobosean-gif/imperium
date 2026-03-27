import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';
import LandingLayout from '@/components/layout/LandingLayout';
import Dashboard from '@/pages/Dashboard';
import Wallet from '@/pages/Wallet';
import Plans from '@/pages/Plans';
import Network from '@/pages/Network';
import Career from '@/pages/Career';
import Profile from '@/pages/Profile';
import AdminPanel from '@/pages/admin/AdminPanel';
import AdminBanking from '@/components/admin/AdminBanking';
import Indicacao from '@/pages/Indicacao';
import Login from '@/pages/Login'
import Register from '@/pages/Register';
import LandingPage from '@/pages/LandingPage';
import Deposit from '@/pages/Deposit';
import Support from '@/pages/Support';
import HelpCenter from '@/pages/HelpCenter';
import Contact from '@/pages/Contact';

const AuthenticatedApp = () => {
  // For landing page, we don't need auth checks
  return (
    <Routes>
      <Route path="/" element={<LandingLayout><LandingPage /></LandingLayout>} />
      <Route path="/landing" element={<LandingLayout><LandingPage /></LandingLayout>} />
      <Route path="/support" element={<LandingLayout><Support /></LandingLayout>} />
      <Route path="/help-center" element={<LandingLayout><HelpCenter /></LandingLayout>} />
      <Route path="/contact" element={<LandingLayout><Contact /></LandingLayout>} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/deposit" element={<Deposit />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/network" element={<Network />} />
        <Route path="/indicacao" element={<Indicacao />} />
        <Route path="/career" element={<Career />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/banking" element={<AdminBanking />} />
        <Route path="/Dashboard" element={<Navigate to="/dashboard" replace />} />
      </Route>
      <Route path="/login" element={<LandingLayout><Login /></LandingLayout>} />
      <Route path="/register" element={<LandingLayout><Register /></LandingLayout>} />
      <Route path="/registrar" element={<LandingLayout><Register /></LandingLayout>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <AuthProvider>
          <AuthenticatedApp />
        </AuthProvider>
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App