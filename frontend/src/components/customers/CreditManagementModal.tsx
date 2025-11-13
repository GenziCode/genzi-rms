import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, CreditCard, Plus, Minus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { customersService } from '@/services/customers.service';
import type { Customer } from '@/types/customer.types';

interface CreditManagementModalProps {
  customer: Customer;
  onClose: () => void;
}

export default function CreditManagementModal({ customer, onClose }: CreditManagementModalProps) {
  const queryClient = useQueryClient();
  const [action, setAction] = useState<'add' | 'deduct'>('add');
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState('');

  const addMutation = useMutation({
    mutationFn: (data: { amount: number; notes?: string }) =>
      customersService.addCredit(customer._id, data.amount, data.notes),
    onSuccess: () => {
      toast.success('Credit added successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add credit');
    },
  });

  const deductMutation = useMutation({
    mutationFn: (data: { amount: number; notes?: string }) =>
      customersService.deductCredit(customer._id, data.amount, data.notes),
    onSuccess: () => {
      toast.success('Credit deducted successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to deduct credit');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    if (action === 'deduct' && amount > customer.creditBalance) {
      toast.error('Insufficient credit balance');
      return;
    }

    const data = { amount, notes: notes || undefined };
    if (action === 'add') {
      addMutation.mutate(data);
    } else {
      deductMutation.mutate(data);
    }
  };

  const isPending = addMutation.isPending || deductMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Credit Management</h2>
              <p className="text-sm text-gray-600">{customer.name}</p>
            </div>
          </div>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Balance */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
            <p className="text-sm text-gray-600 mb-1">Current Credit Balance</p>
            <p className="text-3xl font-bold text-gray-900">${customer.creditBalance.toLocaleString()}</p>
            {customer.creditLimit && (
              <p className="text-sm text-gray-600 mt-1">
                Limit: ${customer.creditLimit.toLocaleString()}
              </p>
            )}
          </div>

          {/* Action Type */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAction('add')}
              className={`px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${
                action === 'add'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Plus className="w-4 h-4" />
              Add Credit
            </button>
            <button
              type="button"
              onClick={() => setAction('deduct')}
              className={`px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${
                action === 'deduct'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Minus className="w-4 h-4" />
              Deduct Credit
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Amount to {action === 'add' ? 'Add' : 'Deduct'} *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                min="0.01"
                step="0.01"
                max={action === 'deduct' ? customer.creditBalance : undefined}
                required
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-center text-xl font-bold"
              />
            </div>
            {action === 'deduct' && amount > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                New balance: <span className="font-bold">${(customer.creditBalance - amount).toFixed(2)}</span>
              </p>
            )}
            {action === 'add' && amount > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                New balance: <span className="font-bold">${(customer.creditBalance + amount).toFixed(2)}</span>
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Reason for this transaction..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || amount <= 0}
              className={`flex-1 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 ${
                action === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isPending ? 'Processing...' : action === 'add' ? 'Add Credit' : 'Deduct Credit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

