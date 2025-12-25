import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  X,
  Plus,
  Minus,
  Trash2,
  User,
  ShoppingCart,
  CreditCard,
  Clock,
  Calculator as CalcIcon,
  RotateCcw,
  FileText,
  Scan,
  Save,
  Grid,
  List,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { productsService } from '@/services/products.service';
import { categoriesService } from '@/services/categories.service';
import { posService } from '@/services/pos.service';
import { usePOSStore } from '@/store/posStore';
import { useAuthStore } from '@/store/authStore';
import PaymentModal from '@/components/pos/PaymentModal';
import CustomerQuickAdd from '@/components/pos/CustomerQuickAdd';
import CustomerQuickView from '@/components/pos/CustomerQuickView';
import ProductQuickView from '@/components/pos/ProductQuickView';
import Calculator from '@/components/pos/Calculator';
import SaleReturn from '@/components/pos/SaleReturn';
import InvoiceSearch from '@/components/pos/InvoiceSearch';
import HeldTransactions from '@/components/pos/HeldTransactions';
import { OfflineStatusBanner } from '@/components/pos/OfflineStatusBanner';
import { OfflineQueuePanel } from '@/components/pos/OfflineQueuePanel';
import POSAnalyticsSidebar from '@/components/pos/POSAnalyticsSidebar';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useStore } from '@/contexts/StoreContext';
import { useOfflineQueueStore } from '@/store/offlineQueueStore';
import { BarcodeScannerModal } from '@/components/pos/BarcodeScannerModal';
import type {
  Product as CatalogProduct,
  ProductFilters,
} from '@/types/products.types';
import type { Sale, Product as POSProduct } from '@/types/pos.types';

export default function POSPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { currentStore } = useStore();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const canSeeCost =
    user?.role === 'owner' ||
    user?.role === 'admin' ||
    user?.role === 'manager';

  const {
    cart,
    customer,
    discount,
    notes,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setCustomer,
    getSubtotal,
    getTotalDiscount,
    getTotalTax,
    getGrandTotal,
    getItemCount,
    loadSale,
  } = usePOSStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showPayment, setShowPayment] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCustomerView, setShowCustomerView] = useState(false);
  const [showProductView, setShowProductView] = useState<CatalogProduct | null>(
    null
  );
  const [showCalculator, setShowCalculator] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showHeld, setShowHeld] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);
  const [heldSale, setHeldSale] = useState<Sale | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // F9 - Process payment
      if (e.key === 'F9' && cart.length > 0) {
        e.preventDefault();
        setShowPayment(true);
      }
      // Esc - Clear cart
      if (e.key === 'Escape' && cart.length > 0 && !showPayment) {
        if (confirm('Clear cart?')) {
          clearCart();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [cart.length, showPayment, clearCart]);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['pos-products', searchTerm, selectedCategory],
    queryFn: () => {
      const params: ProductFilters = { limit: 100 };
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.category = selectedCategory;
      return productsService.getAll(params);
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getAll,
  });

  const holdMutation = useMutation({
    mutationFn: posService.holdTransaction,
    onSuccess: () => {
      toast.success('Transaction held');
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['held-transactions'] });
    },
  });

  const products: CatalogProduct[] = productsData?.products ?? [];
  const subtotal = getSubtotal();
  const totalDiscount = getTotalDiscount();
  const tax = getTotalTax();
  const total = getGrandTotal();
  const heldSaleTotal = heldSale
    ? Number(heldSale.grandTotal ?? heldSale.subtotal ?? 0)
    : null;
  const paymentTotal = heldSaleTotal ?? total;
  const itemCount = getItemCount();
  const customerCreditLimit = customer?.creditLimit ?? 0;
  const customerCreditBalance = customer?.creditBalance ?? 0;
  const customerCreditAvailable = Math.max(
    customerCreditLimit - customerCreditBalance,
    0
  );

  const storeId = currentStore?._id ?? '000000000000000000000001';
  const { queue: offlineQueue, isOnline } = useOfflineSync({
    enabled: true,
    storeIdFallback: storeId,
  });
  const { markSaleStatus } = useOfflineQueueStore();

  const handleRetryOfflineSync = () => {
    offlineQueue
      .filter((sale) => sale.status === 'failed')
      .forEach((sale) => markSaleStatus(sale.id, 'pending'));
  };

  const mapProductToPOS = (product: CatalogProduct): POSProduct => ({
    _id: product._id,
    name: product.name,
    price: product.price,
    cost: product.cost,
    stock: product.stock,
    barcode: product.barcode,
    category:
      typeof product.category === 'string'
        ? product.category
        : product.category._id,
    images: product.images,
    unit: product.unit,
    taxRate: product.taxRate,
  });

  const handleAddToCart = useCallback(
    (
      product: CatalogProduct,
      options?: { silent?: boolean; message?: string }
    ) => {
      if (product.trackInventory && (product.stock || 0) < 1) {
        toast.error('Out of stock');
        return;
      }
      addToCart(mapProductToPOS(product));
      if (!options?.silent) {
        toast.success(options?.message ?? `Added ${product.name} to cart`);
      }
    },
    [addToCart]
  );

  const handleScannedCode = useCallback(
    async (
      code: string,
      source: 'hardware' | 'camera' | 'manual' = 'hardware'
    ) => {
      const trimmed = code.trim();
      if (!trimmed) return;

      try {
        const product = await productsService.getByBarcode(trimmed);
        handleAddToCart(product, {
          message: `Scanned ${product.name}${
            source === 'hardware' ? '' : ` (${source})`
          }`,
        });
      } catch (barcodeError) {
        try {
          const product = await productsService.getByQR(trimmed);
          handleAddToCart(product, {
            message: `Scanned ${product.name} via QR`,
          });
        } catch (qrError) {
          const isNetworkError =
            !navigator.onLine ||
            (typeof barcodeError === 'object' &&
              barcodeError !== null &&
              'code' in barcodeError &&
              (barcodeError as { code?: string }).code === 'ERR_NETWORK');
          toast.error(
            isNetworkError
              ? 'Cannot search products while offline.'
              : `No product found for code ${trimmed}`
          );
        }
      }
    },
    [handleAddToCart]
  );

  const handleResumeHeldSale = (sale: Sale) => {
    loadSale(sale);
    setHeldSale(sale);
    setShowHeld(false);
    setShowPayment(true);
    toast.success(
      `Held sale #${sale.saleNumber} loaded. Complete payment to finalize.`
    );
  };

  useEffect(() => {
    const bufferRef: { value: string } = { value: '' };
    let timeout: number | undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        (target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.getAttribute('contenteditable') === 'true')) ||
        showPayment ||
        showBarcode ||
        showCustomerModal ||
        showCustomerView ||
        showProductView ||
        showReturn ||
        showInvoice ||
        showCalculator
      ) {
        return;
      }

      if (event.key === 'Enter') {
        if (bufferRef.value.length >= 3) {
          const code = bufferRef.value;
          bufferRef.value = '';
          if (timeout) window.clearTimeout(timeout);
          handleScannedCode(code, 'hardware');
        } else {
          bufferRef.value = '';
        }
        return;
      }

      if (
        event.key.length === 1 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        bufferRef.value += event.key;
        if (timeout) window.clearTimeout(timeout);
        timeout = window.setTimeout(() => {
          bufferRef.value = '';
        }, 75);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeout) window.clearTimeout(timeout);
    };
  }, [
    handleScannedCode,
    showBarcode,
    showCustomerModal,
    showCustomerView,
    showCalculator,
    showInvoice,
    showPayment,
    showProductView,
    showReturn,
  ]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Clean Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBarcode(true)}
                className="btn-header"
              >
                <Scan className="w-4 h-4" />
                <span className="hidden sm:inline">Scan</span>
              </button>
              <button
                onClick={() => setShowCalculator(true)}
                className="btn-header"
              >
                <CalcIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Calculator</span>
              </button>
              <button
                onClick={() => setShowInvoice(true)}
                className="btn-header"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Invoices</span>
              </button>
              <button
                onClick={() => setShowReturn(true)}
                className="btn-header"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Returns</span>
              </button>
              <button onClick={() => setShowHeld(true)} className="btn-header">
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">Held</span>
              </button>
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`btn-header ${showAnalytics ? 'bg-blue-100 text-blue-700' : ''}`}
              >
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setView('grid')}
                className={`px-3 py-2 ${view === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-3 py-2 border-l ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {(!isOnline || offlineQueue.length > 0) && (
        <div className="px-6 pt-4">
          <OfflineStatusBanner onRetry={handleRetryOfflineSync} />
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Products */}
        <div className={`${showAnalytics ? 'flex-1' : 'flex-1'} overflow-y-auto p-6`}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading products...</p>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No products found</p>
              </div>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  showCost={canSeeCost}
                  onAdd={() => handleAddToCart(product)}
                  onView={() => setShowProductView(product)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {products.map((product) => (
                <ProductRow
                  key={product._id}
                  product={product}
                  showCost={canSeeCost}
                  onAdd={() => handleAddToCart(product)}
                  onView={() => setShowProductView(product)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Cart Sidebar */}
        <div className="w-96 bg-white border-l flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900">
                Cart ({itemCount})
              </h2>
              {cart.length > 0 && (
                <button
                  onClick={() => confirm('Clear cart?') && clearCart()}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear
                </button>
              )}
            </div>
            {customer ? (
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                <User className="w-4 h-4 text-blue-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {customer.name}
                  </p>
                  <p className="text-xs text-gray-600">{customer.phone}</p>
                  {(customerCreditLimit > 0 || customerCreditBalance > 0) && (
                    <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-gray-600">
                      <div className="rounded bg-white px-2 py-1 text-center">
                        <p className="font-semibold text-gray-900">
                          ${customerCreditLimit.toFixed(2)}
                        </p>
                        <p>Credit Limit</p>
                      </div>
                      <div className="rounded bg-white px-2 py-1 text-center">
                        <p className="font-semibold text-amber-600">
                          ${customerCreditBalance.toFixed(2)}
                        </p>
                        <p>Outstanding</p>
                      </div>
                      <div className="rounded bg-white px-2 py-1 text-center">
                        <p className="font-semibold text-emerald-600">
                          ${customerCreditAvailable.toFixed(2)}
                        </p>
                        <p>Available</p>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowCustomerView(true)}
                  className="p-1 hover:bg-blue-100 rounded"
                >
                  <ChevronRight className="w-4 h-4 text-blue-600" />
                </button>
                <button
                  onClick={() => setCustomer(null)}
                  className="p-1 hover:bg-red-100 rounded"
                >
                  <X className="w-4 h-4 text-red-600" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCustomerModal(true)}
                className="w-full py-2 border-2 border-dashed rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                + Add Customer
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingCart className="w-16 h-16 text-gray-300 mb-3" />
                <p className="text-gray-500">Cart is empty</p>
                <p className="text-sm text-gray-400 mt-1">
                  Add products to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.product._id}
                    className="bg-gray-50 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900 text-sm flex-1">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.product._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.product._id, item.quantity - 1)
                          }
                          className="w-8 h-8 border rounded-lg hover:bg-white flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product._id, item.quantity + 1)
                          }
                          className="w-8 h-8 border rounded-lg hover:bg-white flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="font-bold text-gray-900">
                        ${item.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <>
              <div className="border-t p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Discount ({discount}%)
                    </span>
                    <span className="font-medium text-green-600">
                      -${totalDiscount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-blue-600">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t p-4 space-y-2">
                <button
                  onClick={() => setShowPayment(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <CreditCard className="w-5 h-5" />
                  {heldSale
                    ? `Resume Sale $${paymentTotal.toFixed(2)}`
                    : `Charge $${paymentTotal.toFixed(2)}`}
                </button>
                <button
                  onClick={() => {
                    if (cart.length === 0) return;
                    holdMutation.mutate({
                      storeId,
                      customerId: customer?._id,
                      items: cart.map((item) => ({
                        productId: item.product._id,
                        quantity: item.quantity,
                      })),
                      notes,
                    });
                  }}
                  className="w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Save className="w-5 h-5" />
                  Hold Transaction
                </button>
              </div>
            </>
          )}

          {offlineQueue.length > 0 && (
            <div className="p-4 border-t">
              <OfflineQueuePanel />
            </div>
          )}
        </div>

        {/* Analytics Sidebar */}
        {showAnalytics && (
          <POSAnalyticsSidebar onToggleQueuePanel={() => setShowHeld(true)} />
        )}
      </div>

      {/* Modals */}
      {showPayment && (
        <PaymentModal
          total={paymentTotal}
          mode={heldSale ? 'resume' : 'create'}
          heldSale={heldSale}
          storeId={storeId}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            setShowPayment(false);
            setHeldSale(null);
            clearCart();
          }}
        />
      )}
      {showCustomerModal && (
        <CustomerQuickAdd
          onClose={() => setShowCustomerModal(false)}
          onSelect={(c) => {
            setCustomer({
              _id: c._id,
              name: c.name,
              email: c.email,
              phone: c.phone ?? '',
              address: c.address?.street ?? c.address?.city ?? '',
              loyaltyPoints: c.loyaltyPoints ?? 0,
              creditLimit: c.creditLimit,
              creditBalance: c.creditBalance ?? 0,
              totalSpent: c.totalSpent ?? 0,
              totalPurchases: c.totalPurchases ?? 0,
            });
            setShowCustomerModal(false);
          }}
        />
      )}
      {showCustomerView && customer && (
        <CustomerQuickView
          customer={customer}
          onClose={() => setShowCustomerView(false)}
        />
      )}
      {showProductView && (
        <ProductQuickView
          product={showProductView}
          onClose={() => setShowProductView(null)}
          onAddToCart={() => {
            handleAddToCart(showProductView);
            setShowProductView(null);
          }}
        />
      )}
      {showCalculator && (
        <Calculator onClose={() => setShowCalculator(false)} />
      )}
      {showReturn && <SaleReturn onClose={() => setShowReturn(false)} />}
      {showInvoice && (
        <InvoiceSearch
          onClose={() => setShowInvoice(false)}
          onViewInvoice={() => {}}
        />
      )}
      {showHeld && (
        <HeldTransactions
          onClose={() => setShowHeld(false)}
          onResume={handleResumeHeldSale}
        />
      )}
      {showBarcode && (
        <BarcodeScannerModal
          onClose={() => {
            setShowBarcode(false);
          }}
          onDetected={(code) => handleScannedCode(code, 'camera')}
        />
      )}
    </div>
  );
}

interface ProductCardProps {
  product: CatalogProduct;
  showCost: boolean;
  onAdd: () => void;
  onView: () => void;
}

function ProductCard({ product, showCost, onAdd, onView }: ProductCardProps) {
  const isOutOfStock = product.trackInventory && (product.stock || 0) < 1;
  const isLowStock =
    product.trackInventory &&
    (product.stock || 0) <= (product.minStock || 0) &&
    !isOutOfStock;

  return (
    <div className="bg-white rounded-lg border hover:shadow-lg transition-shadow">
      <div className="relative aspect-square bg-gray-100">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="w-12 h-12 text-gray-300" />
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
            OUT
          </div>
        )}
        {isLowStock && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded">
            LOW
          </div>
        )}
        <button
          onClick={onView}
          className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="p-3">
        <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-2 h-10">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-bold text-gray-900">
            ${product.price.toFixed(2)}
          </span>
          {product.trackInventory && (
            <span
              className={`text-xs ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-green-600'}`}
            >
              Stock: {product.stock || 0}
            </span>
          )}
        </div>
        {showCost && typeof product.cost === 'number' && (
          <p className="text-xs text-gray-500 mb-2">
            Cost: ${product.cost.toFixed(2)}
          </p>
        )}
        <button
          onClick={onAdd}
          disabled={isOutOfStock}
          className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
            isOutOfStock
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

interface ProductRowProps {
  product: CatalogProduct;
  showCost: boolean;
  onAdd: () => void;
  onView: () => void;
}

function ProductRow({ product, showCost, onAdd, onView }: ProductRowProps) {
  const isOutOfStock = product.trackInventory && (product.stock || 0) < 1;

  return (
    <div className="bg-white rounded-lg border p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-gray-300" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
        <p className="text-sm text-gray-500">{product.sku || 'No SKU'}</p>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-gray-900">
          ${product.price.toFixed(2)}
        </p>
        {product.trackInventory && (
          <p
            className={`text-xs ${isOutOfStock ? 'text-red-600' : 'text-green-600'}`}
          >
            Stock: {product.stock || 0}
          </p>
        )}
        {showCost && typeof product.cost === 'number' && (
          <p className="text-xs text-gray-500">
            Cost: ${product.cost.toFixed(2)}
          </p>
        )}
      </div>
      <button onClick={onView} className="p-2 hover:bg-gray-50 rounded-lg">
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>
      <button
        onClick={onAdd}
        disabled={isOutOfStock}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          isOutOfStock
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        Add
      </button>
    </div>
  );
}
