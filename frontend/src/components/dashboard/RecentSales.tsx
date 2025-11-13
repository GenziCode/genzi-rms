import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Sale {
  _id: string;
  saleNumber: string;
  total: number;
  items: number;
  customerName?: string;
  createdAt: string;
}

interface RecentSalesProps {
  sales: Sale[];
}

function RecentSales({ sales }: RecentSalesProps) {
  if (sales.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Sales
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No sales yet</p>
          <Link
            to="/pos"
            className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            Make your first sale
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
        <Link
          to="/sales"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View all
        </Link>
      </div>
      <div className="space-y-3">
        {sales.map((sale) => (
          <div
            key={sale._id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <div className="flex-1">
              <p className="font-medium text-gray-900">{sale.saleNumber}</p>
              <p className="text-sm text-gray-500">
                {sale.items} items
                {sale.customerName && ` • ${sale.customerName}`}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatDate(sale.createdAt, 'long')}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">
                {formatCurrency(sale.total)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentSales;

