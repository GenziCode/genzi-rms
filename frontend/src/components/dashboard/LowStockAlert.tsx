import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Package, TrendingDown } from 'lucide-react';
import { productsService } from '@/services/products.service';

export default function LowStockAlert() {
  const navigate = useNavigate();

  const { data: lowStockProducts } = useQuery({
    queryKey: ['products', 'low-stock'],
    queryFn: () => productsService.getLowStock(),
    refetchInterval: 60000, // Refresh every minute
  });

  const products = (lowStockProducts || []).slice(0, 5);

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold text-gray-900">Low Stock Alerts</h3>
        </div>
        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
          {products.length}
        </span>
      </div>
      <div className="divide-y divide-gray-100">
        {products.slice(0, 5).map((product: any) => (
          <div
            key={product._id}
            className="p-4 hover:bg-orange-50 transition-colors cursor-pointer"
            onClick={() => navigate('/inventory')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-600">SKU: {product.sku}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-orange-600 flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" />
                  {product.stock || 0} left
                </p>
                <p className="text-xs text-gray-500">
                  Min: {product.minStock || product.reorderPoint || 10}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 bg-gray-50 text-center">
        <button
          onClick={() => navigate('/inventory')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All Low Stock Items →
        </button>
      </div>
    </div>
  );
}
