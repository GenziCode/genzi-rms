import { useState, useEffect } from 'react';
import {
  User,
  ShoppingBag,
  TrendingUp,
  Star,
  Clock,
  DollarSign,
  Package,
  Heart,
  X,
  Calendar,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { customersService } from '@/services/customers.service';
import { posService } from '@/services/pos.service';
import type { Customer } from '@/types/pos.types';

interface CustomerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onAddToCart: (product: any) => void;
}

interface PurchaseHistory {
  id: string;
  date: string;
  total: number;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    category: string;
  }>;
  status: string;
}

interface Recommendation {
  productId: string;
  productName: string;
  price: number;
  category: string;
  reason: string;
  confidence: number;
  image?: string;
}

export default function CustomerHistoryModal({
  isOpen,
  onClose,
  customer,
  onAddToCart
}: CustomerHistoryModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'recommendations'>('overview');

  // Mock data - in real app, this would come from APIs
  const mockPurchaseHistory: PurchaseHistory[] = [
    {
      id: 'TXN001',
      date: '2025-11-20',
      total: 127.50,
      status: 'completed',
      items: [
        { productId: '1', productName: 'Wireless Headphones', quantity: 1, price: 89.99, category: 'Electronics' },
        { productId: '2', productName: 'Phone Case', quantity: 1, price: 24.99, category: 'Accessories' },
        { productId: '3', productName: 'Screen Protector', quantity: 1, price: 12.52, category: 'Accessories' }
      ]
    },
    {
      id: 'TXN002',
      date: '2025-11-15',
      total: 89.99,
      status: 'completed',
      items: [
        { productId: '4', productName: 'Bluetooth Speaker', quantity: 1, price: 89.99, category: 'Electronics' }
      ]
    },
    {
      id: 'TXN003',
      date: '2025-11-10',
      total: 156.80,
      status: 'completed',
      items: [
        { productId: '5', productName: 'Laptop Stand', quantity: 2, price: 39.95, category: 'Computer Accessories' },
        { productId: '6', productName: 'USB Cable', quantity: 3, price: 25.63, category: 'Computer Accessories' }
      ]
    }
  ];

  const mockRecommendations: Recommendation[] = [
    {
      productId: '7',
      productName: 'Wireless Charging Pad',
      price: 34.99,
      category: 'Electronics',
      reason: 'Frequently bought with Wireless Headphones',
      confidence: 85,
      image: '/api/placeholder/100/100'
    },
    {
      productId: '8',
      productName: 'Portable Power Bank',
      price: 49.99,
      category: 'Electronics',
      reason: 'Customers also bought',
      confidence: 72,
      image: '/api/placeholder/100/100'
    },
    {
      productId: '9',
      productName: 'Phone Stand',
      price: 19.99,
      category: 'Accessories',
      reason: 'Complements Phone Case purchase',
      confidence: 68,
      image: '/api/placeholder/100/100'
    },
    {
      productId: '10',
      productName: 'Screen Cleaning Kit',
      price: 14.99,
      category: 'Accessories',
      reason: 'Essential accessory for screen protection',
      confidence: 55,
      image: '/api/placeholder/100/100'
    }
  ];

  const calculateCustomerInsights = () => {
    const totalSpent = mockPurchaseHistory.reduce((sum, purchase) => sum + purchase.total, 0);
    const totalOrders = mockPurchaseHistory.length;
    const averageOrder = totalSpent / totalOrders;
    const lastPurchase = new Date(Math.max(...mockPurchaseHistory.map(p => new Date(p.date).getTime())));
    const daysSinceLastPurchase = Math.floor((new Date().getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate favorite categories
    const categoryCount: { [key: string]: number } = {};
    mockPurchaseHistory.forEach(purchase => {
      purchase.items.forEach(item => {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + item.quantity;
      });
    });

    const favoriteCategory = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

    return {
      totalSpent,
      totalOrders,
      averageOrder,
      lastPurchase,
      daysSinceLastPurchase,
      favoriteCategory
    };
  };

  const insights = calculateCustomerInsights();

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{customer.name}</h2>
              <p className="text-sm text-gray-600">Customer since {new Date(customer.createdAt || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Customer Quick Info */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">{customer.email}</span>
            </div>
            {customer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{customer.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">Regular Customer</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-700">VIP Member</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-4 border-b">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'history', label: 'Purchase History', icon: ShoppingBag },
              { id: 'recommendations', label: 'Recommendations', icon: Heart }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Total Spent</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">${insights.totalSpent.toFixed(2)}</p>
                  <p className="text-sm text-blue-700">Lifetime value</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingBag className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Total Orders</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">{insights.totalOrders}</p>
                  <p className="text-sm text-green-700">All time</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Avg Order</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">${insights.averageOrder.toFixed(2)}</p>
                  <p className="text-sm text-purple-700">Per transaction</p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-900">Last Purchase</span>
                  </div>
                  <p className="text-lg font-bold text-orange-900">{insights.daysSinceLastPurchase}</p>
                  <p className="text-sm text-orange-700">Days ago</p>
                </div>
              </div>

              {/* Customer Insights */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Shopping Preferences</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Favorite Category:</span>
                        <span className="text-sm font-medium text-gray-900">{insights.favoriteCategory}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Preferred Payment:</span>
                        <span className="text-sm font-medium text-gray-900">Credit Card</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Shopping Frequency:</span>
                        <span className="text-sm font-medium text-gray-900">Bi-weekly</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Loyalty Status</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Current Tier:</span>
                        <span className="text-sm font-medium text-green-600">Gold Member</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Points Balance:</span>
                        <span className="text-sm font-medium text-gray-900">2,450</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Next Tier:</span>
                        <span className="text-sm font-medium text-gray-900">850 points</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {mockPurchaseHistory.slice(0, 3).map((purchase) => (
                    <div key={purchase.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Purchase #{purchase.id}</p>
                          <p className="text-sm text-gray-600">
                            {purchase.items.length} item{purchase.items.length !== 1 ? 's' : ''} • {new Date(purchase.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">${purchase.total.toFixed(2)}</p>
                        <p className="text-sm text-green-600">Completed</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Purchase History</h3>
                <div className="text-sm text-gray-600">
                  {mockPurchaseHistory.length} total orders
                </div>
              </div>

              <div className="space-y-4">
                {mockPurchaseHistory.map((purchase) => (
                  <div key={purchase.id} className="bg-white border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">Order #{purchase.id}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(purchase.date).toLocaleDateString()} • {purchase.items.length} items
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">${purchase.total.toFixed(2)}</p>
                        <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                          {purchase.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {purchase.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                          <div className="flex items-center gap-3">
                            <Package className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="font-medium text-gray-900">{item.productName}</p>
                              <p className="text-sm text-gray-600">{item.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-900">
                              {item.quantity}x ${item.price.toFixed(2)}
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              ${(item.quantity * item.price).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Personalized Recommendations</h3>
                <div className="text-sm text-gray-600">
                  Based on purchase history and preferences
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockRecommendations.map((recommendation) => (
                  <div key={recommendation.productId} className="bg-white border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{recommendation.productName}</h4>
                        <p className="text-sm text-gray-600">{recommendation.category}</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">${recommendation.price.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-gray-700 mb-2">{recommendation.reason}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${recommendation.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600">{recommendation.confidence}% match</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        // Mock product object for cart addition
                        const product = {
                          _id: recommendation.productId,
                          name: recommendation.productName,
                          price: recommendation.price,
                          category: recommendation.category,
                          stock: 10 // Mock stock
                        };
                        onAddToCart(product);
                        onClose();
                      }}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">How Recommendations Work</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Based on your purchase history and preferences</li>
                  <li>• Analyzes frequently bought together items</li>
                  <li>• Considers category preferences and spending patterns</li>
                  <li>• Updates in real-time as you shop</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}