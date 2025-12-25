import { useState } from 'react';
import { Activity, TrendingUp, Users, DollarSign, ShoppingCart, Package } from 'lucide-react';
import type { Category } from '@/types/products.types';

interface CategoryAnalyticsDashboardProps {
  categories: Category[];
}

const CategoryAnalyticsDashboard: React.FC<CategoryAnalyticsDashboardProps> = ({ categories }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Prepare data for charts
  const categoryStats = categories.map(cat => ({
    name: cat.name,
    products: Math.floor(Math.random() * 100), // Placeholder for actual product count
    revenue: Math.floor(Math.random() * 10000), // Placeholder for actual revenue
    orders: Math.floor(Math.random() * 50), // Placeholder for actual order count
  }));

  // Calculate totals
  const totalCategories = categories.length;
  const totalProducts = categoryStats.reduce((sum, stat) => sum + stat.products, 0);
  const totalRevenue = categoryStats.reduce((sum, stat) => sum + stat.revenue, 0);
  const totalOrders = categoryStats.reduce((sum, stat) => sum + stat.orders, 0);

  // Top performing categories
  const topPerforming = [...categoryStats].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Category Analytics</h1>
        <p className="text-gray-600 mt-1">Track and analyze your category performance</p>
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-end mb-6">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              timeRange === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setTimeRange('week')}
          >
            Week
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              timeRange === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setTimeRange('month')}
          >
            Month
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              timeRange === 'quarter'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setTimeRange('quarter')}
          >
            Quarter
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              timeRange === 'year'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setTimeRange('year')}
          >
            Year
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Package className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Categories</p>
              <p className="text-2xl font-bold">{totalCategories}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Products</p>
              <p className="text-2xl font-bold">{totalProducts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Orders</p>
              <p className="text-2xl font-bold">{totalOrders}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue by Category */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Revenue by Category</h2>
          <div className="h-80 flex items-center justify-center">
            <p className="text-gray-500">Chart visualization would appear here</p>
          </div>
        </div>

        {/* Products by Category */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Products by Category</h2>
          <div className="h-80 flex items-center justify-center">
            <p className="text-gray-500">Chart visualization would appear here</p>
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Category Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversion Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categoryStats.map((stat, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {stat.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stat.products}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${stat.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stat.orders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Math.round((stat.orders / stat.products) * 100) || 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CategoryAnalyticsDashboard;