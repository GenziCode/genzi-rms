import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, DollarSign } from 'lucide-react';
import { invoiceService } from '@/services/invoice.service';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface RecordPaymentModalProps {
  invoiceId: string;
  amountDue: number;
  onClose: () => void;
}

export default function RecordPaymentModal({
  invoiceId,
  amountDue,
  onClose,
}: RecordPaymentModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    method: 'cash',
    amount: amountDue.toString(),
    reference: '',
    date: new Date().toISOString().split('T')[0],
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (data: any) => invoiceService.recordPayment(invoiceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Payment recorded successfully!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    if (amount <= 0 || amount > amountDue) {
      toast.error(
        `Payment amount must be between $0.01 and ${formatCurrency(amountDue)}`
      );
      return;
    }

    recordPaymentMutation.mutate({
      ...formData,
      amount,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
            <p className="text-sm text-gray-600 mt-1">
              Amount Due:{' '}
              <span className="font-semibold text-orange-600">
                {formatCurrency(amountDue)}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.method}
              onChange={(e) =>
                setFormData({ ...formData, method: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="check">Check</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                step="0.01"
                min="0.01"
                max={amountDue}
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Maximum: {formatCurrency(amountDue)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Number
            </label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) =>
                setFormData({ ...formData, reference: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Check #, Transaction ID, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recordPaymentMutation.isPending}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <DollarSign className="w-5 h-5 mr-2" />
              {recordPaymentMutation.isPending
                ? 'Recording...'
                : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
