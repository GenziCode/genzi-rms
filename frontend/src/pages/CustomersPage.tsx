import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Plus, Search, Edit, Trash2, Eye, Star, CreditCard,
  Phone, Mail, MapPin, Filter, Download, Upload
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { customersService } from '@/services/customers.service';
import type { Customer, CustomerFilters } from '@/types/customer.types';
import CustomerFormModal from '@/components/customers/CustomerFormModal';
import CustomerDetailsModal from '@/components/customers/CustomerDetailsModal';

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<CustomerFilters>({
    page: 1,
    limit: 20,
  });

  // Fetch customers
  const { data, isLoading } = useQuery({
    queryKey: ['customers', filters, searchTerm],
    queryFn: () => customersService.getAll({
      ...filters,
      search: searchTerm || undefined,
    }),
  });

  const customers = data?.customers || [];
  const pagination = data?.pagination;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: customersService.delete,
    onSuccess: () => {
      toast.success('Customer deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: () => {
      toast.error('Failed to delete customer');
    },
  });

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowForm(true);
  };

  const handleView = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetails(true);
  };

  const handleDelete = (customer: Customer) => {
    if (confirm(`Are you sure you want to delete ${customer.name}?`)) {
      deleteMutation.mutate(customer._id);
    }
  };

  const handleCreate = () => {
    setSelectedCustomer(null);
    setShowForm(true);
  };

  const getLoyaltyColor = (tier?: string) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-100 text-purple-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'bronze': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vip': return 'bg-purple-100 text-purple-800';
      case 'distributor': return 'bg-blue-100 text-blue-800';
      case 'wholesale': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage your customer relationships</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customers by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filters.type || ''}
            onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="regular">Regular</option>
            <option value="wholesale">Wholesale</option>
            <option value="distributor">Distributor</option>
            <option value="vip">VIP</option>
          </select>

          {/* Loyalty Tier Filter */}
          <select
            value={filters.loyaltyTier || ''}
            onChange={(e) => setFilters({ ...filters, loyaltyTier: e.target.value as any })}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Tiers</option>
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>

          {/* Sort */}
          <select
            value={filters.sortBy || 'name'}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Name</option>
            <option value="totalSpent">Total Spent</option>
            <option value="totalPurchases">Total Purchases</option>
            <option value="createdAt">Date Added</option>
            <option value="lastPurchase">Last Purchase</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search' : 'Get started by adding your first customer'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreate}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Customer
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loyalty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchases</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          {customer.email && (
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <Mail className="w-3 h-3" />
                              {customer.email}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {customer.phone && (
                          <p className="text-sm text-gray-900 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {customer.phone}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(customer.type)}`}>
                          {customer.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {customer.loyaltyTier ? (
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getLoyaltyColor(customer.loyaltyTier)}`}>
                              {customer.loyaltyTier}
                            </span>
                            <span className="text-sm text-gray-600">
                              {customer.loyaltyPoints} pts
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          ${customer.totalSpent.toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{customer.totalPurchases}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          customer.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {customer.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleView(customer)}
                            className="text-blue-600 hover:text-blue-700"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(customer)}
                            className="text-gray-600 hover:text-gray-700"
                            title="Edit"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(customer)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
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
              <div className="px-6 py-4 border-t flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} customers
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page! - 1 })}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page! + 1 })}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <CustomerFormModal
          customer={selectedCustomer}
          onClose={() => {
            setShowForm(false);
            setSelectedCustomer(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setSelectedCustomer(null);
            queryClient.invalidateQueries({ queryKey: ['customers'] });
          }}
        />
      )}

      {showDetails && selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={() => {
            setShowDetails(false);
            setSelectedCustomer(null);
          }}
          onEdit={() => {
            setShowDetails(false);
            setShowForm(true);
          }}
        />
      )}
    </div>
  );
}

