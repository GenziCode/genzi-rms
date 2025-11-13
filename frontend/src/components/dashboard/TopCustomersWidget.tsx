import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Users, Star } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { reportsService } from '@/services/reports.service';

export default function TopCustomersWidget() {
  const navigate = useNavigate();

  const {
    data: customerData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['customer-insights', 'week'],
    queryFn: () => reportsService.getCustomerInsights({ period: 'week' }),
    refetchInterval: 60000,
  });

  const topCustomers = customerData?.topCustomers ?? [];

  let body: ReactNode = topCustomers.slice(0, 5).map((customer, index) => {
    const displayName =
      customer.customerName?.trim() ||
      (customer as any).name?.trim() ||
      'Guest';
    const visits = Number.isFinite(customer.visits) ? customer.visits : 0;
    const avgOrder = Number.isFinite(customer.avgOrderValue)
      ? customer.avgOrderValue
      : 0;
    const totalSpent = Number.isFinite(customer.totalSpent)
      ? customer.totalSpent
      : 0;

    return (
    <div
      key={customer.customerId ?? index}
      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => navigate('/customers')}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm">
            #{index + 1}
          </div>
          <div>
              <p className="font-medium text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-600">
                {visits} visits · {formatCurrency(avgOrder)} avg
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(totalSpent)}
          </p>
        </div>
      </div>
    </div>
    );
  });

  if (isLoading) {
    body = (
      <div className="p-6 space-y-3">
        {[...Array(3)].map((_, idx) => (
          <div
            key={idx}
            className="h-12 bg-gray-100 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  } else if (isError || topCustomers.length === 0) {
    body = (
      <div className="p-8 text-center">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">
          {isError
            ? 'Unable to load customer insights'
            : 'No customer data yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold text-gray-900">Top Customers</h3>
        </div>
        <span className="text-xs text-gray-500">This Week</span>
      </div>
      <div className="divide-y divide-gray-100">{body}</div>
    </div>
  );
}
