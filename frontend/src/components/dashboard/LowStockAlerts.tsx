import { AlertTriangle, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LowStockProduct {
  _id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
}

interface LowStockAlertsProps {
  products: LowStockProduct[];
}

function LowStockAlerts({ products }: LowStockAlertsProps) {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Stock Alerts</h3>
          <div className="flex items-center text-green-600">
            <Package className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium">All Good</span>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          No low stock alerts. Inventory levels are healthy!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Stock Alerts</h3>
        <div className="flex items-center text-red-600">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span className="text-sm font-medium">{products.length} Items</span>
        </div>
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {products.map((product) => (
          <div
            key={product._id}
            className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
          >
            <div className="flex-1">
              <p className="font-medium text-gray-900">{product.name}</p>
              <p className="text-sm text-gray-500">{product.sku}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-red-600">
                {product.currentStock} left
              </p>
              <p className="text-xs text-gray-500">
                Min: {product.minStock}
              </p>
            </div>
          </div>
        ))}
      </div>
      <Link
        to="/inventory"
        className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
      >
        View Inventory
      </Link>
    </div>
  );
}

export default LowStockAlerts;

