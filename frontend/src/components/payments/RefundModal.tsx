import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { paymentsService } from '@/services/payments.service';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface RefundModalProps {
    paymentId: string;
    amount: number;
    currency: string;
    onClose: () => void;
}

export default function RefundModal({
    paymentId,
    amount,
    currency,
    onClose,
}: RefundModalProps) {
    const queryClient = useQueryClient();
    const [refundAmount, setRefundAmount] = useState(amount.toString());
    const [reason, setReason] = useState('');

    const refundMutation = useMutation({
        mutationFn: (data: { amount: number; reason: string }) =>
            paymentsService.refund(paymentId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            toast.success('Payment refunded successfully');
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to process refund');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const val = parseFloat(refundAmount);
        if (isNaN(val) || val <= 0 || val > amount) {
            toast.error('Invalid refund amount');
            return;
        }
        refundMutation.mutate({ amount: val, reason });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">Refund Payment</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <p className="text-sm text-amber-800">
                            This action cannot be undone. The funds will be returned to the
                            customer's original payment method.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Refund Amount ({currency})
                        </label>
                        <input
                            type="number"
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            max={amount}
                            min={0.01}
                            step="0.01"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Maximum refundable: {formatCurrency(amount)}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason (Optional)
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            placeholder="e.g. Customer requested refund, accidental charge..."
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={refundMutation.isPending}
                            className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
                        >
                            {refundMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                'Process Refund'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
