import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  Package,
  Users,
  TruckIcon,
  Calendar,
  Download,
} from 'lucide-react';
import { reportsService } from '@/services/reports.service';
import { formatCurrency } from '@/lib/utils';
import type { ReportFilters } from '@/types/reports.types';
import SalesChart from '@/components/dashboard/SalesChart';

function ReportsPage() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>(
    'month'
  );
  const [activeTab, setActiveTab] = useState<
    'sales' | 'profit' | 'inventory' | 'customers' | 'vendors'
  >('sales');

  const filters: ReportFilters = { period };

  // Fetch reports based on active tab
  const { data: salesTrends, isLoading: salesLoading } = useQuery({
    queryKey: ['sales-trends', period],
    queryFn: () => reportsService.getSalesTrends(filters),
    enabled: activeTab === 'sales',
  });

  const { data: profitLoss, isLoading: profitLoading } = useQuery({
    queryKey: ['profit-loss', period],
    queryFn: () => reportsService.getProfitLoss(filters),
    enabled: activeTab === 'profit',
  });

  const { data: inventoryVal, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory-valuation'],
    queryFn: () => reportsService.getInventoryValuation(),
    enabled: activeTab === 'inventory',
  });

  const { data: customerInsights, isLoading: customersLoading } = useQuery({
    queryKey: ['customer-insights', period],
    queryFn: () => reportsService.getCustomerInsights(filters),
    enabled: activeTab === 'customers',
  });

  const { data: vendorPerf, isLoading: vendorsLoading } = useQuery({
    queryKey: ['vendor-performance', period],
    queryFn: () => reportsService.getVendorPerformance(filters),
    enabled: activeTab === 'vendors',
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods', period],
    queryFn: () => reportsService.getPaymentMethods(filters),
  });

  const tabs = [
    { id: 'sales', name: 'Sales Trends', icon: TrendingUp },
    { id: 'profit', name: 'Profit & Loss', icon: DollarSign },
    { id: 'inventory', name: 'Inventory', icon: Package },
    { id: 'customers', name: 'Customers', icon: Users },
    { id: 'vendors', name: 'Vendors', icon: TruckIcon },
  ] as const;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Business insights and performance metrics
          </p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </button>
      </div>

      {/* Period Selector */}
      <div className="flex items-center space-x-4 mb-6">
        <Calendar className="w-5 h-5 text-gray-500" />
        <div className="flex items-center space-x-2 bg-white rounded-lg shadow p-1">
          {(['today', 'week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {/* Sales Trends */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            {salesLoading ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading sales data...</p>
              </div>
            ) : salesTrends ? (
              <>
                <SalesChart data={salesTrends.trends} />
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Summary
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Sales</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(salesTrends?.summary?.totalSales || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Transactions</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {salesTrends?.summary?.totalTransactions || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Avg Order</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(
                          salesTrends?.summary?.averageOrderValue || 0
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Growth</p>
                      <p
                        className={`text-2xl font-bold ${
                          (salesTrends?.summary?.growth || 0) >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {(salesTrends?.summary?.growth || 0) > 0 ? '+' : ''}
                        {salesTrends?.summary?.growth || 0}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                {paymentMethods && paymentMethods.methods?.length ? (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Payment Methods
                    </h3>
                    <div className="space-y-3">
                      {paymentMethods.methods.map((method) => (
                        <div
                          key={method.method}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center">
                            <CreditCard className="w-5 h-5 text-gray-500 mr-3" />
                            <div>
                              <p className="font-medium text-gray-900 capitalize">
                                {method.method}
                              </p>
                              <p className="text-sm text-gray-500">
                                {method.count} transactions
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(method.amount)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {method.percentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No payment data available</p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No sales data available</p>
              </div>
            )}
          </div>
        )}

        {/* Profit & Loss */}
        {activeTab === 'profit' && (
          <div className="bg-white rounded-lg shadow p-6">
            {profitLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading P&L report...</p>
              </div>
            ) : profitLoss ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Profit & Loss Statement
                </h3>
                <div className="space-y-6">
                  {/* Revenue */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Revenue
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sales</span>
                        <span className="font-medium">
                          {formatCurrency(profitLoss.revenue.sales)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-semibold text-gray-900">
                          Total Revenue
                        </span>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(profitLoss.revenue.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Costs */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Costs
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Cost of Goods Sold
                        </span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(profitLoss.costs.cogs)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-semibold text-gray-900">
                          Total Costs
                        </span>
                        <span className="font-bold text-red-600">
                          {formatCurrency(profitLoss.costs.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Profit */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Profit
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gross Profit</span>
                        <span className="font-medium text-green-700">
                          {formatCurrency(profitLoss.profit.gross)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Net Profit</span>
                        <span className="font-medium text-green-700">
                          {formatCurrency(profitLoss.profit.net)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-green-200">
                        <span className="font-semibold text-gray-900">
                          Profit Margin
                        </span>
                        <span className="font-bold text-green-700">
                          {profitLoss.profit.margin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No financial data available</p>
              </div>
            )}
          </div>
        )}

        {/* Inventory Valuation */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-lg shadow p-6">
            {inventoryLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading inventory data...</p>
              </div>
            ) : inventoryVal ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Inventory Valuation
                </h3>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Total Products</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {inventoryVal.totalProducts}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Total Quantity</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {inventoryVal.totalQuantity}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Cost Value</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(inventoryVal.costValue)}
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Retail Value</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(inventoryVal.retailValue)}
                    </p>
                  </div>
                </div>

                {/* By Category */}
                <h4 className="text-md font-semibold text-gray-900 mb-3">
                  By Category
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Products
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Cost Value
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Retail Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(inventoryVal.categories || []).map((cat) => (
                        <tr key={cat.categoryId} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-900">
                            {cat.categoryName}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                            {cat.products}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                            {cat.quantity}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap font-medium">
                            {formatCurrency(cat.costValue)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap font-medium text-green-600">
                            {formatCurrency(cat.retailValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No inventory data available</p>
              </div>
            )}
          </div>
        )}

        {/* Customer Insights */}
        {activeTab === 'customers' && (
          <div className="bg-white rounded-lg shadow p-6">
            {customersLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading customer data...</p>
              </div>
            ) : customerInsights ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Customer Insights
                </h3>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">
                      Total Customers
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {customerInsights.totalCustomers}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">New Customers</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {customerInsights.newCustomers}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Returning</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.max(
                        customerInsights.totalCustomers - customerInsights.newCustomers,
                        0
                      )}
                    </p>
                  </div>
                </div>

                {/* Top Customers */}
                <h4 className="text-md font-semibold text-gray-900 mb-3">
                  Top Customers
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Customer
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Total Spent
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Transactions
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Avg Order
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(customerInsights.topCustomers || []).map((customer, index) => {
                        const key =
                          typeof customer.customerId === 'string'
                            ? customer.customerId
                            : `${customer.customerName}-${index}`;
                        return (
                          <tr key={key} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <p className="font-medium text-gray-900">
                                {customer.customerName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {customer.email || 'No email'}
                              </p>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap font-semibold text-green-600">
                              {formatCurrency(customer.totalSpent)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                              {customer.visits}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap font-medium">
                              {formatCurrency(customer.avgOrderValue)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No customer data available</p>
              </div>
            )}
          </div>
        )}

        {/* Vendor Performance */}
        {activeTab === 'vendors' && (
          <div className="bg-white rounded-lg shadow p-6">
            {vendorsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading vendor data...</p>
              </div>
            ) : vendorPerf ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Vendor Performance
                </h3>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Total Vendors</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {vendorPerf.totalVendors}
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Active POs</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {vendorPerf.activePurchaseOrders}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">
                      Total Purchased
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(vendorPerf.totalPurchased)}
                    </p>
                  </div>
                </div>

                {/* Top Vendors */}
                <h4 className="text-md font-semibold text-gray-900 mb-3">
                  Top Vendors
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Vendor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Orders
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Total Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Avg Order
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(vendorPerf.topVendors || []).map((vendor) => (
                        <tr key={vendor._id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-900">
                            {vendor.name}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                            {vendor.totalOrders}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap font-semibold text-blue-600">
                            {formatCurrency(vendor.totalAmount)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap font-medium">
                            {formatCurrency(vendor.averageOrderValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <TruckIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No vendor data available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportsPage;
