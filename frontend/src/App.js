import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import TemplatePreview from './pages/TemplatePreview';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PublicPage from './pages/PublicPage';
import Dashboard from './pages/Dashboard';
import EditLink from './pages/EditLink';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import Analytics from './pages/Analytics';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Onboarding />} />
      <Route path="/register-old" element={<Register />} />
      <Route path="/preview/:templateId" element={<TemplatePreview />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected Routes for any authenticated user */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit/:username"
        element={
          <ProtectedRoute>
            <EditLink />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics/:username"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />

      {/* Admin/Secret Room - Only for Owner */}
      <Route
        path="/secretroom"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/404" element={<NotFound />} />
      <Route path="/:username" element={<PublicPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

function GoogleWrapper({ children }) {
  if (!GOOGLE_CLIENT_ID) return children;
  return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider>;
}

function App() {
  return (
    <GoogleWrapper>
      <BrowserRouter>
        <AppRouter />
        <Toaster
          position="bottom-center"
          expand={false}
          richColors={false}
          toastOptions={{
            duration: 3000,
            unstyled: false,
            style: {
              background: '#111111',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '13px 18px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            },
          }}
        />
      </BrowserRouter>
    </GoogleWrapper>
  );
}

export default App;