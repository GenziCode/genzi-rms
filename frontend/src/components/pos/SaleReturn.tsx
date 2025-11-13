import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Search, RotateCcw, AlertTriangle, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { posService } from '@/services/pos.service';
import type { Sale } from '@/types/pos.types';

interface SaleReturnProps {
  onClose: () => void;
}

export default function SaleReturn({ onClose }: SaleReturnProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [returnItems, setReturnItems] = useState<{ [key: string]: number }>({});
  const [returnReason, setReturnReason] = useState('');

  // Search sales
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales-search', searchTerm],
    queryFn: () => posService.getSales({ search: searchTerm, status: 'completed', limit: 20 }),
    enabled: searchTerm.length >= 3,
  });

  // Refund mutation
  const refundMutation = useMutation({
    mutationFn: ({ saleId, amount, reason }: { saleId: string; amount: number; reason: string }) =>
      posService.refundSale(saleId, { amount, reason }),
    onSuccess: () => {
      toast.success('Sale return processed successfully');
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      onClose();
    },
    onError: () => {
      toast.error('Failed to process return');
    },
  });

  const handleReturn = () => {
    if (!selectedSale) return;
    
    const returnAmount = Object.entries(returnItems).reduce((sum, [itemId, qty]) => {
      const item = selectedSale.items.find(i => i.productId === itemId);
      return sum + (item ? item.unitPrice * qty : 0);
    }, 0);

    if (returnAmount === 0) {
      toast.error('Select items to return');
      return;
    }

    if (!returnReason.trim()) {
      toast.error('Enter return reason');
      return;
    }

    refundMutation.mutate({
      saleId: selectedSale._id,
      amount: returnAmount,
      reason: returnReason,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Sale Return</h2>
                <p className="text-red-100">Process customer returns and refunds</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Section */}
        {!selectedSale && (
          <div className="p-6 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by invoice number, barcode, QR code, SKU..."
                autoFocus
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedSale ? (
            /* Search Results */
            <>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Searching sales...</p>
                </div>
              ) : searchTerm.length < 3 ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Enter at least 3 characters to search</p>
                </div>
              ) : salesData?.sales.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No sales found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {salesData?.sales.map((sale) => (
                    <button
                      key={sale._id}
                      onClick={() => setSelectedSale(sale)}
                      className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-red-500 hover:shadow-lg transition-all text-left"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-gray-900">#{sale.saleNumber}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(sale.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">${sale.grandTotal.toFixed(2)}</p>
                          <p className="text-sm text-gray-500">{sale.items.length} items</p>
                        </div>
                      </div>
                      {sale.customer && (
                        <p className="text-sm text-gray-600">Customer: {sale.customer.name}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Return Form */
            <>
              {/* Sale Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">#{selectedSale.saleNumber}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedSale.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSale(null)}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg"
                  >
                    Change Sale
                  </button>
                </div>
                {selectedSale.customer && (
                  <p className="text-sm text-gray-600">Customer: {selectedSale.customer.name}</p>
                )}
              </div>

              {/* Items */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Select Items to Return</h3>
                <div className="space-y-2">
                  {selectedSale.items.map((item) => {
                    const returnQty = returnItems[item.productId] || 0;
                    return (
                      <div key={item.productId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.productName}</h4>
                          <p className="text-sm text-gray-600">
                            Qty: {item.quantity} × ${item.unitPrice.toFixed(2)} = ${item.total.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setReturnItems({
                              ...returnItems,
                              [item.productId]: Math.max(0, returnQty - 1)
                            })}
                            disabled={returnQty === 0}
                            className="w-8 h-8 bg-white border-2 border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-bold">{returnQty}</span>
                          <button
                            onClick={() => setReturnItems({
                              ...returnItems,
                              [item.productId]: Math.min(item.quantity, returnQty + 1)
                            })}
                            disabled={returnQty >= item.quantity}
                            className="w-8 h-8 bg-white border-2 border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Return Reason */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Return Reason *
                </label>
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Enter reason for return..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Return Total */}
              <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border border-red-200 mb-6">
                <p className="text-sm text-red-600 font-medium mb-2">Refund Amount</p>
                <p className="text-4xl font-bold text-red-600">
                  ${Object.entries(returnItems).reduce((sum, [itemId, qty]) => {
                    const item = selectedSale.items.find(i => i.productId === itemId);
                    return sum + (item ? item.unitPrice * qty : 0);
                  }, 0).toFixed(2)}
                </p>
              </div>

              {/* Process Button */}
              <button
                onClick={handleReturn}
                disabled={refundMutation.isPending}
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-4 px-6 rounded-xl hover:from-red-700 hover:to-pink-700 transition-all flex items-center justify-center gap-3 font-bold text-lg shadow-lg disabled:opacity-50"
              >
                <Check className="w-6 h-6" />
                {refundMutation.isPending ? 'Processing...' : 'Process Return'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

