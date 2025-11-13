import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Award,
  ShoppingBag,
  DollarSign,
  Clock,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { Customer } from '@/types/pos.types';
import { posService } from '@/services/pos.service';

interface CustomerQuickViewProps {
  customer: Customer;
  onClose: () => void;
}

export default function CustomerQuickView({
  customer,
  onClose,
}: CustomerQuickViewProps) {
  // Fetch customer's recent sales/transactions
  const { data: salesData } = useQuery({
    queryKey: ['customer-sales', customer._id],
    queryFn: () => posService.getSales({ customerId: customer._id, limit: 10 }),
  });

  const recentSales = salesData?.sales || [];
  const totalSpent = recentSales.reduce(
    (sum, sale) => sum + Number(sale.grandTotal ?? 0),
    0
  );
  const totalOrders = recentSales.length;
  const averageOrder = totalOrders > 0 ? totalSpent / totalOrders : 0;

  // Loyalty value
  const loyaltyValue = customer.loyaltyPoints
    ? customer.loyaltyPoints * 0.01
    : 0; // $0.01 per point

  // Credit summary
  const creditLimit = customer.creditLimit ?? 0;
  const creditUsed = customer.creditBalance ?? 0;
  const creditAvailable = Math.max(creditLimit - creditUsed, 0);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{customer.name}</h2>
              <p className="text-blue-100">
                Customer ID: {customer._id.slice(-8)}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <p className="text-blue-100 text-xs mb-1">Total Spent</p>
              <p className="text-2xl font-bold">
                ${Number(totalSpent || 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <p className="text-blue-100 text-xs mb-1">Orders</p>
              <p className="text-2xl font-bold">{totalOrders}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <p className="text-blue-100 text-xs mb-1">Avg Order</p>
              <p className="text-2xl font-bold">
                ${Number(averageOrder || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {/* Contact Info */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">
                    {customer.phone}
                  </p>
                </div>
              </div>

              {customer.email && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">
                      {customer.email}
                    </p>
                  </div>
                </div>
              )}

              {customer.address && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-sm font-medium text-gray-900">
                      {customer.address}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Loyalty & Balance */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-700 font-medium">
                  Loyalty Points
                </p>
              </div>
              <p className="text-3xl font-bold text-yellow-600">
                {customer.loyaltyPoints || 0}
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Worth ${loyaltyValue.toFixed(2)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-700 font-medium">
                  Credit Summary
                </p>
              </div>
              <div className="space-y-1 text-sm text-green-700">
                <p>
                  Limit:{' '}
                  <span className="font-semibold text-green-800">
                    ${creditLimit.toFixed(2)}
                  </span>
                </p>
                <p>
                  Used:{' '}
                  <span className="font-semibold text-amber-600">
                    ${creditUsed.toFixed(2)}
                  </span>
                </p>
                <p>
                  Available:{' '}
                  <span className="font-semibold text-emerald-600">
                    ${creditAvailable.toFixed(2)}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Recent Transactions
            </h3>
            {recentSales.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentSales.slice(0, 5).map((sale) => (
                  <div
                    key={sale._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          #{sale.saleNumber}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        ${Number(sale.grandTotal ?? 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {sale.items.length} items
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
