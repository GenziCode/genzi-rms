import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, CreditCard, Loader2, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentsService } from '@/services/payments.service';

interface PaymentCreateModalProps {
  onClose: () => void;
}

export default function PaymentCreateModal({
  onClose,
}: PaymentCreateModalProps) {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    method: 'stripe' as 'stripe' | 'cash' | 'bank_transfer',
    customerId: '',
    invoiceId: '',
    description: '',
  });

  // Mock mutation for non-stripe payments or simulated stripe
  const createPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (data.method === 'stripe') {
        // In a real app, we would:
        // 1. Call paymentsService.createIntent(data) to get clientSecret
        // 2. Use stripe.confirmCardPayment(clientSecret)
        // 3. Backend webhook would update status to 'succeeded'
        return { status: 'succeeded', id: 'mock_stripe_' + Date.now() };
      }

      // For cash/bank transfer, we would call a create endpoint
      // return paymentsService.create(data);
      return { status: 'succeeded', id: 'mock_cash_' + Date.now() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment processed successfully!');
      onClose();
    },
    onError: () => {
      toast.error('Failed to process payment');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      await createPaymentMutation.mutateAsync({
        ...formData,
        amount: parseFloat(formData.amount),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Create Payment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                $
              </span>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                step="0.01"
                min="0.01"
                required
                disabled={isProcessing}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              value={formData.method}
              onChange={(e) =>
                setFormData({ ...formData, method: e.target.value as any })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isProcessing}
            >
              <option value="stripe">Credit Card (Stripe)</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          {formData.method === 'stripe' && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
                <CreditCard className="w-4 h-4" />
                <span>Card Details</span>
              </div>
              {/* Mock Stripe Element */}
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Card number"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm"
                  disabled
                  value="4242 4242 4242 4242"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="MM / YY"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm"
                    disabled
                    value="12 / 25"
                  />
                  <input
                    type="text"
                    placeholder="CVC"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm"
                    disabled
                    value="123"
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
                <Lock className="w-3 h-3" />
                Payments are secure and encrypted
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Payment for..."
              disabled={isProcessing}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-70"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay {formData.amount ? `$${formData.amount}` : ''}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
