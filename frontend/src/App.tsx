import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { api } from './lib/api';
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

function DemoBar() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return null;

  return (
    <div className="bg-stone-900 border-b border-stone-800 px-4 py-1.5 text-xs text-stone-300 flex items-center justify-between sticky top-0 z-50 shadow-md">
      <div className="flex items-center gap-2 font-mono">
        <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
        <span className="font-bold text-orange-400">Client Demo Bar:</span>
        <span className="text-stone-400">Logged in as {user?.role} ({user?.name})</span>
      </div>

      <div className="flex items-center gap-2 font-semibold">
        <button
          onClick={async () => {
            try {
              await api.seedDemoSimulation();
              alert('🚀 Live Demo Simulation Loaded! 5 Queue Entries & 2 Kitchen Orders Created.');
              window.location.reload();
            } catch (err) {
              alert('Failed to launch demo simulation');
            }
          }}
          className="px-3 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-stone-950 font-extrabold transition flex items-center gap-1 shadow active:scale-95"
          title="Populate 5 queue entries, 3 table statuses, and 2 kitchen orders"
        >
          🚀 Launch Demo Data
        </button>
        <Link to="/admin" className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition">
          👑 Admin
        </Link>
        <Link to="/staff" className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition">
          📋 Staff Panel
        </Link>
        <Link to="/kitchen" className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition">
          🍳 Kitchen KDS
        </Link>
        <Link to="/join/spice-garden" className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-stone-950 font-bold transition">
          📱 Customer View
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <DemoBar />
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
    </>
  );
}
