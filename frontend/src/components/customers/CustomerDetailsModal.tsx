import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, User, Mail, Phone, MapPin, CreditCard, Star, ShoppingBag, Calendar, Edit } from 'lucide-react';
import { customersService } from '@/services/customers.service';
import type { Customer } from '@/types/customer.types';
import LoyaltyPointsModal from './LoyaltyPointsModal';
import CreditManagementModal from './CreditManagementModal';

interface CustomerDetailsModalProps {
  customer: Customer;
  onClose: () => void;
  onEdit: () => void;
}

export default function CustomerDetailsModal({ customer, onClose, onEdit }: CustomerDetailsModalProps) {
  const [showLoyalty, setShowLoyalty] = useState(false);
  const [showCredit, setShowCredit] = useState(false);

  // Fetch purchase history
  const { data: purchasesData, isLoading } = useQuery({
    queryKey: ['customer-purchases', customer._id],
    queryFn: () => customersService.getPurchaseHistory(customer._id),
  });

  const purchases = Array.isArray(purchasesData) ? purchasesData : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{customer.name}</h2>
              <p className="text-sm text-gray-600">
                Member since {new Date(customer.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <ShoppingBag className="w-5 h-5" />
                <p className="text-sm font-medium">Total Spent</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">${customer.totalSpent.toLocaleString()}</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <Calendar className="w-5 h-5" />
                <p className="text-sm font-medium">Purchases</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{customer.totalPurchases}</p>
            </div>

            <div 
              className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-100 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setShowLoyalty(true)}
            >
              <div className="flex items-center gap-2 text-yellow-600 mb-2">
                <Star className="w-5 h-5" />
                <p className="text-sm font-medium">Loyalty Points</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{customer.loyaltyPoints}</p>
              <p className="text-xs text-yellow-600 mt-1 font-medium">Click to manage →</p>
            </div>

            <div 
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setShowCredit(true)}
            >
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <CreditCard className="w-5 h-5" />
                <p className="text-sm font-medium">Credit Balance</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">${customer.creditBalance.toLocaleString()}</p>
              <p className="text-xs text-purple-600 mt-1 font-medium">Click to manage →</p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customer.email && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-sm font-medium text-gray-900">{customer.email}</p>
                  </div>
                </div>
              )}

              {customer.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{customer.phone}</p>
                  </div>
                </div>
              )}

              {customer.address && (customer.address.street || customer.address.city) && (
                <div className="flex items-center gap-3 md:col-span-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="text-sm font-medium text-gray-900">
                      {customer.address.street && <>{customer.address.street}<br /></>}
                      {customer.address.city && customer.address.city}
                      {customer.address.state && `, ${customer.address.state}`}
                      {customer.address.zipCode && ` ${customer.address.zipCode}`}
                      {customer.address.country && <br />}
                      {customer.address.country}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Customer Type & Loyalty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-600 mb-2">Customer Type</p>
              <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                {customer.type}
              </span>
            </div>

            {customer.loyaltyTier && (
              <div className="bg-white rounded-lg border p-4">
                <p className="text-sm text-gray-600 mb-2">Loyalty Tier</p>
                <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800 capitalize">
                  {customer.loyaltyTier}
                </span>
              </div>
            )}
          </div>

          {/* Purchase History */}
          <div className="bg-white rounded-lg border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Purchase History</h3>
            </div>
            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading purchases...</p>
                </div>
              ) : purchases.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No purchases yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {purchases.slice(0, 5).map((purchase) => (
                    <div key={purchase._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Sale #{purchase.saleNumber}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(purchase.date).toLocaleDateString()} • {purchase.items} items
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${purchase.total.toLocaleString()}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                          {purchase.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {purchases.length > 5 && (
                    <p className="text-sm text-center text-gray-600 pt-2">
                      And {purchases.length - 5} more purchases...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {customer.notes && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-gray-700">{customer.notes}</p>
            </div>
          )}
        </div>

        {/* Loyalty & Credit Modals */}
        {showLoyalty && (
          <LoyaltyPointsModal
            customer={customer}
            onClose={() => setShowLoyalty(false)}
          />
        )}

        {showCredit && (
          <CreditManagementModal
            customer={customer}
            onClose={() => setShowCredit(false)}
          />
        )}
      </div>
    </div>
  );
}

