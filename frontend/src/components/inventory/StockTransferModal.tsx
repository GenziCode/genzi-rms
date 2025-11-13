import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ArrowRight, Loader2, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { inventoryService } from '@/services/inventory.service';
import { productsService } from '@/services/products.service';
import { settingsService } from '@/services/settings.service';
import type { Product } from '@/types/products.types';

interface StockTransferModalProps {
  onClose: () => void;
}

export default function StockTransferModal({
  onClose,
}: StockTransferModalProps) {
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [fromStore, setFromStore] = useState('');
  const [toStore, setToStore] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');

  // Fetch stores
  const { data: stores } = useQuery({
    queryKey: ['stores'],
    queryFn: () => settingsService.getStores(),
  });

  // Fetch products
  const { data: productsData } = useQuery({
    queryKey: ['products', { search, limit: 50 }],
    queryFn: () => productsService.getAll({ search, limit: 50 }),
  });

  const products = productsData?.products || [];

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct || !fromStore || !toStore) {
        throw new Error('Product and store selections are required');
      }

      return inventoryService.transferStock({
        productId: selectedProduct._id,
        fromStoreId: fromStore,
        toStoreId: toStore,
        quantity,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'movements'] });
      toast.success('Stock transferred successfully');
      onClose();
    },
    onError: (error: unknown) => {
      const apiMessage =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      toast.error(apiMessage ?? 'Failed to transfer stock');
    },
  });

  const canTransfer =
    selectedProduct &&
    fromStore &&
    toStore &&
    fromStore !== toStore &&
    quantity > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            Stock Transfer
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Product *
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product by name or SKU..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-2"
            />
            {products.length > 0 && search && (
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {products.map((product) => (
                  <button
                    key={product._id}
                    type="button"
                    onClick={() => {
                      setSelectedProduct(product);
                      setSearch('');
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-3"
                  >
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://via.placeholder.com/48?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        SKU: {product.sku} | Stock: {product.stock || 0}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {selectedProduct && (
              <div className="mt-3 p-4 bg-blue-50 rounded-lg flex items-center gap-3">
                {selectedProduct.images && selectedProduct.images.length > 0 ? (
                  <img
                    src={selectedProduct.images[0]}
                    alt={selectedProduct.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {selectedProduct.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    SKU: {selectedProduct.sku} | Available:{' '}
                    {selectedProduct.stock || 0}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Store Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Store *
              </label>
              <select
                value={fromStore}
                onChange={(e) => setFromStore(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select source store</option>
                {stores?.map((store) => (
                  <option key={store._id} value={store._id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Store *
              </label>
              <select
                value={toStore}
                onChange={(e) => setToStore(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select destination store</option>
                {stores?.map((store) => (
                  <option
                    key={store._id}
                    value={store._id}
                    disabled={store._id === fromStore}
                  >
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Visual Transfer Indicator */}
          {fromStore && toStore && (
            <div className="flex items-center justify-center gap-4 py-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  {stores?.find((s) => s._id === fromStore)?.name}
                </p>
                <p className="text-xs text-gray-500">Source</p>
              </div>
              <ArrowRight className="w-8 h-8 text-blue-600" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  {stores?.find((s) => s._id === toStore)?.name}
                </p>
                <p className="text-xs text-gray-500">Destination</p>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity *
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {selectedProduct && quantity > (selectedProduct.stock || 0) && (
              <p className="mt-1 text-sm text-amber-600">
                ⚠️ Warning: Transfer quantity exceeds available stock
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this transfer..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={() => transferMutation.mutate()}
            disabled={!canTransfer || transferMutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {transferMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Transferring...
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                Transfer Stock
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
