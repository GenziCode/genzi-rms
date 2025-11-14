import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import DashboardPage from '@/pages/DashboardPage';
import ReportsPage from '@/pages/ReportsPage';
import ReportsAnalyticsPage from '@/pages/ReportsAnalyticsPage';
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
import RolesPermissionsPage from '@/pages/RolesPermissionsPage';
import ReportTemplatesPage from '@/pages/ReportTemplatesPage';
import DailySalesReport from '@/pages/reports/DailySalesReport';
import WeeklySalesReport from '@/pages/reports/WeeklySalesReport';
import MonthlySalesReport from '@/pages/reports/MonthlySalesReport';
import SalesByProductReport from '@/pages/reports/SalesByProductReport';
import SalesByCategoryReport from '@/pages/reports/SalesByCategoryReport';
import SalesByStoreReport from '@/pages/reports/SalesByStoreReport';
import SalesByEmployeeReport from '@/pages/reports/SalesByEmployeeReport';
import SalesByCustomerReport from '@/pages/reports/SalesByCustomerReport';
import SalesComparisonReport from '@/pages/reports/SalesComparisonReport';
import TopSellingProductsReport from '@/pages/reports/TopSellingProductsReport';
import BottomSellingProductsReport from '@/pages/reports/BottomSellingProductsReport';
import SalesTrendAnalysisReport from '@/pages/reports/SalesTrendAnalysisReport';
import DiscountAnalysisReport from '@/pages/reports/DiscountAnalysisReport';
import ReturnRefundReport from '@/pages/reports/ReturnRefundReport';
import SalesForecastReport from '@/pages/reports/SalesForecastReport';
import CurrentStockReport from '@/pages/reports/CurrentStockReport';
import LowStockAlertReport from '@/pages/reports/LowStockAlertReport';
import OverstockReport from '@/pages/reports/OverstockReport';
import StockMovementReport from '@/pages/reports/StockMovementReport';
import StockValuationReport from '@/pages/reports/StockValuationReport';
import ReportDashboardPage from '@/pages/ReportDashboardPage';
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
                <Route path="/roles-permissions" element={<RolesPermissionsPage />} />
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
                <Route path="/reports-analytics" element={<ReportsAnalyticsPage />} />
                <Route path="/reports/dashboard/:reportType" element={<ReportDashboardPage />} />
                <Route path="/reports/daily-sales" element={<DailySalesReport />} />
                <Route path="/reports/weekly-sales" element={<WeeklySalesReport />} />
                <Route path="/reports/monthly-sales" element={<MonthlySalesReport />} />
                <Route path="/reports/sales-by-product" element={<SalesByProductReport />} />
                <Route path="/reports/sales-by-category" element={<SalesByCategoryReport />} />
                <Route path="/reports/sales-by-store" element={<SalesByStoreReport />} />
                <Route path="/reports/sales-by-employee" element={<SalesByEmployeeReport />} />
                <Route path="/reports/sales-by-customer" element={<SalesByCustomerReport />} />
                <Route path="/reports/sales-comparison" element={<SalesComparisonReport />} />
                <Route path="/reports/top-selling-products" element={<TopSellingProductsReport />} />
                <Route path="/reports/bottom-selling-products" element={<BottomSellingProductsReport />} />
                <Route path="/reports/sales-trend-analysis" element={<SalesTrendAnalysisReport />} />
                <Route path="/reports/discount-analysis" element={<DiscountAnalysisReport />} />
                <Route path="/reports/return-refund" element={<ReturnRefundReport />} />
                <Route path="/reports/sales-forecast" element={<SalesForecastReport />} />
                <Route path="/reports/current-stock" element={<CurrentStockReport />} />
                <Route path="/reports/low-stock" element={<LowStockAlertReport />} />
                <Route path="/reports/overstock" element={<OverstockReport />} />
                <Route path="/reports/stock-movement" element={<StockMovementReport />} />
                <Route path="/reports/stock-valuation" element={<StockValuationReport />} />
                <Route path="/report-templates" element={<ReportTemplatesPage />} />
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
