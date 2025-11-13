import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Search, FileText, User, Calendar, DollarSign, ShoppingBag, Eye } from 'lucide-react';
import { posService } from '@/services/pos.service';
import type { Sale } from '@/types/pos.types';

interface InvoiceSearchProps {
  onClose: () => void;
  onViewInvoice: (sale: Sale) => void;
}

export default function InvoiceSearch({ onClose, onViewInvoice }: InvoiceSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState<'invoice' | 'barcode' | 'sku'>('invoice');

  // Search sales
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales-invoice-search', searchTerm, searchBy],
    queryFn: () => posService.getSales({ search: searchTerm, limit: 50 }),
    enabled: searchTerm.length >= 2,
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Invoice Search</h2>
                <p className="text-indigo-100">Find and view past invoices</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSearchBy('invoice')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                searchBy === 'invoice' 
                  ? 'bg-white text-indigo-600' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Invoice #
            </button>
            <button
              onClick={() => setSearchBy('barcode')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                searchBy === 'barcode' 
                  ? 'bg-white text-indigo-600' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Barcode
            </button>
            <button
              onClick={() => setSearchBy('sku')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                searchBy === 'sku' 
                  ? 'bg-white text-indigo-600' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              SKU
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search by ${searchBy === 'invoice' ? 'invoice number' : searchBy === 'barcode' ? 'product barcode' : 'product SKU'}...`}
              autoFocus
              className="w-full pl-12 pr-4 py-3 border-0 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-white"
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Searching invoices...</p>
            </div>
          ) : searchTerm.length < 2 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Search Invoices</h3>
              <p className="text-gray-500">Enter invoice number, barcode, or SKU to search</p>
            </div>
          ) : salesData?.sales.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Invoices Found</h3>
              <p className="text-gray-500">Try a different search term</p>
            </div>
          ) : (
            <div className="space-y-3">
              {salesData?.sales.map((sale) => (
                <div
                  key={sale._id}
                  className="bg-white border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-lg transition-all"
                >
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          #{sale.saleNumber}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(sale.createdAt).toLocaleDateString()}
                          </span>
                          {sale.customer && (
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {sale.customer.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          ${sale.grandTotal.toFixed(2)}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          sale.status === 'completed' ? 'bg-green-100 text-green-800' :
                          sale.status === 'refunded' ? 'bg-red-100 text-red-800' :
                          sale.status === 'partial_refund' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {sale.status}
                        </span>
                      </div>
                    </div>

                    {/* Items Summary */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">{sale.items.length} Items:</p>
                      <div className="flex flex-wrap gap-2">
                        {sale.items.slice(0, 3).map((item, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                            {item.quantity}x {item.productName}
                          </span>
                        ))}
                        {sale.items.length > 3 && (
                          <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-md">
                            +{sale.items.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {sale.payments.map(p => p.method).join(', ')}
                        </span>
                      </div>
                      <button
                        onClick={() => onViewInvoice(sale)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        View Invoice
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

