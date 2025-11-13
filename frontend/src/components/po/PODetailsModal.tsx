import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, FileText, Check, XCircle, Package, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { purchaseOrdersService } from '@/services/purchaseOrders.service';
import type { PurchaseOrder } from '@/types/purchaseOrder.types';

interface PODetailsModalProps {
  purchaseOrder: PurchaseOrder;
  onClose: () => void;
  onReceive: () => void;
}

export default function PODetailsModal({ purchaseOrder, onClose, onReceive }: PODetailsModalProps) {
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: () => purchaseOrdersService.approve(purchaseOrder._id),
    onSuccess: () => {
      toast.success('Purchase Order approved');
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      onClose();
    },
    onError: () => toast.error('Failed to approve PO'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => purchaseOrdersService.cancel(purchaseOrder._id, 'Cancelled by user'),
    onSuccess: () => {
      toast.success('Purchase Order cancelled');
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      onClose();
    },
    onError: () => toast.error('Failed to cancel PO'),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canApprove = purchaseOrder.status === 'draft' || purchaseOrder.status === 'pending';
  const canReceive = purchaseOrder.status === 'approved' || purchaseOrder.status === 'ordered';
  const canCancel = purchaseOrder.status !== 'received' && purchaseOrder.status !== 'cancelled';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Purchase Order Details</h2>
              <p className="text-sm text-gray-600">PO #{purchaseOrder.poNumber}</p>
            </div>
          </div>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Vendor</p>
              <p className="font-semibold text-gray-900">{purchaseOrder.vendorName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(purchaseOrder.status)}`}>
                {purchaseOrder.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Order Date</p>
              <p className="text-gray-900">{new Date(purchaseOrder.orderDate).toLocaleDateString()}</p>
            </div>
            {purchaseOrder.expectedDeliveryDate && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Expected Delivery</p>
                <p className="text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(purchaseOrder.expectedDeliveryDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div>
            <h3 className="font-semibold mb-3">Items</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ordered</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {purchaseOrder.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 font-medium">{item.productName || item.productId}</td>
                      <td className="px-4 py-3">{item.quantity}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">{item.receivedQuantity || 0}</td>
                      <td className="px-4 py-3">${item.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 font-medium">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">${purchaseOrder.subtotal.toFixed(2)}</span>
            </div>
            {purchaseOrder.shippingCost > 0 && (
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span className="font-medium">${purchaseOrder.shippingCost.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Grand Total:</span>
              <span>${purchaseOrder.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          {purchaseOrder.notes && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-gray-700">{purchaseOrder.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              Close
            </button>
            
            {canApprove && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Approve this purchase order?')) {
                    approveMutation.mutate();
                  }
                }}
                disabled={approveMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Approve
              </button>
            )}

            {canReceive && (
              <button
                type="button"
                onClick={onReceive}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                Receive Goods
              </button>
            )}

            {canCancel && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Cancel this purchase order?')) {
                    cancelMutation.mutate();
                  }
                }}
                disabled={cancelMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Cancel PO
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

