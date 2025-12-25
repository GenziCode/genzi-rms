import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Send,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
} from 'lucide-react';
import { invoiceService } from '@/services/invoice.service';
import { formatCurrency } from '@/lib/utils';
import type {
  Invoice,
  DocumentType,
  DocumentStatus,
} from '@/types/invoice.types';
import InvoiceFormModal from '@/components/invoices/InvoiceFormModal';
import InvoiceDetailModal from '@/components/invoices/InvoiceDetailModal';
import toast from 'react-hot-toast';

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [filters, setFilters] = useState<{
    type?: DocumentType;
    status?: DocumentStatus;
    page: number;
    limit: number;
  }>({
    page: 1,
    limit: 20,
  });

  // Fetch invoices
  const { data, isLoading } = useQuery({
    queryKey: ['invoices', filters, searchQuery],
    queryFn: () => invoiceService.getAll({ ...filters, search: searchQuery }),
  });

  const invoices = data?.invoices || [];
  const pagination = data?.pagination;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => invoiceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete invoice');
    },
  });

  const getStatusBadge = (status: DocumentStatus) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700',
      pending: 'bg-yellow-100 text-yellow-700',
      sent: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700',
      partial: 'bg-orange-100 text-orange-700',
      overdue: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-200 text-gray-600',
      void: 'bg-red-200 text-red-800',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status]}`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  const getTypeLabel = (type: DocumentType) => {
    const labels: Record<DocumentType, string> = {
      sale_invoice: 'Invoice',
      purchase_order: 'Purchase Order',
      quotation: 'Quotation',
      proforma_invoice: 'Proforma',
      credit_note: 'Credit Note',
      debit_note: 'Debit Note',
      delivery_note: 'Delivery Note',
      receipt: 'Receipt',
    };
    return labels[type] || type;
  };

  const handleDownload = async (invoice: Invoice) => {
    try {
      const blob = await invoiceService.downloadPDF(invoice._id ?? invoice.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message || 'Failed to download invoice PDF';
      toast.error(message);
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setShowCreateModal(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Invoices & Documents
          </h1>
          <p className="text-gray-600 mt-1">
            {pagination?.total || 0} documents
          </p>
        </div>
        <button
          onClick={() => {
            setEditingInvoice(null);
            setShowCreateModal(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by invoice number, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filters.type || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  type: e.target.value ? (e.target.value as DocumentType) : undefined,
                  page: 1,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="sale_invoice">Invoices</option>
              <option value="quotation">Quotations</option>
              <option value="purchase_order">Purchase Orders</option>
              <option value="credit_note">Credit Notes</option>
              <option value="receipt">Receipts</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: e.target.value ? (e.target.value as DocumentStatus) : undefined,
                  page: 1,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="partial">Partially Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoices...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No invoices found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || filters.type || filters.status
              ? 'No invoices match your filters'
              : 'Create your first invoice to get started'}
          </p>
          <button
            onClick={() => {
              setEditingInvoice(null);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Invoice
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice: Invoice) => (
                <tr key={invoice._id ?? invoice.invoiceNumber} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {getTypeLabel(invoice.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {invoice.to.customerName}
                      </div>
                      {invoice.to.address?.email && (
                        <div className="text-gray-500 text-xs">
                          {invoice.to.address.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(invoice.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(invoice.total)}
                      </div>
                      {invoice.amountDue > 0 && (
                        <div className="text-xs text-orange-600">
                          Due: {formatCurrency(invoice.amountDue)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewingInvoice(invoice)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(invoice)}
                        className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(invoice)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                        title="Send Email"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      {invoice.status === 'draft' && (
                        <button
                          onClick={() => {
                            if (confirm('Delete this invoice?')) {
                              deleteMutation.mutate(invoice.id);
                            }
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
              <div className="text-sm text-gray-700">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
                of {pagination.total} results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page - 1 })
                  }
                  disabled={filters.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page + 1 })
                  }
                  disabled={filters.page === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">
                {pagination?.total || 0}
              </p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-green-600">
                {invoices.filter((i: Invoice) => i.status === 'paid').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {
                  invoices.filter(
                    (i: Invoice) =>
                      i.status === 'pending' || i.status === 'sent'
                  ).length
                }
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">
                {invoices.filter((i: Invoice) => i.status === 'overdue').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <InvoiceFormModal
          onClose={() => {
            setShowCreateModal(false);
            setEditingInvoice(null);
          }}
          invoice={editingInvoice || undefined}
        />
      )}
      {viewingInvoice && (
        <InvoiceDetailModal
          invoice={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          onEdit={() => {
            setViewingInvoice(null);
            handleEdit(viewingInvoice);
          }}
          onDelete={() => {
            if (confirm('Delete this invoice?')) {
              deleteMutation.mutate(viewingInvoice.id);
              setViewingInvoice(null);
            }
          }}
        />
      )}
    </div>
  );
}
