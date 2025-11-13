import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { inventoryService } from '@/services/inventory.service';
import type { StockAlert } from '@/types/inventory.types';

interface StockAlertsWidgetProps {
  alerts: StockAlert[];
  isLoading: boolean;
}

export default function StockAlertsWidget({ alerts, isLoading }: StockAlertsWidgetProps) {
  const queryClient = useQueryClient();

  const acknowledgeMutation = useMutation({
    mutationFn: inventoryService.acknowledgeAlert,
    onSuccess: () => {
      toast.success('Alert acknowledged');
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
    },
    onError: () => {
      toast.error('Failed to acknowledge alert');
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow border p-12 text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading alerts...</p>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow border p-12 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">All Good!</h3>
        <p className="text-gray-600">No active inventory alerts</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          Active Alerts ({alerts.length})
        </h2>
      </div>
      <div className="divide-y divide-gray-200">
        {alerts.map((alert) => (
          <div key={alert._id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  alert.type === 'out_of_stock' ? 'bg-red-100' :
                  alert.type === 'low_stock' ? 'bg-yellow-100' :
                  'bg-blue-100'
                }`}>
                  <Package className={`w-6 h-6 ${
                    alert.type === 'out_of_stock' ? 'text-red-600' :
                    alert.type === 'low_stock' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{alert.productName}</h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Current Stock:</span>{' '}
                      <span className={`font-bold ${
                        alert.currentStock === 0 ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {alert.currentStock}
                      </span>
                    </p>
                    {alert.minStock !== undefined && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Min Stock:</span> {alert.minStock}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Store:</span> {alert.storeName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                  alert.type === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                  alert.type === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {alert.type.replace('_', ' ').toUpperCase()}
                </span>
                <button
                  onClick={() => acknowledgeMutation.mutate(alert._id)}
                  disabled={acknowledgeMutation.isPending}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                >
                  Acknowledge
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

