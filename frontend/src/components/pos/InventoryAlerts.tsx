import { useState, useEffect } from 'react';
import { AlertTriangle, Package, ShoppingCart, TrendingDown, X } from 'lucide-react';
import { usePOSStore } from '@/store/posStore';
import type { CartItem } from '@/types/pos.types';

interface InventoryAlertsProps {
  isVisible: boolean;
}

interface LowStockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  cartQuantity: number;
  severity: 'warning' | 'critical';
}

export default function InventoryAlerts({ isVisible }: InventoryAlertsProps) {
  const { cart } = usePOSStore();
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isVisible) return;

    const newAlerts: LowStockAlert[] = [];

    cart.forEach((item: CartItem) => {
      if (!item.product.trackInventory) return;

      const currentStock = item.product.stock || 0;
      const minStock = item.product.minStock || 0;
      const cartQuantity = item.quantity;
      const remainingStock = currentStock - cartQuantity;

      // Check for low stock after this sale
      if (remainingStock <= 0) {
        newAlerts.push({
          productId: item.product._id,
          productName: item.product.name,
          currentStock,
          minStock,
          cartQuantity,
          severity: 'critical'
        });
      } else if (remainingStock <= minStock && minStock > 0) {
        newAlerts.push({
          productId: item.product._id,
          productName: item.product.name,
          currentStock,
          minStock,
          cartQuantity,
          severity: 'warning'
        });
      }
    });

    setAlerts(newAlerts);
  }, [cart, isVisible]);

  const dismissAlert = (productId: string) => {
    setDismissedAlerts(prev => new Set([...prev, productId]));
  };

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.productId));

  if (!isVisible || visibleAlerts.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      {visibleAlerts.map((alert) => (
        <div
          key={alert.productId}
          className={`p-3 rounded-lg border flex items-start gap-3 ${
            alert.severity === 'critical'
              ? 'bg-red-50 border-red-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}
        >
          <div className={`p-1 rounded ${
            alert.severity === 'critical' ? 'bg-red-100' : 'bg-yellow-100'
          }`}>
            {alert.severity === 'critical' ? (
              <Package className={`w-4 h-4 ${
                alert.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
              }`} />
            ) : (
              <TrendingDown className={`w-4 h-4 ${
                alert.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
              }`} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className={`w-4 h-4 ${
                alert.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
              }`} />
              <span className={`text-sm font-medium ${
                alert.severity === 'critical' ? 'text-red-900' : 'text-yellow-900'
              }`}>
                {alert.severity === 'critical' ? 'Out of Stock Alert' : 'Low Stock Warning'}
              </span>
            </div>

            <p className={`text-sm mb-2 ${
              alert.severity === 'critical' ? 'text-red-800' : 'text-yellow-800'
            }`}>
              <strong>{alert.productName}</strong>
            </p>

            <div className={`text-xs space-y-1 ${
              alert.severity === 'critical' ? 'text-red-700' : 'text-yellow-700'
            }`}>
              <div className="flex items-center gap-4">
                <span>Current: {alert.currentStock}</span>
                <span>In Cart: {alert.cartQuantity}</span>
                <span>Remaining: {alert.currentStock - alert.cartQuantity}</span>
                {alert.minStock > 0 && (
                  <span>Min Stock: {alert.minStock}</span>
                )}
              </div>

              {alert.severity === 'critical' ? (
                <p className="flex items-center gap-1">
                  <ShoppingCart className="w-3 h-3" />
                  This sale will result in negative inventory
                </p>
              ) : (
                <p className="flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  Stock will be below minimum after sale
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => dismissAlert(alert.productId)}
            className={`p-1 rounded hover:bg-gray-200 ${
              alert.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}

      {visibleAlerts.length > 0 && (
        <div className="text-xs text-gray-500 text-center py-2">
          💡 Consider adjusting quantities or restocking before completing the sale
        </div>
      )}
    </div>
  );
}