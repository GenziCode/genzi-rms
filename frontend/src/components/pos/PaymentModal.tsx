import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  X,
  CreditCard,
  DollarSign,
  Smartphone,
  Building2,
  Plus,
  Trash2,
  Check,
  Wallet,
  Printer,
  Download,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { posService } from '@/services/pos.service';
import { usePOSStore } from '@/store/posStore';
import type { Payment, Sale } from '@/types/pos.types';
import type { StoreSettings, PaymentSettings } from '@/types/settings.types';
import { formatCurrency } from '@/lib/utils';
import { useOfflineQueueStore } from '@/store/offlineQueueStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { usePOSSessionStore } from '@/store/posSessionStore';
import { useAuthStore } from '@/store/authStore';
import { useStore } from '@/contexts/StoreContext';
import {
  settingsService,
  receiptSettingsDefaults,
} from '@/services/settings.service';
import ReceiptPreview from '@/components/pos/ReceiptPreview';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface PaymentModalProps {
  total: number;
  onClose: () => void;
  onSuccess: () => void;
  mode?: 'create' | 'resume';
  heldSale?: Sale | null;
  storeId: string;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: DollarSign, color: 'text-green-600' },
  { value: 'card', label: 'Card', icon: CreditCard, color: 'text-blue-600' },
  {
    value: 'mobile',
    label: 'Mobile',
    icon: Smartphone,
    color: 'text-purple-600',
  },
  {
    value: 'bank',
    label: 'Bank Transfer',
    icon: Building2,
    color: 'text-indigo-600',
  },
  {
    value: 'credit',
    label: 'Customer Credit',
    icon: Wallet,
    color: 'text-amber-600',
  },
] as const;

type PaymentMethodValue = (typeof PAYMENT_METHODS)[number]['value'];

export default function PaymentModal({
  total,
  onClose,
  onSuccess,
  mode = 'create',
  heldSale,
  storeId,
}: PaymentModalProps) {
  const queryClient = useQueryClient();
  const {
    cart,
    customer,
    notes,
    getSubtotal,
    getTotalDiscount,
    getTotalTax,
    getGrandTotal,
  } = usePOSStore();
  const { enqueueSale, enqueueHeldSale } = useOfflineQueueStore();
  const { isOnline } = useNetworkStatus();
  const { recordSale } = usePOSSessionStore();
  const { user } = useAuthStore();
  const { currentStore } = useStore();

  const receiptRef = useRef<HTMLDivElement>(null);

  const { data: receiptSettingsData } = useQuery({
    queryKey: ['receiptSettings'],
    queryFn: settingsService.getReceiptSettings,
  });

  const { data: paymentSettingsData } = useQuery({
    queryKey: ['paymentSettings'],
    queryFn: settingsService.getPaymentSettings,
  });

  const shouldFetchStore =
    Boolean(storeId) && storeId !== '000000000000000000000001';
  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings', storeId],
    queryFn: () => settingsService.getStore(storeId),
    enabled: shouldFetchStore,
  });

  const resolvedReceiptSettings =
    receiptSettingsData ?? receiptSettingsDefaults;
  const fallbackStoreInfo: Partial<StoreSettings> | undefined = currentStore
    ? {
        name: currentStore.name,
        code: currentStore.code,
      }
    : undefined;
  const storeInfo = storeSettings ?? fallbackStoreInfo;
  const cashierName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ')
    : undefined;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethodValue>('cash');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  const baseCreditCapacity = Math.max(
    0,
    Number(customer?.creditLimit ?? 0) - Number(customer?.creditBalance ?? 0)
  );

  const isResume = mode === 'resume' && heldSale;
  const effectiveTotal = useMemo(() => {
    if (isResume && heldSale) {
      const raw = Number(heldSale.grandTotal ?? heldSale.subtotal ?? 0);
      return Number.isFinite(raw) ? raw : 0;
    }
    return total;
  }, [heldSale, isResume, total]);

  useEffect(() => {
    if (isResume && heldSale) {
      const resumeAmount = Number(
        heldSale.grandTotal ?? heldSale.subtotal ?? 0
      );
      setPayments([
        {
          method: 'cash',
          amount: Number.isFinite(resumeAmount) ? resumeAmount : 0,
        },
      ]);
      setSelectedMethod('cash');
    }
  }, [isResume, heldSale]);

  const roundToTwo = (value: number) =>
    Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;

  // Calculate surcharge for a payment method
  const calculateSurcharge = (method: PaymentMethodValue, baseAmount: number) => {
    const methodConfig = paymentSettingsData?.paymentMethods?.[method];
    if (!methodConfig?.surcharge || !methodConfig.enabled) {
      return { surchargeAmount: 0, surchargeRate: 0 };
    }

    const surchargeRate = methodConfig.surcharge;
    let surchargeAmount = 0;

    if (methodConfig.surchargeType === 'percentage') {
      surchargeAmount = roundToTwo((baseAmount * surchargeRate) / 100);
    } else {
      surchargeAmount = surchargeRate;
    }

    return { surchargeAmount, surchargeRate };
  };

  // Get available currencies for a payment method
  const getAvailableCurrencies = (method: PaymentMethodValue) => {
    const methodConfig = paymentSettingsData?.paymentMethods?.[method];
    return methodConfig?.currencies || paymentSettingsData?.supportedCurrencies || ['USD'];
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const creditApplied = payments.reduce(
    (sum, p) => (p.method === 'credit' ? sum + p.amount : sum),
    0
  );
  const projectedCreditBalance =
    Number(customer?.creditBalance ?? 0) + creditApplied;
  const availableCredit = Math.max(0, baseCreditCapacity - creditApplied);
  const paymentMethods = useMemo(
    () =>
      PAYMENT_METHODS.filter((method) =>
        method.value !== 'credit'
          ? true
          : Boolean(customer && availableCredit > 0.01)
      ),
    [availableCredit, customer]
  );
  const nonCreditPaid = totalPaid - creditApplied;
  const remaining = Math.max(
    0,
    roundToTwo(effectiveTotal - creditApplied - nonCreditPaid)
  );
  const change = Math.max(
    0,
    roundToTwo(nonCreditPaid - (effectiveTotal - creditApplied))
  );
  const suggestedCreditAmount = Math.min(availableCredit, remaining);
  const isCreditSelected = selectedMethod === 'credit';

  const formatMoney = (value: number) => formatCurrency(roundToTwo(value));

  const formatMethodLabel = (value: Payment['method']) =>
    value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');

  const extractErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      return apiError.response?.data?.message ?? fallback;
    }
    return fallback;
  };

  const printReceipt = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: completedSale
      ? `receipt-${completedSale.saleNumber}`
      : 'receipt',
    preserveAfterPrint: false,
  });

  const handlePrintReceipt = () => {
    if (!completedSale) return;
    printReceipt?.();
  };

  const handleDownloadReceipt = async () => {
    if (!completedSale || !receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      const imageData = canvas.toDataURL('image/png');
      const paperWidth =
        resolvedReceiptSettings.paperSize === 'A4'
          ? 210
          : resolvedReceiptSettings.paperSize === '80mm'
            ? 80
            : 58;
      const paperHeight = (canvas.height * paperWidth) / canvas.width;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format:
          resolvedReceiptSettings.paperSize === 'A4'
            ? 'a4'
            : [paperWidth, paperHeight],
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(imageData, 'PNG', 0, 0, pageWidth, pageHeight);
      pdf.save(`receipt-${completedSale.saleNumber}.pdf`);
    } catch (error) {
      console.error('Error exporting receipt PDF', error);
      toast.error('Failed to export receipt. Please try again.');
    }
  };

  // Create sale mutation
  const createSaleMutation = useMutation({
    mutationFn: posService.createSale,
    onSuccess: (data) => {
      toast.success('Sale completed successfully!');
      // Record sale in session analytics
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      recordSale(effectiveTotal, totalItems);
      setCompletedSale(data);
      setShowReceipt(true);
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error: unknown) => {
      const maybeNetwork =
        !navigator.onLine ||
        (typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as { code?: string }).code === 'ERR_NETWORK');

      if (maybeNetwork) {
        handleNetworkFailure(error);
        return;
      }

      toast.error(extractErrorMessage(error, 'Failed to complete sale'));
    },
  });

  const resumeSaleMutation = useMutation({
    mutationFn: ({
      saleId,
      payments,
    }: {
      saleId: string;
      payments: Payment[];
    }) => posService.resumeTransaction(saleId, { payments }),
    onSuccess: (data) => {
      toast.success('Held transaction completed successfully!');
      // Record resumed sale in session analytics
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      recordSale(effectiveTotal, totalItems);
      setCompletedSale(data);
      setShowReceipt(true);
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['held-transactions'] });
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to resume transaction'));
    },
  });

  const isProcessing = isResume
    ? resumeSaleMutation.isPending
    : createSaleMutation.isPending;

  const handleAddPayment = () => {
    const outstanding = Math.max(
      0,
      roundToTwo(effectiveTotal - creditApplied - nonCreditPaid)
    );

    if (selectedMethod === 'credit') {
      if (!isOnline) {
        toast.error('Customer credit requires an online connection.');
        return;
      }
      if (!customer) {
        toast.error('Select a customer to use credit payments');
        return;
      }

      if (availableCredit <= 0.01) {
        toast.error('Customer has no available credit');
        return;
      }

      if (outstanding <= 0.01) {
        toast.error('No remaining balance to apply customer credit');
        return;
      }

      const creditToApply = Math.min(outstanding, availableCredit);
      setPayments([
        ...payments,
        {
          method: 'credit',
          amount: roundToTwo(creditToApply),
          currency: selectedCurrency,
        },
      ]);
      toast.success(`Applied ${formatMoney(creditToApply)} customer credit`);
      setAmount('');
      setReference('');
      return;
    }

    const paymentAmount = parseFloat(amount);

    if (!paymentAmount || paymentAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (outstanding <= 0.01) {
      toast.error('Balance already settled');
      return;
    }

    // Calculate surcharge
    const { surchargeAmount, surchargeRate } = calculateSurcharge(selectedMethod, paymentAmount);
    const totalAmount = roundToTwo(paymentAmount + surchargeAmount);

    setPayments([
      ...payments,
      {
        method: selectedMethod,
        amount: totalAmount,
        currency: selectedCurrency,
        surchargeAmount: surchargeAmount > 0 ? surchargeAmount : undefined,
        surchargeRate: surchargeRate > 0 ? surchargeRate : undefined,
        reference: reference || undefined,
      },
    ]);

    if (surchargeAmount > 0) {
      toast.success(`Payment added with ${formatMoney(surchargeAmount)} surcharge (${surchargeRate}${paymentSettingsData?.paymentMethods?.[selectedMethod]?.surchargeType === 'percentage' ? '%' : ' fixed'})`);
    } else {
      toast.success(`Payment added: ${formatMoney(totalAmount)}`);
    }

    setAmount('');
    setReference('');
  };

  const handleRemovePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const handleQuickAmount = (amt: number) => {
    if (selectedMethod === 'credit') {
      const creditSuggestion = Math.min(
        Math.max(0, roundToTwo(effectiveTotal - creditApplied - nonCreditPaid)),
        availableCredit
      );
      setAmount(creditSuggestion.toString());
      return;
    }
    setAmount(amt.toString());
  };

  const queueSaleForLater = (message: string) => {
    if (cart.length === 0) {
      toast.error('Cart is empty. Nothing to queue.');
      return;
    }

    const fallbackPayments =
      payments.length > 0
        ? payments
        : [
            {
              method: 'cash' as const,
              amount: roundToTwo(effectiveTotal),
            },
          ];

    const saleArgs = {
      storeId,
      customer,
      cart: cart.map((item) => ({
        ...item,
        product: { ...item.product },
      })),
      payments: fallbackPayments,
      notes,
      discount: getTotalDiscount(),
      cashierId: undefined,
      subtotal: getSubtotal(),
      totalTax: getTotalTax(),
      totalDiscount: getTotalDiscount(),
      grandTotal: getGrandTotal(),
    };

    let queued;
    if (isResume && heldSale) {
      // This is a held transaction resume
      queued = enqueueHeldSale(
        {
          ...saleArgs,
          heldSaleId: heldSale._id,
          originalHeldSale: heldSale,
        },
        message
      );
    } else {
      // This is a regular sale
      queued = enqueueSale(saleArgs, message);
    }

    toast.success(
      `${isResume ? 'Held transaction resume' : 'Sale'} saved offline${
        queued.customerSnapshot?.name
          ? ` for ${queued.customerSnapshot.name}`
          : ''
      }. It will sync automatically when you reconnect.`
    );
    onSuccess();
    onClose();
  };

  const handleNetworkFailure = (error: unknown) => {
    const message = extractErrorMessage(
      error,
      'Network error. Sale queued for sync.'
    );
    queueSaleForLater(message);
  };

  const handleCompleteSale = () => {
    if (!isOnline && mode === 'resume') {
      toast.error('Reconnect to resume held transactions.');
      return;
    }

    const canAutoApplyCredit =
      customer && availableCredit > 0.01 && remaining > 0.01;
    const creditToAutoApply = canAutoApplyCredit
      ? Math.min(remaining, availableCredit)
      : 0;
    const paymentsForSubmit =
      creditToAutoApply > 0.01
        ? [
            ...payments,
            {
              method: 'credit' as const,
              amount: roundToTwo(creditToAutoApply),
            },
          ]
        : payments;

    if (!isOnline) {
      queueSaleForLater('Offline mode');
      return;
    }

    if (remaining > 0.01 && creditToAutoApply <= 0.01) {
      toast.error('Payment incomplete. Remaining: ' + formatMoney(remaining));
      return;
    }

    if (paymentsForSubmit.length === 0) {
      toast.error('Please add at least one payment method');
      return;
    }

    if (creditToAutoApply > 0.01) {
      toast.success(
        `Applied ${formatMoney(creditToAutoApply)} customer credit`
      );
      setPayments(paymentsForSubmit);
    }

    if (isResume && heldSale) {
      resumeSaleMutation.mutate({
        saleId: heldSale._id,
        payments: paymentsForSubmit,
      });
      return;
    }

    createSaleMutation.mutate({
      storeId,
      customerId: customer?._id,
      items: cart.map((item) => ({
        productId: item.product._id,
        quantity: item.quantity,
        price: item.price, // Backend expects 'price', not 'unitPrice'
        discount: item.discount || 0,
        discountType: 'fixed', // Default to fixed discount
      })),
      payments: paymentsForSubmit,
      notes,
    });
  };

  if (showReceipt && completedSale) {
    const receiptPayments =
      completedSale.payments && completedSale.payments.length > 0
        ? completedSale.payments
        : payments;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Payment Complete!
                </h2>
                <p className="text-sm text-gray-500">
                  Sale #{completedSale.saleNumber}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-1 flex-col lg:flex-row">
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              <div className="flex justify-center">
                <ReceiptPreview
                  ref={receiptRef}
                  sale={completedSale}
                  settings={resolvedReceiptSettings}
                  store={storeInfo}
                  cashierName={cashierName}
                />
              </div>
            </div>
            <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 p-6 space-y-6">
              <div>
                <p className="text-sm text-gray-500">Total Paid</p>
                <p className="text-3xl font-semibold text-gray-900">
                  {formatMoney(effectiveTotal)}
                </p>
              </div>
              {change > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-amber-800">
                    Change Due{' '}
                    <span className="font-semibold text-lg">
                      {formatMoney(change)}
                    </span>
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Payments
                </h3>
                <div className="space-y-2">
                  {receiptPayments.map((payment, index) => {
                    const method = PAYMENT_METHODS.find(
                      (m) => m.value === payment.method
                    );
                    return (
                      <div
                        key={`${payment.method}-${index}`}
                        className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded-md"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-gray-600">
                            {method && (
                              <method.icon
                                className={`w-4 h-4 ${method.color}`}
                              />
                            )}
                            <span>
                              {method?.label ?? formatMethodLabel(payment.method)}
                              {payment.currency && payment.currency !== paymentSettingsData?.defaultCurrency && (
                                <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">
                                  {payment.currency}
                                </span>
                              )}
                            </span>
                          </div>
                          {payment.surchargeAmount && payment.surchargeAmount > 0 && (
                            <div className="text-xs text-amber-600 mt-1">
                              +{formatMoney(payment.surchargeAmount)} surcharge
                            </div>
                          )}
                        </div>
                        <span className="font-medium">
                          {formatMoney(payment.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handlePrintReceipt}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
                <button
                  onClick={handleDownloadReceipt}
                  className="w-full bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  onClick={() => {
                    onSuccess();
                    onClose();
                  }}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-200 transition-colors font-medium"
                >
                  New Sale
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Payment</h2>
            {isResume && heldSale && (
              <p className="text-sm text-gray-500">
                Resuming held sale #{heldSale.saleNumber}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {/* Total Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Invoice Total:</span>
              <span className="text-2xl font-bold text-gray-900">
                {formatMoney(effectiveTotal)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Collected:</span>
              <span className="font-medium text-green-600">
                {formatMoney(nonCreditPaid)}
              </span>
            </div>
            {creditApplied > 0 && (
              <div className="flex justify-between items-center text-sm mt-1 text-amber-700">
                <span className="text-gray-600">Customer Credit:</span>
                <span className="font-medium">
                  {formatMoney(creditApplied)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-gray-200">
              <span className="text-gray-600">Remaining Balance:</span>
              <span
                className={`font-bold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}
              >
                {formatMoney(remaining)}
              </span>
            </div>
            {change > 0 && (
              <div className="flex justify-between items-center text-sm mt-1 pt-2 border-t border-gray-200">
                <span className="text-gray-600">Change:</span>
                <span className="font-bold text-yellow-600">
                  {formatMoney(change)}
                </span>
              </div>
            )}
            {customer && (
              <div className="mt-3 pt-3 border-t border-dashed border-gray-200 text-sm space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Credit Limit:</span>
                  <span className="font-medium text-gray-900">
                    {formatMoney(Number(customer.creditLimit ?? 0))}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Current Balance:</span>
                  <span className="font-medium text-gray-900">
                    {formatMoney(Number(customer.creditBalance ?? 0))}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Projected Balance:</span>
                  <span className="font-medium text-gray-900">
                    {formatMoney(projectedCreditBalance)}
                  </span>
                </div>
                <div className="flex justify-between text-amber-700 font-medium">
                  <span>Available Credit:</span>
                  <span>{formatMoney(availableCredit)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Payment Methods Grid */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => {
                const disabled =
                  method.value === 'credit' &&
                  (remaining <= 0.01 || availableCredit <= 0.01);
                return (
                  <button
                    key={method.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && setSelectedMethod(method.value)}
                    className={`p-4 rounded-lg border-2 transition-colors flex items-center gap-3 ${
                      selectedMethod === method.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <method.icon className={`w-6 h-6 ${method.color}`} />
                    <span className="font-medium text-gray-900">
                      {method.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Currency Selection */}
          {paymentSettingsData?.supportedCurrencies &&
           paymentSettingsData.supportedCurrencies.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {paymentSettingsData.supportedCurrencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Surcharge Display */}
          {(() => {
            const { surchargeAmount, surchargeRate } = calculateSurcharge(selectedMethod, parseFloat(amount) || 0);
            return surchargeAmount > 0 ? (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-amber-800 font-medium">Surcharge:</span>
                  <span className="text-amber-800 font-bold">
                    {formatMoney(surchargeAmount)} ({surchargeRate}{paymentSettingsData?.paymentMethods?.[selectedMethod]?.surchargeType === 'percentage' ? '%' : ' fixed'})
                  </span>
                </div>
                <p className="text-xs text-amber-700 mt-1">
                  Total payment will be {formatMoney((parseFloat(amount) || 0) + surchargeAmount)}
                </p>
              </div>
            ) : null;
          })()}

          {/* Amount Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={
                isCreditSelected
                  ? suggestedCreditAmount > 0
                    ? suggestedCreditAmount.toFixed(2)
                    : ''
                  : amount
              }
              onChange={(e) => {
                if (isCreditSelected) return;
                setAmount(e.target.value);
              }}
              placeholder={
                isCreditSelected
                  ? 'Auto-calculated from credit balance'
                  : '0.00'
              }
              className={`w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg ${
                isCreditSelected ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              disabled={isCreditSelected}
            />
            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2 mt-2">
              <button
                onClick={() => handleQuickAmount(remaining)}
                className="px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 text-sm font-medium"
              >
                Exact
              </button>
              {[10, 20, 50, 100].map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleQuickAmount(amt)}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
                >
                  ${amt}
                </button>
              ))}
            </div>
          </div>

          {/* Reference (optional) */}
          {selectedMethod !== 'cash' && !isCreditSelected && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number (Optional)
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Transaction reference"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Add Payment Button */}
          <button
            onClick={handleAddPayment}
            disabled={
              isCreditSelected && (remaining <= 0.01 || availableCredit <= 0.01)
            }
            className={`w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2 font-medium mb-6 ${
              isCreditSelected && (remaining <= 0.01 || availableCredit <= 0.01)
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-200'
            }`}
          >
            <Plus className="w-5 h-5" />
            {isCreditSelected ? 'Apply Customer Credit' : 'Add Payment'}
          </button>

          {/* Added Payments */}
          {payments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Added Payments:
              </h3>
              <div className="space-y-2">
                {payments.map((payment, index) => {
                  const method = PAYMENT_METHODS.find(
                    (m) => m.value === payment.method
                  );
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        {method && (
                          <method.icon className={`w-5 h-5 ${method.color}`} />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 flex items-center gap-2">
                            {method?.label}
                            {payment.currency && payment.currency !== paymentSettingsData?.defaultCurrency && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">
                                {payment.currency}
                              </span>
                            )}
                          </p>
                          {payment.reference && (
                            <p className="text-xs text-gray-500">
                              Ref: {payment.reference}
                            </p>
                          )}
                          {payment.surchargeAmount && payment.surchargeAmount > 0 && (
                            <p className="text-xs text-amber-600">
                              +{formatMoney(payment.surchargeAmount)} surcharge
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900">
                          {formatMoney(payment.amount)}
                        </span>
                        <button
                          onClick={() => handleRemovePayment(index)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCompleteSale}
              disabled={
                remaining > 0.01 || payments.length === 0 || isProcessing
              }
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing
                ? 'Processing...'
                : isResume
                  ? 'Complete Held Sale'
                  : 'Complete Sale'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
