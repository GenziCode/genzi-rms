import { useQuery } from '@tanstack/react-query';
import { X, Clock, ShoppingCart, User, DollarSign, Calendar } from 'lucide-react';
import { posService } from '@/services/pos.service';
import type { Sale } from '@/types/pos.types';

interface HeldTransactionsProps {
  onClose: () => void;
  onResume: (sale: Sale) => void;
}

export default function HeldTransactions({ onClose, onResume }: HeldTransactionsProps) {
  const { data: heldTransactions = [], isLoading } = useQuery({
    queryKey: ['held-transactions'],
    queryFn: posService.getHeldTransactions,
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-amber-600" />
              Held Transactions
            </h2>
          <p className="text-sm text-gray-600">
            {heldTransactions?.length || 0} {(heldTransactions?.length || 0) === 1 ? 'transaction' : 'transactions'} on hold
          </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-md hover:bg-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mb-4"></div>
              <p className="text-gray-600">Loading held transactions...</p>
            </div>
          ) : (heldTransactions?.length || 0) === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No held transactions</h3>
              <p className="text-gray-500 text-center max-w-md">
                When you hold a transaction, it will appear here for you to resume later
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(heldTransactions || []).map((sale) => (
                <HeldTransactionCard
                  key={sale._id}
                  sale={sale}
                  onResume={() => onResume(sale)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HeldTransactionCard({ sale, onResume }: { sale: Sale; onResume: () => void }) {
  const resolvedGrandTotal = Number(sale.grandTotal ?? sale.subtotal ?? 0);

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-lg p-4 hover:border-amber-500 hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">#{sale.saleNumber}</h3>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(sale.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Customer */}
      {sale.customer && (
        <div className="mb-3 flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700">{sale.customer.name}</span>
        </div>
      )}

      {/* Items */}
      <div className="mb-3 space-y-1">
        {sale.items.slice(0, 3).map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-gray-600 truncate flex-1">
              {item.quantity}x {item.productName}
            </span>
            <span className="text-gray-900 font-medium ml-2">
              ${Number(item.total ?? item.unitPrice ?? 0).toFixed(2)}
            </span>
          </div>
        ))}
        {sale.items.length > 3 && (
          <p className="text-xs text-gray-500 italic">
            +{sale.items.length - 3} more items
          </p>
        )}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 mb-3">
        <span className="text-sm font-medium text-gray-600">Total:</span>
        <span className="text-xl font-bold text-gray-900 flex items-center gap-1">
          <DollarSign className="w-5 h-5" />
          {resolvedGrandTotal.toFixed(2)}
        </span>
      </div>

      {/* Notes */}
      {sale.notes && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          {sale.notes}
        </div>
      )}

      {/* Resume Button */}
      <button
        onClick={onResume}
        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-2.5 px-4 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all font-medium shadow-md"
      >
        Resume Transaction
      </button>
    </div>
  );
}

