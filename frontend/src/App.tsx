import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import JoinPage from './pages/JoinPage';
import LoginPage from './pages/LoginPage';
import StaffPanel from './pages/StaffPanel';
import KitchenDisplay from './pages/KitchenDisplay';
import AdminDashboard from './pages/AdminDashboard';
import CustomerStatus from './pages/CustomerStatus';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: string[];
}) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/join/:slug" element={<JoinPage />} />
      <Route path="/status" element={<CustomerStatus />} />
      <Route path="/status/:entryId" element={<CustomerStatus />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/superadmin"
        element={
          <ProtectedRoute roles={['superadmin']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff"
        element={
          <ProtectedRoute roles={['staff', 'owner']}>
            <StaffPanel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kitchen"
        element={
          <ProtectedRoute roles={['kitchen', 'owner']}>
            <KitchenDisplay />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['owner']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
