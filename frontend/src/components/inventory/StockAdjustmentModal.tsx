import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X, Package, Plus, Minus, Calendar, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { inventoryService } from '@/services/inventory.service';
import { productsService } from '@/services/products.service';

interface StockAdjustmentModalProps {
  product?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StockAdjustmentModal({ product, onClose, onSuccess }: StockAdjustmentModalProps) {
  const [selectedProductId, setSelectedProductId] = useState(product?._id || '');
  const [quantity, setQuantity] = useState(0);
  const [type, setType] = useState<'adjustment' | 'restock' | 'damage' | 'return' | 'initial'>('adjustment');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  // Current date and time
  const currentDateTime = new Date();
  const dateStr = currentDateTime.toLocaleDateString('en-US', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  const timeStr = currentDateTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  // Fetch all products for selection
  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['products-for-adjustment'],
    queryFn: () => productsService.getAll({ limit: 1000 }),
    enabled: !product,
  });

  const products = productsData?.products || [];

  // Adjust stock mutation
  const adjustMutation = useMutation({
    mutationFn: inventoryService.adjustStock,
    onSuccess: () => {
      toast.success('Stock adjusted successfully');
      onSuccess();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to adjust stock';
      toast.error(errorMessage);
      console.error('Stock adjustment error:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }

    if (quantity === 0) {
      toast.error('Quantity cannot be zero');
      return;
    }

    // Use a default store ID - backend should handle store creation/validation
    // In production, this should come from user settings or be selected by user
    const storeId = '000000000000000000000001';

    adjustMutation.mutate({
      productId: selectedProductId,
      storeId,
      quantity,
      type,
      reason: reason || undefined,
      notes: notes || undefined,
    });
  };

  const selectedProductData = product || products.find(p => p._id === selectedProductId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Stock Adjustment</h2>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{dateStr}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{timeStr}</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product Selection */}
          {!product && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Product *
              </label>
              {productsLoading ? (
                <div className="w-full px-4 py-3 border rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Loading products...
                </div>
              ) : productsError ? (
                <div className="w-full px-4 py-3 border border-red-300 rounded-lg bg-red-50 text-red-600 text-sm">
                  ⚠️ Failed to load products. Please try again.
                </div>
              ) : products.length === 0 ? (
                <div className="w-full px-4 py-3 border rounded-lg bg-yellow-50 text-yellow-700 text-sm">
                  📦 No products found. Please create products first.
                </div>
              ) : (
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a product...</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} (SKU: {p.sku}) - Current Stock: {p.stock || 0}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Current Stock Info */}
          {selectedProductData && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{selectedProductData.name}</p>
                  <p className="text-sm text-gray-600 mt-1">SKU: {selectedProductData.sku}</p>
                  {selectedProductData.category && (
                    <p className="text-xs text-gray-500 mt-1">Category: {selectedProductData.category}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 mb-1">Current Stock</p>
                  <p className="text-3xl font-bold text-blue-600">{selectedProductData.stock || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Adjustment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adjustment Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              required
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="adjustment">Stock Adjustment</option>
              <option value="restock">Restock</option>
              <option value="damage">Damaged/Lost</option>
              <option value="return">Customer Return</option>
              <option value="initial">Initial Stock</option>
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity *
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(quantity - 1, -9999))}
                className="w-12 h-12 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 flex items-center justify-center transition-colors"
              >
                <Minus className="w-5 h-5 text-gray-600" />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                required
                className="flex-1 px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-xl font-bold"
                placeholder="0"
              />
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 flex items-center justify-center transition-colors"
              >
                <Plus className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                Use positive (+) to add stock, negative (-) to reduce stock
              </p>
              {selectedProductData && quantity !== 0 && (
                <p className="text-sm font-medium">
                  New stock: <span className={`text-lg font-bold ${
                    (selectedProductData.stock || 0) + quantity < 0 
                      ? 'text-red-600' 
                      : (selectedProductData.stock || 0) + quantity === 0
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}>
                    {(selectedProductData.stock || 0) + quantity}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this adjustment needed? (Optional)"
              maxLength={200}
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">{reason.length}/200 characters</p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information... (Optional)"
              rows={3}
              maxLength={500}
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{notes.length}/500 characters</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              disabled={adjustMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adjustMutation.isPending || !selectedProductId || quantity === 0 || productsLoading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {adjustMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Adjusting...
                </>
              ) : (
                'Adjust Stock'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
