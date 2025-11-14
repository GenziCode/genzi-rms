import { useMemo, useRef } from 'react';
import {
  Palette,
  LayoutTemplate,
  Save,
  Printer,
  Download,
  RotateCcw,
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import ReceiptPreview from '@/components/pos/ReceiptPreview';
import type { ReceiptSettings, StoreSettings } from '@/types/settings.types';
import type { Sale } from '@/types/pos.types';
import { receiptSettingsDefaults } from '@/services/settings.service';

interface ReceiptDesignerProps {
  value: ReceiptSettings;
  onChange: (settings: ReceiptSettings) => void;
  onSave: (settings: ReceiptSettings) => void;
  isSaving?: boolean;
}

export default function ReceiptDesigner({
  value,
  onChange,
  onSave,
  isSaving = false,
}: ReceiptDesignerProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const previewSale = useMemo(() => sampleSale, []);
  const previewStore = useMemo(() => sampleStore, []);

  const printPreview = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: 'receipt-preview',
    preserveAfterPrint: false,
  });

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      const imageData = canvas.toDataURL('image/png');
      const baseWidth =
        value.paperSize === 'A4' ? 210 : value.paperSize === '80mm' ? 80 : 58;
      const baseHeight = (canvas.height * baseWidth) / canvas.width;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: value.paperSize === 'A4' ? 'a4' : [baseWidth, baseHeight],
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(imageData, 'PNG', 0, 0, pageWidth, pageHeight);
      pdf.save('receipt-preview.pdf');
    } catch (error) {
      console.error('Failed to export receipt preview', error);
    }
  };

  const handleToggle = (key: keyof ReceiptSettings) => {
    onChange({ ...value, [key]: !value[key] });
  };

  const handleInput =
    <K extends keyof ReceiptSettings>(key: K) =>
    (input: ReceiptSettings[K]) => {
      onChange({ ...value, [key]: input });
    };

  const handleSave = () => onSave(value);
  const handleReset = () => onChange({ ...receiptSettingsDefaults });

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,1fr)]">
      <div className="space-y-6">
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-blue-600" />
            Template
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {templateOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleInput('template')(option.value)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  value.template === option.value
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-200 hover:border-blue-300 text-gray-600'
                }`}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Header Text
            </label>
            <input
              type="text"
              value={value.headerText}
              onChange={(event) =>
                handleInput('headerText')(event.target.value)
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Thank you for your purchase!"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Footer Text
            </label>
            <input
              type="text"
              value={value.footerText}
              onChange={(event) =>
                handleInput('footerText')(event.target.value)
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Come again soon!"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Palette className="w-4 h-4 text-blue-500" />
              Accent Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={value.accentColor}
                onChange={(event) =>
                  handleInput('accentColor')(event.target.value)
                }
                className="h-10 w-16 rounded border border-gray-200"
              />
              <input
                type="text"
                value={value.accentColor}
                onChange={(event) =>
                  handleInput('accentColor')(event.target.value)
                }
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-xs font-medium text-gray-600"
                style={{ backgroundColor: value.accentColor }}
              >
                Aa
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paper Size
            </label>
            <select
              value={value.paperSize}
              onChange={(event) =>
                handleInput('paperSize')(
                  event.target.value as ReceiptSettings['paperSize']
                )
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="58mm">58mm (Thermal)</option>
              <option value="80mm">80mm (Thermal)</option>
              <option value="A4">A4 (Full Page)</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo URL
            </label>
            <input
              type="url"
              value={value.logoUrl ?? ''}
              onChange={(event) =>
                handleInput('logoUrl')(event.target.value || undefined)
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/logo.png"
            />
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-3">
          {toggleFields.map((field) => (
            <label
              key={field.key}
              className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 hover:border-blue-300 transition-colors cursor-pointer"
            >
              <input
                type="checkbox"
                checked={Boolean(value[field.key])}
                onChange={() => handleToggle(field.key)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{field.label}</span>
            </label>
          ))}
        </section>

        {(value.showBarcode || value.showQRCode) && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
            <p>
              Barcode and QR code previews use the receipt number for
              demonstration. Ensure your live receipts include sale identifiers
              so scanners can resolve them.
            </p>
            {!value.showStoreDetails && (
              <p className="mt-2 font-semibold text-amber-600">
                Tip: enable “Store Details” to help customers verify the origin
                of scanned receipts.
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {isSaving ? (
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                />
              </svg>
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Receipt Settings
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 uppercase">
              Live Preview
            </h3>
            <p className="text-xs text-gray-500">
              Updates instantly as you change your settings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => printPreview?.()}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
          </div>
        </div>
        <div className="p-6 bg-slate-100 overflow-y-auto max-h-[70vh]">
          <div className="flex justify-center">
            <ReceiptPreview
              ref={receiptRef}
              sale={previewSale}
              settings={value}
              store={previewStore}
              cashierName="Jordan Lee"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const templateOptions: Array<{
  value: ReceiptSettings['template'];
  label: string;
}> = [
  { value: 'classic', label: 'Classic' },
  { value: 'modern', label: 'Modern' },
  { value: 'compact', label: 'Compact' },
];

type ReceiptToggleKey =
  | 'showLogo'
  | 'showStoreDetails'
  | 'showCustomerDetails'
  | 'showCashier'
  | 'showDiscounts'
  | 'showTaxBreakdown'
  | 'showItemNotes'
  | 'showPaymentSummary'
  | 'showBarcode'
  | 'showQRCode'
  | 'showNotes';

const toggleFields: Array<{ key: ReceiptToggleKey; label: string }> = [
  { key: 'showLogo', label: 'Show Logo' },
  { key: 'showStoreDetails', label: 'Store Details' },
  { key: 'showCustomerDetails', label: 'Customer Details' },
  { key: 'showCashier', label: 'Cashier Name' },
  { key: 'showDiscounts', label: 'Discount Breakdown' },
  { key: 'showTaxBreakdown', label: 'Tax Breakdown' },
  { key: 'showItemNotes', label: 'Item Extras (discount/tax)' },
  { key: 'showPaymentSummary', label: 'Payment Summary' },
  { key: 'showBarcode', label: 'Barcode' },
  { key: 'showQRCode', label: 'QR Code' },
  { key: 'showNotes', label: 'Sale Notes' },
];

const sampleStore: Partial<StoreSettings> = {
  name: 'Main Street Market',
  code: 'MSM',
  phone: '+1 (555) 123-4567',
  email: 'hello@mainstreetmarket.com',
  timezone: 'America/New_York',
  currency: 'USD',
  address: {
    street: '123 Market Street',
    city: 'Springfield',
    state: 'CA',
    zipCode: '90001',
    country: 'USA',
  },
  contact: {
    phone: '+1 (555) 123-4567',
    email: 'hello@mainstreetmarket.com',
    website: 'mainstreetmarket.example',
  },
  businessDetails: {
    taxId: 'TX-45892',
  },
};

const sampleSale: Sale = {
  _id: 'sample-sale',
  saleNumber: 'POS-1057',
  storeId: 'sample-store',
  cashierId: 'cashier-001',
  customerId: 'customer-001',
  customer: {
    _id: 'customer-001',
    name: 'Jane Smith',
    phone: '+1 (555) 987-6543',
  },
  items: [
    {
      productId: 'prod-001',
      productName: 'Artisan Sourdough Bread',
      quantity: 2,
      unitPrice: 4.5,
      discount: 0.5,
      taxAmount: 0.72,
      total: 9.22,
    },
    {
      productId: 'prod-002',
      productName: 'Cold Pressed Orange Juice',
      quantity: 1,
      unitPrice: 5.5,
      discount: 0,
      taxAmount: 0.44,
      total: 5.94,
    },
  ],
  subtotal: 14.5,
  totalDiscount: 0.5,
  totalTax: 1.16,
  grandTotal: 15.16,
  amountPaid: 20,
  changeGiven: 4.84,
  payments: [
    {
      method: 'cash',
      amount: 20,
    },
  ],
  status: 'completed',
  notes: 'Pickup between 5-6 PM. Enjoy your day!',
  createdAt: new Date('2025-03-18T14:36:00Z').toISOString(),
  updatedAt: new Date('2025-03-18T14:36:00Z').toISOString(),
};
