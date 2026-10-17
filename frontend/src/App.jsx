import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DigitizationStudioPage from './pages/DigitizationStudioPage';
import MissingFieldsGatekeeperPage from './pages/MissingFieldsGatekeeperPage';
import FraudSimulatorPage from './pages/FraudSimulatorPage';
import SandboxSearchPage from './pages/SandboxSearchPage';
import AdminPanelPage from './pages/AdminPanelPage';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7F6] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-[#006A4E] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-[#65736C] mt-2">সেশন যাচাই করা হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'ADMIN') {
    return <Navigate to="/dashboard/digitization" replace />;
  }

  return children;
};

// Public Route (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard/digitization" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Authenticated Dashboard Shell */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard/digitization" replace />} />
            <Route path="digitization" element={<DigitizationStudioPage />} />
            <Route path="missing-fields" element={<MissingFieldsGatekeeperPage />} />
            <Route path="fraud-simulator" element={<FraudSimulatorPage />} />
            <Route path="sandbox" element={<SandboxSearchPage />} />
            <Route
              path="admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminPanelPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/dashboard/digitization" replace />} />
          <Route path="*" element={<Navigate to="/dashboard/digitization" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
