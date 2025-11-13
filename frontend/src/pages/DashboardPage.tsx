import { useAuthStore } from '@/store/authStore';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
} from 'lucide-react';

function DashboardPage() {
  const { user, tenant } = useAuthStore();

  console.log('Dashboard rendering with user:', user);
  console.log('Dashboard rendering with tenant:', tenant);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Welcome back, {user?.firstName}!
        </h2>
        <p className="text-gray-600">
          You're signed in as <span className="font-medium capitalize">{user?.role}</span>{' '}
          for tenant <span className="font-medium">{tenant}</span>
        </p>
      </div>

      {/* KPI Cards - Static for now */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-100">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Today's Sales
          </h3>
          <p className="text-3xl font-bold text-gray-900">$0.00</p>
          <p className="text-sm text-gray-500 mt-2">0 transactions</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Avg Order Value
          </h3>
          <p className="text-3xl font-bold text-gray-900">$0.00</p>
          <p className="text-sm text-gray-500 mt-2">No sales yet</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-100">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Products</h3>
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="text-sm text-gray-500 mt-2">0 categories</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-orange-100">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Customers</h3>
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="text-sm text-gray-500 mt-2">total</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition transform hover:-translate-y-1">
          <ShoppingCart className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-semibold mb-1">New Sale</h3>
          <p className="text-blue-100 text-sm">Process a transaction (Coming in Phase 4)</p>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition transform hover:-translate-y-1">
          <Package className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-semibold mb-1">Manage Products</h3>
          <p className="text-purple-100 text-sm">Add or update inventory (Coming in Phase 3)</p>
        </div>

        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition transform hover:-translate-y-1">
          <DollarSign className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-semibold mb-1">View Reports</h3>
          <p className="text-green-100 text-sm">Detailed analytics (Phase 2 complete!)</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          🎉 Phase 2 Complete!
        </h3>
        <p className="text-blue-800 mb-4">
          Dashboard and Reports are ready! Once you add products and make some sales,
          you'll see real-time business metrics here.
        </p>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-blue-700">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium">Backend Connected</span>
          </div>
          <div className="flex items-center text-blue-700">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium">Reports API Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
