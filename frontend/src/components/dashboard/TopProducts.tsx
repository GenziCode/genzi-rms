import { formatCurrency } from '@/lib/utils';
import type { TopProduct } from '@/types/reports.types';

interface TopProductsProps {
  products: TopProduct[];
}

function TopProducts({ products }: TopProductsProps) {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top Products
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No product sales yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Qty Sold
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Revenue
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product, index) => (
              <tr key={product._id} className="hover:bg-gray-50">
                <td className="px-3 py-4 whitespace-nowrap">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.sku}</p>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded">
                    {product.totalQuantity}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(product.totalRevenue)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {product.transactionCount} transactions
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TopProducts;

