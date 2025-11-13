import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TruckIcon, Plus, Search, Edit, Trash2, Eye, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { vendorsService } from '@/services/vendors.service';
import type { Vendor, VendorFilters } from '@/types/vendor.types';
import VendorFormModal from '@/components/vendors/VendorFormModal';
import VendorDetailsModal from '@/components/vendors/VendorDetailsModal';

export default function VendorsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<VendorFilters>({ page: 1, limit: 20 });

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', filters, searchTerm],
    queryFn: () => vendorsService.getAll({ ...filters, search: searchTerm || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: vendorsService.delete,
    onSuccess: () => {
      toast.success('Vendor deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
    onError: () => toast.error('Failed to delete vendor'),
  });

  const vendors = data?.vendors || [];
  const pagination = data?.pagination;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-600 mt-1">Manage your suppliers</p>
        </div>
        <button
          onClick={() => { setSelectedVendor(null); setShowForm(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Vendor
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vendors..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading vendors...</p>
          </div>
        ) : vendors.length === 0 ? (
          <div className="p-12 text-center">
            <TruckIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No vendors found</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first vendor</p>
            <button
              onClick={() => { setSelectedVendor(null); setShowForm(true); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Vendor
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Purchased</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vendors.map((vendor) => (
                  <tr key={vendor._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{vendor.name}</p>
                        <p className="text-sm text-gray-500">{vendor.company}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {vendor.email && <p className="text-gray-900">{vendor.email}</p>}
                        {vendor.phone && <p className="text-gray-600">{vendor.phone}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">${vendor.totalPurchased.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{vendor.totalOrders}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className={`font-medium ${vendor.currentBalance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        ${vendor.currentBalance.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        vendor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {vendor.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setSelectedVendor(vendor); setShowDetails(true); }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => { setSelectedVendor(vendor); setShowForm(true); }}
                          className="text-gray-600 hover:text-gray-700"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${vendor.name}?`)) deleteMutation.mutate(vendor._id);
                          }}
                          className="text-red-600 hover:text-red-700"
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
        )}
      </div>

      {showForm && (
        <VendorFormModal
          vendor={selectedVendor}
          onClose={() => { setShowForm(false); setSelectedVendor(null); }}
          onSuccess={() => {
            setShowForm(false);
            setSelectedVendor(null);
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
          }}
        />
      )}

      {showDetails && selectedVendor && (
        <VendorDetailsModal
          vendor={selectedVendor}
          onClose={() => { setShowDetails(false); setSelectedVendor(null); }}
          onEdit={() => { setShowDetails(false); setShowForm(true); }}
        />
      )}
    </div>
  );
}

