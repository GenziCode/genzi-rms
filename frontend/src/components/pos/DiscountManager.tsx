import { useState } from 'react';
import { Tag, Percent, DollarSign, Gift, X } from 'lucide-react';
import { usePOSStore } from '@/store/posStore';

interface DiscountManagerProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
}

interface Coupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  description: string;
}

export default function DiscountManager({ isOpen, onClose, total }: DiscountManagerProps) {
  const { discount, setDiscount } = usePOSStore();
  const [activeTab, setActiveTab] = useState<'manual' | 'coupon'>('manual');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Mock coupon database - in real app, this would come from API
  const availableCoupons: Coupon[] = [
    {
      code: 'WELCOME10',
      type: 'percentage',
      value: 10,
      minPurchase: 50,
      description: '10% off orders over $50'
    },
    {
      code: 'SAVE20',
      type: 'fixed',
      value: 20,
      description: '$20 off any purchase'
    }
  ];

  const applyManualDiscount = (percentage: number) => {
    setDiscount(percentage);
    setAppliedCoupon(null);
    onClose();
  };

  const applyCoupon = () => {
    const coupon = availableCoupons.find(c => c.code.toLowerCase() === couponCode.toLowerCase());
    if (!coupon) {
      alert('Invalid coupon code');
      return;
    }

    if (coupon.minPurchase && total < coupon.minPurchase) {
      alert(`Minimum purchase of $${coupon.minPurchase} required`);
      return;
    }

    setAppliedCoupon(coupon);
    setDiscount(coupon.type === 'fixed' ? (coupon.value / total) * 100 : coupon.value);
    setCouponCode('');
    onClose();
  };

  const removeDiscount = () => {
    setDiscount(0);
    setAppliedCoupon(null);
  };

  const calculateDiscountAmount = () => {
    return (total * discount) / 100;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Apply Discount</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Current Discount Display */}
        {discount > 0 && (
          <div className="px-6 py-4 bg-blue-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">
                  Current Discount: {discount}%
                </p>
                <p className="text-sm text-blue-700">
                  Savings: ${calculateDiscountAmount().toFixed(2)}
                </p>
                {appliedCoupon && (
                  <p className="text-xs text-blue-600">Coupon: {appliedCoupon.code}</p>
                )}
              </div>
              <button
                onClick={removeDiscount}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-6 py-4 border-b">
          <div className="flex space-x-1">
            {[
              { id: 'manual', label: 'Manual', icon: Tag },
              { id: 'coupon', label: 'Coupon', icon: Gift }
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
        <div className="p-6">
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Manual Discount</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => applyManualDiscount(5)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <Percent className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="font-medium">5% Off</p>
                  <p className="text-sm text-gray-600">${(total * 0.05).toFixed(2)}</p>
                </button>
                <button
                  onClick={() => applyManualDiscount(10)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <Percent className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="font-medium">10% Off</p>
                  <p className="text-sm text-gray-600">${(total * 0.1).toFixed(2)}</p>
                </button>
                <button
                  onClick={() => applyManualDiscount(15)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <Percent className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="font-medium">15% Off</p>
                  <p className="text-sm text-gray-600">${(total * 0.15).toFixed(2)}</p>
                </button>
                <button
                  onClick={() => applyManualDiscount(20)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <Percent className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="font-medium">20% Off</p>
                  <p className="text-sm text-gray-600">${(total * 0.2).toFixed(2)}</p>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'coupon' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Coupon Code</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="flex-1 px-3 py-2 border rounded-lg uppercase"
                  onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                />
                <button
                  onClick={applyCoupon}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Apply
                </button>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Available Coupons:</p>
                {availableCoupons.map((coupon) => (
                  <div
                    key={coupon.code}
                    className="p-3 border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{coupon.code}</p>
                        <p className="text-sm text-gray-600">{coupon.description}</p>
                      </div>
                      <button
                        onClick={() => {
                          setCouponCode(coupon.code);
                          applyCoupon();
                        }}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Use
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}