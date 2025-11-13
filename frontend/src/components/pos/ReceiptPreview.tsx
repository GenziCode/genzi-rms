import React from 'react';
import clsx from 'clsx';
import { format } from 'date-fns';
import Barcode from 'react-barcode';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency } from '@/lib/utils';
import type { ReceiptSettings, StoreSettings } from '@/types/settings.types';
import type { Sale } from '@/types/pos.types';

interface ReceiptPreviewProps {
  sale: Sale;
  settings: ReceiptSettings;
  store?: Partial<StoreSettings>;
  cashierName?: string;
}

const paperWidths: Record<ReceiptSettings['paperSize'], string> = {
  '58mm': '58mm',
  '80mm': '80mm',
  A4: '210mm',
};

const ReceiptPreview = React.forwardRef<HTMLDivElement, ReceiptPreviewProps>(
  ({ sale, settings, store, cashierName }, ref) => {
    const paperWidth = paperWidths[settings.paperSize] ?? '80mm';
    const createdAt = sale?.createdAt ? new Date(sale.createdAt) : new Date();

    const subtotal = safeNumber(sale?.subtotal);
    const totalDiscount = safeNumber(sale?.totalDiscount);
    const totalTax = safeNumber(sale?.totalTax);
    const grandTotal =
      safeNumber(sale?.grandTotal) || subtotal - totalDiscount + totalTax;
    const amountPaid = safeNumber(sale?.amountPaid) || grandTotal;
    const changeGiven =
      safeNumber(sale?.changeGiven) || Math.max(0, amountPaid - grandTotal);

    const customerName =
      sale?.customer?.name ||
      sale?.customer?.phone ||
      sale?.customerId ||
      'Walk-in Customer';

    const addressLines = store?.address
      ? [
          store.address.street,
          [store.address.city, store.address.state, store.address.zipCode]
            .filter(Boolean)
            .join(', '),
          store.address.country,
        ].filter(Boolean)
      : [];

    const contactLines = [
      store?.contact?.phone ?? store?.phone,
      store?.contact?.email ?? store?.email,
      store?.contact?.website,
    ].filter(Boolean);

    const showPaymentSummary =
      settings.showPaymentSummary && Array.isArray(sale?.payments);

    const accentStyle: React.CSSProperties = {
      color: settings.accentColor,
    };

    const headerStyles =
      settings.template === 'modern'
        ? {
            background: `linear-gradient(135deg, ${settings.accentColor}, ${shadeColor(
              settings.accentColor,
              -10
            )})`,
          }
        : undefined;

    return (
      <div
        ref={ref}
        className={clsx(
          'bg-white text-gray-800 mx-auto print:shadow-none',
          settings.template === 'compact'
            ? 'rounded-lg border border-gray-200 text-[13px]'
            : 'rounded-xl shadow-lg text-sm'
        )}
        style={{ width: paperWidth, minWidth: paperWidth }}
        data-template={settings.template}
      >
        <div
          className={clsx(
            'px-6 py-6 border-b border-gray-200 text-center',
            settings.template === 'modern' ? 'text-white' : 'text-gray-800'
          )}
          style={headerStyles}
        >
          {settings.showLogo && settings.logoUrl && (
            <img
              src={settings.logoUrl}
              alt={store?.name || 'Store logo'}
              className="h-12 mx-auto mb-3 object-contain"
            />
          )}
          <h2
            className={clsx(
              'text-xl font-semibold tracking-wide uppercase',
              settings.template !== 'modern' && 'text-gray-900'
            )}
            style={settings.template === 'modern' ? undefined : accentStyle}
          >
            {store?.name || 'Point of Sale'}
          </h2>
          {settings.headerText && (
            <p
              className={clsx(
                'mt-2 text-xs',
                settings.template === 'modern'
                  ? 'text-white/80'
                  : 'text-gray-500'
              )}
            >
              {settings.headerText}
            </p>
          )}
        </div>

        <div className="px-6 py-4 space-y-4">
          {settings.showStoreDetails &&
            (addressLines.length > 0 || contactLines.length > 0) && (
              <div className="text-center text-xs text-gray-600 space-y-1">
                {addressLines.map((line, index) => (
                  <div key={`addr-${index}`}>{line}</div>
                ))}
                {contactLines.map((line, index) => (
                  <div key={`contact-${index}`}>{line}</div>
                ))}
                {store?.businessDetails?.taxId && (
                  <div>Tax ID: {store.businessDetails.taxId}</div>
                )}
              </div>
            )}

          <div
            className={clsx(
              'grid gap-3 px-4 py-3 rounded-lg border',
              settings.template === 'modern'
                ? 'bg-slate-900/5 border-slate-200'
                : 'bg-gray-50 border-gray-200'
            )}
          >
            <ReceiptDetailRow
              label="Receipt #"
              value={sale?.saleNumber || sale?._id || 'N/A'}
              accent
              accentColor={settings.accentColor}
            />
            <ReceiptDetailRow
              label="Date"
              value={format(createdAt, 'dd MMM yyyy, hh:mm a')}
            />
            {settings.showCashier && (
              <ReceiptDetailRow
                label="Cashier"
                value={cashierName || sale?.cashierId || 'N/A'}
              />
            )}
            {settings.showCustomerDetails && (
              <ReceiptDetailRow label="Customer" value={customerName} />
            )}
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div
              className={clsx(
                'px-4 py-2 font-semibold uppercase tracking-wide text-xs',
                settings.template === 'modern'
                  ? 'bg-slate-900 text-white'
                  : 'bg-gray-100 text-gray-700'
              )}
            >
              Items
            </div>
            <div className="divide-y divide-gray-200">
              {sale?.items?.map((item, index) => {
                const lineDiscount = safeNumber(item.discount);
                const lineTax = safeNumber(item.taxAmount);
                const showLineDiscount =
                  settings.showItemNotes && lineDiscount > 0;
                const showLineTax =
                  settings.showItemNotes && lineTax > 0 && lineTax !== lineDiscount;

                return (
                  <div
                    key={`${item.productId}-${index}`}
                    className="px-4 py-3 flex justify-between gap-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {item.productName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.quantity} × {formatCurrency(item.unitPrice)}
                      </p>
                      {showLineDiscount && (
                        <p className="text-[11px] text-emerald-600">
                          Discount: {formatCurrency(lineDiscount)}
                        </p>
                      )}
                      {showLineTax && (
                        <p className="text-[11px] text-indigo-600">
                          Tax: {formatCurrency(lineTax)}
                        </p>
                      )}
                    </div>
                    <div className="text-right font-semibold">
                      {formatCurrency(safeNumber(item.total))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
            {settings.showDiscounts && totalDiscount > 0 && (
              <SummaryRow
                label="Discounts"
                value={`- ${formatCurrency(totalDiscount)}`}
                highlightColor="text-emerald-600"
              />
            )}
            {settings.showTaxBreakdown && totalTax > 0 && (
              <SummaryRow
                label="Tax"
                value={formatCurrency(totalTax)}
                highlightColor="text-indigo-600"
              />
            )}
            <SummaryRow
              label="Total"
              value={formatCurrency(grandTotal)}
              isTotal
              accentColor={settings.accentColor}
            />
            {showPaymentSummary &&
              sale.payments.map((payment, index) => (
                <SummaryRow
                  key={`${payment.method}-${index}`}
                  label={`Paid - ${toTitle(payment.method)}`}
                  value={formatCurrency(safeNumber(payment.amount))}
                />
              ))}
            {changeGiven > 0 && (
              <SummaryRow
                label="Change Due"
                value={formatCurrency(changeGiven)}
                highlightColor="text-amber-600"
              />
            )}
          </div>

          {settings.showNotes && sale?.notes && (
            <div className="px-4 py-3 border border-dashed border-gray-300 rounded-lg text-xs text-gray-600 bg-gray-50">
              <p className="font-medium text-gray-700 mb-1">Notes</p>
              <p>{sale.notes}</p>
            </div>
          )}

          {(settings.showBarcode || settings.showQRCode) && (
            <div className="flex flex-col items-center gap-4 py-4">
              {settings.showBarcode && (
                <Barcode
                  value={sale?.saleNumber || sale?._id || 'SALE'}
                  displayValue={false}
                  height={40}
                  background="transparent"
                />
              )}
              {settings.showQRCode && (
                <QRCodeSVG
                  value={JSON.stringify({
                    sale: sale?.saleNumber || sale?._id,
                    total: grandTotal,
                    customer: customerName,
                    date: createdAt.toISOString(),
                  })}
                  size={110}
                />
              )}
            </div>
          )}

          {settings.footerText && (
            <div className="text-center text-xs text-gray-500 border-t border-dashed pt-4">
              {settings.footerText}
            </div>
          )}
        </div>
      </div>
    );
  }
);

ReceiptPreview.displayName = 'ReceiptPreview';

export default ReceiptPreview;

function SummaryRow({
  label,
  value,
  isTotal = false,
  accentColor,
  highlightColor,
}: {
  label: string;
  value: string;
  isTotal?: boolean;
  accentColor?: string;
  highlightColor?: string;
}) {
  return (
    <div
      className={clsx(
        'flex justify-between items-center',
        isTotal
          ? 'text-base font-semibold border-t border-dashed pt-2 mt-2'
          : 'text-sm'
      )}
    >
      <span className={clsx('text-gray-600', isTotal && 'text-gray-900')}>
        {label}
      </span>
      <span
        className={clsx(
          'font-medium',
          isTotal && accentColor ? undefined : highlightColor
        )}
        style={isTotal && accentColor ? { color: accentColor } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

function ReceiptDetailRow({
  label,
  value,
  accent = false,
  accentColor,
}: {
  label: string;
  value: string;
  accent?: boolean;
  accentColor?: string;
}) {
  return (
    <div className="flex justify-between text-xs">
      <span className="uppercase tracking-wide text-gray-500">{label}</span>
      <span
        className={clsx(
          'font-semibold',
          accent ? 'text-gray-900' : 'text-gray-700'
        )}
        style={accent && accentColor ? { color: accentColor } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

function safeNumber(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function toTitle(value: string): string {
  return value
    ? value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ')
    : '';
}

function shadeColor(color: string, percent: number): string {
  let hex = color.replace('#', '');
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  const num = parseInt(hex, 16);
  const amt = Math.round(2.55 * percent);
  const r = (num >> 16) + amt;
  const g = ((num >> 8) & 0x00ff) + amt;
  const b = (num & 0x0000ff) + amt;

  return (
    '#' +
    (
      0x1000000 +
      (r < 255 ? (r < 0 ? 0 : r) : 255) * 0x10000 +
      (g < 255 ? (g < 0 ? 0 : g) : 255) * 0x100 +
      (b < 255 ? (b < 0 ? 0 : b) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

