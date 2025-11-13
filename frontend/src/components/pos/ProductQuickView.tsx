import { X, Package, Tag, DollarSign, TrendingUp, ShoppingCart, Barcode, QrCode, Info } from 'lucide-react';
import type { Product } from '@/types/products.types';
import { useAuthStore } from '@/store/authStore';

interface ProductQuickViewProps {
  product: Product;
  onClose: () => void;
  onAddToCart: () => void;
}

export default function ProductQuickView({ product, onClose, onAddToCart }: ProductQuickViewProps) {
  const { user } = useAuthStore();
  
  // Check if user can see cost
  const canSeeCost = user?.role === 'owner' || user?.role === 'admin' || user?.role === 'manager';
  
  const profit = product.cost ? product.price - product.cost : 0;
  const profitMargin = product.cost ? ((profit / product.price) * 100) : 0;
  
  const isOutOfStock = product.trackInventory && (product.stock || 0) < 1;
  const isLowStock = product.trackInventory && (product.stock || 0) <= (product.minStock || 0) && !isOutOfStock;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative">
          {product.images && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-64 object-cover"
            />
          ) : (
            <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <Package className="w-24 h-24 text-gray-400" />
            </div>
          )}
          
          {/* Badges Overlay */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {isOutOfStock && (
              <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
                OUT OF STOCK
              </span>
            )}
            {isLowStock && (
              <span className="px-3 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full shadow-lg">
                LOW STOCK
              </span>
            )}
            {product.isActive === false && (
              <span className="px-3 py-1 bg-gray-500 text-white text-xs font-bold rounded-full shadow-lg">
                INACTIVE
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-256px)]">
          {/* Title & Price */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
            {product.description && (
              <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
            )}
          </div>

          {/* Price Section */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <p className="text-sm text-blue-600 font-medium mb-1">Retail Price</p>
              <p className="text-3xl font-bold text-blue-600">${product.price.toFixed(2)}</p>
            </div>

            {canSeeCost && product.cost && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <p className="text-sm text-green-600 font-medium mb-1">Cost Price</p>
                <p className="text-2xl font-bold text-green-600">${product.cost.toFixed(2)}</p>
                <p className="text-xs text-green-600 mt-1">
                  Profit: ${profit.toFixed(2)} ({profitMargin.toFixed(1)}%)
                </p>
              </div>
            )}
          </div>

          {/* Product Info Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {product.sku && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Barcode className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">SKU</p>
                  <p className="text-sm text-gray-900 font-mono">{product.sku}</p>
                </div>
              </div>
            )}

            {product.barcode && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <QrCode className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Barcode</p>
                  <p className="text-sm text-gray-900 font-mono">{product.barcode}</p>
                </div>
              </div>
            )}

            {product.unit && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Package className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Unit</p>
                  <p className="text-sm text-gray-900 capitalize">{product.unit}</p>
                </div>
              </div>
            )}

            {product.taxRate !== undefined && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Tax Rate</p>
                  <p className="text-sm text-gray-900">{product.taxRate}%</p>
                </div>
              </div>
            )}
          </div>

          {/* Stock Info */}
          {product.trackInventory && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200 mb-6">
              <p className="text-sm text-purple-600 font-medium mb-3">Inventory</p>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <p className="text-2xl font-bold text-purple-600">{product.stock || 0}</p>
                  <p className="text-xs text-purple-600">Total Stock</p>
                </div>
                {product.minStock !== undefined && (
                  <div>
                    <p className="text-lg font-semibold text-purple-600">{product.minStock}</p>
                    <p className="text-xs text-purple-600">Min Stock</p>
                  </div>
                )}
                {product.salesMetrics && (
                  <div>
                    <p className="text-lg font-semibold text-purple-600">{product.salesMetrics.thisMonthSold}</p>
                    <p className="text-xs text-purple-600">Sold (Month)</p>
                  </div>
                )}
              </div>
              
              {/* Stock Locations */}
              {product.stockLocations && product.stockLocations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-purple-200">
                  <p className="text-xs text-purple-600 font-medium mb-2">Stock Locations:</p>
                  <div className="space-y-1">
                    {product.stockLocations.map((loc, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span className="text-purple-700">{loc.warehouseName} ({loc.location})</span>
                        <span className="font-bold text-purple-600">{loc.quantity} units</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sales Metrics */}
          {product.salesMetrics && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 mb-6">
              <p className="text-sm text-green-600 font-medium mb-3">Sales Performance</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold text-green-600">{product.salesMetrics.thisMonthSold}</p>
                  <p className="text-xs text-green-600">This Month</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-green-600">{product.salesMetrics.lastMonthSold}</p>
                  <p className="text-xs text-green-600">Last Month</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-green-600">${product.salesMetrics.revenue.toFixed(0)}</p>
                  <p className="text-xs text-green-600">Revenue</p>
                </div>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
            <Info className="w-4 h-4" />
            <span>Created: {new Date(product.createdAt || Date.now()).toLocaleDateString()}</span>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={() => {
              onAddToCart();
              onClose();
            }}
            disabled={isOutOfStock}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-3 font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-6 h-6" />
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}

