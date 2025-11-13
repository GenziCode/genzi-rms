import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import DashboardPage from '@/pages/DashboardPageEnhanced';
import ReportsPage from '@/pages/ReportsPage';
import ProductsPage from '@/pages/ProductsPage';
import CategoriesPage from '@/pages/CategoriesPage';
import POSPage from '@/pages/POSPage';
import InventoryPage from '@/pages/InventoryPage';
import CustomersPage from '@/pages/CustomersPage';
import VendorsPage from '@/pages/VendorsPage';
import PurchaseOrdersPage from '@/pages/PurchaseOrdersPage';
import UsersPage from '@/pages/UsersPage';
import SettingsPage from '@/pages/SettingsPage';
import InvoicesPage from '@/pages/InvoicesPage';
import PaymentsPage from '@/pages/PaymentsPage';
import AuditLogsPage from '@/pages/AuditLogsPage';
import UserProfilePage from '@/pages/UserProfilePage';
import WebhooksPage from '@/pages/WebhooksPage';
import NotificationsPage from '@/pages/NotificationsPage';
import SalesHistoryPage from '@/pages/SalesHistoryPage';
import ExportPage from '@/pages/ExportPage';
import TenantOpsPage from '@/pages/TenantOpsPage';
import SyncCenterPage from '@/pages/SyncCenterPage';
import MainLayout from '@/components/layout/MainLayout';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { accessToken } = useAuthStore();

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { accessToken } = useAuthStore();

  if (accessToken) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
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
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/pos" element={<POSPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/vendors" element={<VendorsPage />} />
                <Route
                  path="/purchase-orders"
                  element={<PurchaseOrdersPage />}
                />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/audit-logs" element={<AuditLogsPage />} />
                <Route path="/profile" element={<UserProfilePage />} />
                <Route path="/webhooks" element={<WebhooksPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/tenant-ops" element={<TenantOpsPage />} />
                <Route path="/sync-center" element={<SyncCenterPage />} />
                <Route path="/sales-history" element={<SalesHistoryPage />} />
                <Route path="/export" element={<ExportPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
                {/* Add more routes here as we build them */}
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
