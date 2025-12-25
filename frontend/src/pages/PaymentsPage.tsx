import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { paymentsService, type Payment } from '@/services/payments.service';
import PaymentCreateModal from '@/components/payments/PaymentCreateModal';
import RefundModal from '@/components/payments/RefundModal';

export default function PaymentsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refundPayment, setRefundPayment] = useState<Payment | null>(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
  });

  // Fetch payments
  const { data, isLoading } = useQuery({
    queryKey: ['payments', filters],
    queryFn: () => paymentsService.getAll(filters),
  });

  const payments = data?.payments || [];
  const pagination = data?.pagination;

  const getStatusBadge = (status: Payment['status']) => {
    const styles = {
      pending: 'bg-gray-100 text-gray-700',
      processing: 'bg-blue-100 text-blue-700',
      succeeded: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      refunded: 'bg-orange-100 text-orange-700',
      cancelled: 'bg-gray-200 text-gray-600',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status]}`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">Manage payment transactions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <CreditCard className="w-5 h-5 mr-2" />
          New Payment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">
                {payments.length}
              </p>
            </div>
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Succeeded</p>
              <p className="text-2xl font-bold text-green-600">
                {payments.filter((p) => p.status === 'succeeded').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {
                  payments.filter(
                    (p) => p.status === 'pending' || p.status === 'processing'
                  ).length
                }
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">
                {payments.filter((p) => p.status === 'failed').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Payments List */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payments...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No payments yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start accepting payments to see them here
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Create Payment
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-gray-900">
                      {payment._id.slice(-8)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600 capitalize">
                      {payment.method.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(payment.status)}
                      {getStatusBadge(payment.status)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {payment.status === 'succeeded' && (
                      <button
                        onClick={() => setRefundPayment(payment)}
                        className="text-orange-600 hover:text-orange-700 font-medium"
                      >
                        Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Payment Modal */}
      {showCreateModal && (
        <PaymentCreateModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Refund Modal */}
      {refundPayment && (
        <RefundModal
          paymentId={refundPayment._id}
          amount={refundPayment.amount}
          currency={refundPayment.currency}
          onClose={() => setRefundPayment(null)}
        />
      )}
    </div>
  );
}
