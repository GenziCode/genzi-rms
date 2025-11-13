import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { 
  FileText, 
  Plus, 
  Search, 
  Eye, 
  Download,
  Filter,
  MoreVertical,
  Calendar,
  TrendingUp,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Truck,
  Edit,
  Trash2,
  FileDown,
  RefreshCw,
  Bell,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { purchaseOrdersService } from '@/services/purchaseOrders.service';
import type { PurchaseOrder, PurchaseOrderFilters } from '@/types/purchaseOrder.types';
import CreatePOModal from '@/components/po/CreatePOModal';
import PODetailsModal from '@/components/po/PODetailsModal';
import ReceiveGoodsModal from '@/components/po/ReceiveGoodsModal';
import { PODashboard } from '@/components/po/PODashboard';
import { formatCurrency, formatDate } from '@/lib/utils';

type TabType = 'dashboard' | 'all' | 'draft' | 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled';
type ViewMode = 'grid' | 'list' | 'table';

export default function PurchaseOrdersPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showCreate, setShowCreate] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<PurchaseOrderFilters>({ 
    page: 1, 
    limit: 20,
  });
  const [selectedPOs, setSelectedPOs] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | undefined>();

  // Build query filters based on active tab
  const queryFilters: PurchaseOrderFilters = {
    ...filters,
    search: searchTerm || undefined,
    status: activeTab !== 'dashboard' && activeTab !== 'all' ? activeTab : filters.status,
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['purchase-orders', queryFilters, activeTab],
    queryFn: () => purchaseOrdersService.getAll(queryFilters),
  });

  const orders = data?.purchaseOrders || [];
  const pagination = data?.pagination;

  // Bulk actions
  const bulkApproveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => purchaseOrdersService.approve(id)));
    },
    onSuccess: () => {
      toast.success('Purchase orders approved successfully');
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      setSelectedPOs(new Set());
    },
    onError: () => {
      toast.error('Failed to approve purchase orders');
    },
  });

  const bulkCancelMutation = useMutation({
    mutationFn: async ({ ids, reason }: { ids: string[]; reason: string }) => {
      await Promise.all(ids.map(id => purchaseOrdersService.cancel(id, reason)));
    },
    onSuccess: () => {
      toast.success('Purchase orders cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      setSelectedPOs(new Set());
    },
    onError: () => {
      toast.error('Failed to cancel purchase orders');
    },
  });

  const handleBulkAction = (action: 'approve' | 'cancel') => {
    if (selectedPOs.size === 0) {
      toast.error('Please select purchase orders');
      return;
    }

    if (action === 'approve') {
      bulkApproveMutation.mutate(Array.from(selectedPOs));
    } else if (action === 'cancel') {
      const reason = prompt('Enter cancellation reason:');
      if (reason && reason.trim()) {
        bulkCancelMutation.mutate({ ids: Array.from(selectedPOs), reason: reason.trim() });
      }
    }
  };

  const handleExport = () => {
    // TODO: Implement CSV/PDF export
    toast.success('Export functionality coming soon');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-green-100 text-green-800 border-green-200';
      case 'approved': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'ordered': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: TrendingUp },
    { id: 'all' as TabType, label: 'All Orders', icon: FileText, count: data?.pagination?.total },
    { id: 'draft' as TabType, label: 'Draft', icon: Edit, count: orders.filter(o => o.status === 'draft').length },
    { id: 'pending' as TabType, label: 'Pending', icon: Clock, count: orders.filter(o => o.status === 'pending').length },
    { id: 'approved' as TabType, label: 'Approved', icon: CheckCircle2, count: orders.filter(o => o.status === 'approved').length },
    { id: 'ordered' as TabType, label: 'Ordered', icon: Send, count: orders.filter(o => o.status === 'ordered').length },
    { id: 'received' as TabType, label: 'Received', icon: Truck, count: orders.filter(o => o.status === 'received').length },
    { id: 'cancelled' as TabType, label: 'Cancelled', icon: XCircle, count: orders.filter(o => o.status === 'cancelled').length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Purchase Orders</h1>
              <p className="text-sm text-gray-600 mt-1">Manage and track your purchase orders</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Purchase Order</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-6 lg:px-8 border-t border-gray-200">
          <div className="flex overflow-x-auto scrollbar-hide -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap
                    transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`
                      px-2 py-0.5 rounded-full text-xs font-medium
                      ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}
                    `}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
              <input
                type="text"
                placeholder="Search vendor..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="date"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">All Stores</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setShowFilters(false)}
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {activeTab !== 'dashboard' && (
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by PO number, vendor, or product..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            {selectedPOs.size > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('approve')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                >
                  Approve ({selectedPOs.size})
                </button>
                <button
                  onClick={() => handleBulkAction('cancel')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                >
                  Cancel ({selectedPOs.size})
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'table' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Grid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' ? (
          <PODashboard dateRange={dateRange} />
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading purchase orders...</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No purchase orders found</h3>
            <p className="text-gray-600 mb-4">Create your first purchase order to get started</p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Purchase Order
            </button>
          </div>
        ) : viewMode === 'table' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedPOs.size === orders.length && orders.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPOs(new Set(orders.map(o => o._id)));
                          } else {
                            setSelectedPOs(new Set());
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr 
                      key={order._id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedPO(order);
                        setShowDetails(true);
                      }}
                    >
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedPOs.has(order._id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            const newSelected = new Set(selectedPOs);
                            if (e.target.checked) {
                              newSelected.add(order._id);
                            } else {
                              newSelected.delete(order._id);
                            }
                            setSelectedPOs(newSelected);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900">{order.poNumber}</p>
                        {order.expectedDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            Expected: {formatDate(order.expectedDate)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-gray-900 font-medium">{order.vendorName || 'N/A'}</p>
                        {order.vendorCompany && (
                          <p className="text-xs text-gray-500">{order.vendorCompany}</p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-900">{formatDate(order.orderDate)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-gray-900">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-900">{formatCurrency(order.grandTotal)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedPO(order);
                              setShowDetails(true);
                            }}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedPO(order);
                  setShowDetails(true);
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{order.poNumber}</h3>
                    <p className="text-sm text-gray-600 mt-1">{order.vendorName || 'N/A'}</p>
                  </div>
                  <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium text-gray-900">{formatDate(order.orderDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items:</span>
                    <span className="font-medium text-gray-900">{order.items.length}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-bold text-lg text-gray-900">{formatCurrency(order.grandTotal)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreatePOModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
          }}
        />
      )}

      {showDetails && selectedPO && (
        <PODetailsModal
          purchaseOrder={selectedPO}
          onClose={() => {
            setShowDetails(false);
            setSelectedPO(null);
          }}
          onReceive={() => {
            setShowDetails(false);
            setShowReceive(true);
          }}
        />
      )}

      {showReceive && selectedPO && (
        <ReceiveGoodsModal
          purchaseOrder={selectedPO}
          onClose={() => {
            setShowReceive(false);
            setSelectedPO(null);
          }}
          onSuccess={() => {
            setShowReceive(false);
            setSelectedPO(null);
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
          }}
        />
      )}
    </div>
  );
}
