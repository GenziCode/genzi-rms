import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { posService } from '@/services/pos.service';

export default function RecentActivity() {
  const {
    data: recentSales,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['recent-sales'],
    queryFn: () => posService.getSales({ limit: 5, page: 1 }),
    refetchInterval: 60000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
    staleTime: 30000,
    keepPreviousData: true,
  });

  const sales = recentSales?.sales ?? [];

  let content: ReactNode = sales.map((sale) => {
    const itemsCount =
      sale.items?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) ??
      sale.items?.length ??
      0;
    const computedTotal =
      sale.subtotal + (sale.totalTax ?? 0) - (sale.totalDiscount ?? 0);
    const saleTotal = sale.grandTotal ?? computedTotal ?? sale.amountPaid ?? 0;
    const amountPaid = sale.amountPaid ?? saleTotal;

    return (
      <div key={sale._id} className="p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-start gap-3">
          <div className="mt-1 bg-green-100 text-green-600 rounded-full w-8 h-8 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {sale.saleNumber || 'Sale'}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {itemsCount} {itemsCount === 1 ? 'item' : 'items'} ·{' '}
              {formatCurrency(saleTotal)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(sale.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {formatCurrency(amountPaid)}
          </div>
        </div>
      </div>
    );
  });

  if (isLoading) {
    content = (
      <div className="p-4 space-y-3">
        {[...Array(4)].map((_, idx) => (
          <div
            key={idx}
            className="h-12 bg-gray-100 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  } else if (isError) {
    content = (
      <div className="p-8 text-center">
        <p className="text-gray-500 text-sm mb-3">
          Unable to load recent sales.
        </p>
        <button
          onClick={() => refetch()}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Retry
        </button>
      </div>
    );
  } else if (!recentSales || recentSales.sales.length === 0) {
    content = (
      <div className="p-8 text-center">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No recent transactions.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">Recent Activity</h3>
          {isFetching && !isLoading && (
            <span className="text-xs text-gray-400">Refreshing…</span>
          )}
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          Live
        </div>
      </div>
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {content}
      </div>
    </div>
  );
}
