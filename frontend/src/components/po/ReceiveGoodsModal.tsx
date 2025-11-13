import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Package, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { purchaseOrdersService } from '@/services/purchaseOrders.service';
import type { PurchaseOrder } from '@/types/purchaseOrder.types';

interface ReceiveGoodsModalProps {
  purchaseOrder: PurchaseOrder;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReceiveGoodsModal({ purchaseOrder, onClose, onSuccess }: ReceiveGoodsModalProps) {
  const [receivedItems, setReceivedItems] = useState(
    purchaseOrder.items.map(item => ({
      productId: item.productId,
      productName: item.productName || '',
      orderedQty: item.quantity,
      receivedQty: item.receivedQuantity || 0,
      toReceive: item.quantity - (item.receivedQuantity || 0),
    }))
  );

  const receiveMutation = useMutation({
    mutationFn: (data: any) => purchaseOrdersService.receive(purchaseOrder._id, data),
    onSuccess: () => {
      toast.success('Goods received successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to receive goods');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const itemsToReceive = receivedItems
      .filter(item => item.toReceive > 0)
      .map(item => ({
        productId: item.productId,
        receivedQuantity: item.toReceive,
      }));

    if (itemsToReceive.length === 0) {
      toast.error('Please specify quantities to receive');
      return;
    }

    receiveMutation.mutate({
      items: itemsToReceive,
      receivedDate: new Date().toISOString(),
    });
  };

  const updateQuantity = (index: number, qty: number) => {
    const newItems = [...receivedItems];
    const maxQty = newItems[index].orderedQty - newItems[index].receivedQty;
    newItems[index].toReceive = Math.min(Math.max(0, qty), maxQty);
    setReceivedItems(newItems);
  };

  const receiveAll = () => {
    setReceivedItems(receivedItems.map(item => ({
      ...item,
      toReceive: item.orderedQty - item.receivedQty,
    })));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Receive Goods (GRN)</h2>
              <p className="text-sm text-gray-600">PO: {purchaseOrder.poNumber}</p>
            </div>
          </div>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">Update quantities being received</p>
            <button
              type="button"
              onClick={receiveAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Receive All Pending
            </button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ordered</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receive Now</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {receivedItems.map((item, index) => {
                  const pending = item.orderedQty - item.receivedQty;
                  return (
                    <tr key={index} className={pending === 0 ? 'bg-gray-50' : ''}>
                      <td className="px-4 py-3">{item.productName}</td>
                      <td className="px-4 py-3">{item.orderedQty}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">{item.receivedQty}</td>
                      <td className="px-4 py-3 text-orange-600 font-medium">{pending}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.toReceive}
                          onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 0)}
                          min="0"
                          max={pending}
                          disabled={pending === 0}
                          className="w-24 px-3 py-1.5 border rounded focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={receiveMutation.isPending}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {receiveMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Receiving...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Receive Goods
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

