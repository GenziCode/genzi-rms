import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Star, Plus, Minus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { customersService } from '@/services/customers.service';
import type { Customer } from '@/types/customer.types';

interface LoyaltyPointsModalProps {
  customer: Customer;
  onClose: () => void;
}

export default function LoyaltyPointsModal({ customer, onClose }: LoyaltyPointsModalProps) {
  const queryClient = useQueryClient();
  const [action, setAction] = useState<'add' | 'redeem'>('add');
  const [points, setPoints] = useState(0);
  const [reason, setReason] = useState('');

  const addMutation = useMutation({
    mutationFn: (data: { points: number; reason?: string }) =>
      customersService.addLoyaltyPoints(customer._id, data.points, data.reason),
    onSuccess: () => {
      toast.success('Loyalty points added successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer-purchases'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add points');
    },
  });

  const redeemMutation = useMutation({
    mutationFn: (points: number) =>
      customersService.redeemLoyaltyPoints(customer._id, points),
    onSuccess: () => {
      toast.success('Loyalty points redeemed successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer-purchases'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to redeem points');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (points <= 0) {
      toast.error('Points must be greater than 0');
      return;
    }

    if (action === 'add') {
      addMutation.mutate({ points, reason: reason || undefined });
    } else {
      if (points > customer.loyaltyPoints) {
        toast.error('Insufficient loyalty points');
        return;
      }
      redeemMutation.mutate(points);
    }
  };

  const isPending = addMutation.isPending || redeemMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Loyalty Points</h2>
              <p className="text-sm text-gray-600">{customer.name}</p>
            </div>
          </div>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Balance */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-100">
            <p className="text-sm text-gray-600 mb-1">Current Points</p>
            <p className="text-3xl font-bold text-gray-900">{customer.loyaltyPoints.toLocaleString()}</p>
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
              Add Points
            </button>
            <button
              type="button"
              onClick={() => setAction('redeem')}
              className={`px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${
                action === 'redeem'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Minus className="w-4 h-4" />
              Redeem Points
            </button>
          </div>

          {/* Points Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Points to {action === 'add' ? 'Add' : 'Redeem'} *
            </label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
              min="1"
              max={action === 'redeem' ? customer.loyaltyPoints : undefined}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-center text-xl font-bold"
            />
            {action === 'redeem' && points > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                New balance: <span className="font-bold">{customer.loyaltyPoints - points}</span> points
              </p>
            )}
          </div>

          {/* Reason (only for adding) */}
          {action === 'add' && (
            <div>
              <label className="block text-sm font-medium mb-2">Reason</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Purchase bonus, Promotion, etc."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

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
              disabled={isPending || points <= 0}
              className={`flex-1 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 ${
                action === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isPending ? 'Processing...' : action === 'add' ? 'Add Points' : 'Redeem Points'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

