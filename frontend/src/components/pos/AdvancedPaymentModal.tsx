import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Smartphone, Building, Gift, X, Plus, Minus, Calculator } from 'lucide-react';
import { usePOSStore } from '@/store/posStore';
import { useAuthStore } from '@/store/authStore';

interface PaymentMethod {
  id: string;
  name: string;
  icon: any;
  color: string;
  maxAmount?: number;
  requiresApproval?: boolean;
}

interface PaymentSplit {
  method: string;
  amount: number;
  reference?: string;
  approvalCode?: string;
}

interface AdvancedPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onPaymentComplete: (payments: PaymentSplit[]) => void;
}

export default function AdvancedPaymentModal({
  isOpen,
  onClose,
  total,
  onPaymentComplete
}: AdvancedPaymentModalProps) {
  const { user } = useAuthStore();
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [reference, setReference] = useState('');
  const [showLayaway, setShowLayaway] = useState(false);
  const [layawayDetails, setLayawayDetails] = useState({
    downPayment: '',
    installments: '3',
    frequency: 'monthly',
    notes: ''
  });

  const paymentMethods: PaymentMethod[] = [
    { id: 'cash', name: 'Cash', icon: DollarSign, color: 'bg-green-500' },
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, color: 'bg-blue-500' },
    { id: 'mobile', name: 'Mobile Payment', icon: Smartphone, color: 'bg-purple-500' },
    { id: 'bank', name: 'Bank Transfer', icon: Building, color: 'bg-indigo-500' },
    { id: 'gift', name: 'Gift Card', icon: Gift, color: 'bg-pink-500' },
    { id: 'check', name: 'Check', icon: Building, color: 'bg-gray-500' }
  ];

  const remainingAmount = total - paymentSplits.reduce((sum, payment) => sum + payment.amount, 0);

  const addPaymentSplit = () => {
    const amount = parseFloat(paymentAmount);
    if (!selectedMethod || !amount || amount <= 0) {
      alert('Please select a payment method and enter a valid amount');
      return;
    }

    if (amount > remainingAmount) {
      alert('Payment amount cannot exceed remaining balance');
      return;
    }

    const newSplit: PaymentSplit = {
      method: selectedMethod,
      amount,
      reference: reference || undefined
    };

    setPaymentSplits([...paymentSplits, newSplit]);
    setPaymentAmount('');
    setReference('');
    setSelectedMethod('');
  };

  const removePaymentSplit = (index: number) => {
    setPaymentSplits(paymentSplits.filter((_, i) => i !== index));
  };

  const handlePaymentComplete = () => {
    if (remainingAmount > 0.01) {
      alert('Please complete the full payment amount');
      return;
    }

    if (showLayaway) {
      // Handle layaway logic
      const downPayment = parseFloat(layawayDetails.downPayment);
      if (downPayment < total * 0.1) { // Minimum 10% down payment
        alert('Down payment must be at least 10% of total amount');
        return;
      }
      // Layaway processing would go here
      alert('Layaway functionality will be implemented with backend integration');
      return;
    }

    onPaymentComplete(paymentSplits);
    onClose();
  };

  const quickPayment = (method: string) => {
    if (remainingAmount <= 0) return;

    const split: PaymentSplit = {
      method,
      amount: remainingAmount
    };

    setPaymentSplits([...paymentSplits, split]);
  };

  const calculateChange = () => {
    const cashPayments = paymentSplits
      .filter(p => p.method === 'cash')
      .reduce((sum, p) => sum + p.amount, 0);

    if (cashPayments > total) {
      return cashPayments - total;
    }
    return 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Advanced Payment Processing</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold text-gray-900">Total Amount</span>
              <span className="text-2xl font-bold text-gray-900">${total.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Remaining Balance</span>
              <span className={`text-lg font-semibold ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ${remainingAmount.toFixed(2)}
              </span>
            </div>
            {calculateChange() > 0 && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t">
                <span className="text-sm text-gray-600">Change Due</span>
                <span className="text-lg font-semibold text-green-600">
                  ${calculateChange().toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Payment Options Toggle */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setShowLayaway(false)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                !showLayaway ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Standard Payment
            </button>
            <button
              onClick={() => setShowLayaway(true)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                showLayaway ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Layaway Plan
            </button>
          </div>

          {!showLayaway ? (
            <>
              {/* Quick Payment Methods */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Payment</h3>
                <div className="grid grid-cols-3 gap-3">
                  {paymentMethods.slice(0, 3).map((method) => (
                    <button
                      key={method.id}
                      onClick={() => quickPayment(method.id)}
                      disabled={remainingAmount <= 0}
                      className={`p-3 border-2 rounded-lg transition ${
                        remainingAmount <= 0
                          ? 'border-gray-200 bg-gray-100 cursor-not-allowed'
                          : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                      }`}
                    >
                      <method.icon className={`w-6 h-6 mx-auto mb-2 ${
                        remainingAmount <= 0 ? 'text-gray-400' : 'text-gray-600'
                      }`} />
                      <p className={`text-sm font-medium ${
                        remainingAmount <= 0 ? 'text-gray-400' : 'text-gray-900'
                      }`}>
                        {method.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        ${remainingAmount.toFixed(2)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Split Payment */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Split Payment</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <select
                      value={selectedMethod}
                      onChange={(e) => setSelectedMethod(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select method</option>
                      {paymentMethods.map((method) => (
                        <option key={method.id} value={method.id}>
                          {method.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Card number, check number, etc."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={addPaymentSplit}
                  disabled={!selectedMethod || !paymentAmount}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Payment Split
                </button>
              </div>

              {/* Payment Splits */}
              {paymentSplits.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Payment Breakdown</h3>
                  <div className="space-y-2">
                    {paymentSplits.map((split, index) => {
                      const method = paymentMethods.find(m => m.id === split.method);
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {method && <method.icon className="w-5 h-5 text-gray-600" />}
                            <div>
                              <p className="font-medium text-gray-900">{method?.name}</p>
                              {split.reference && (
                                <p className="text-sm text-gray-600">Ref: {split.reference}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-900">
                              ${split.amount.toFixed(2)}
                            </span>
                            <button
                              onClick={() => removePaymentSplit(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Layaway Section */
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Layaway Plan Setup</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Down Payment
                  </label>
                  <input
                    type="number"
                    value={layawayDetails.downPayment}
                    onChange={(e) => setLayawayDetails(prev => ({ ...prev, downPayment: e.target.value }))}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum: ${(total * 0.1).toFixed(2)} (10%)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Installments
                  </label>
                  <select
                    value={layawayDetails.installments}
                    onChange={(e) => setLayawayDetails(prev => ({ ...prev, installments: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="3">3 months</option>
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Frequency
                </label>
                <select
                  value={layawayDetails.frequency}
                  onChange={(e) => setLayawayDetails(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={layawayDetails.notes}
                  onChange={(e) => setLayawayDetails(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Special instructions or notes..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Layaway Summary */}
              {layawayDetails.downPayment && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Layaway Summary</h4>
                  <div className="space-y-1 text-sm text-blue-800">
                    <div className="flex justify-between">
                      <span>Down Payment:</span>
                      <span>${parseFloat(layawayDetails.downPayment || '0').toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining Balance:</span>
                      <span>${(total - parseFloat(layawayDetails.downPayment || '0')).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Payment:</span>
                      <span>
                        ${((total - parseFloat(layawayDetails.downPayment || '0')) / parseInt(layawayDetails.installments)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handlePaymentComplete}
              disabled={remainingAmount > 0.01}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {showLayaway ? 'Create Layaway Plan' : 'Complete Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}