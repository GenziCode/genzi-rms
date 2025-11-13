import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { formatCurrency } from '@/lib/utils';
import type { Invoice } from '@/types/invoice.types';

interface InvoiceTemplateModernProps {
  invoice: Invoice;
  showBarcode?: boolean;
  showQRCode?: boolean;
}

const InvoiceTemplateModern = React.forwardRef<HTMLDivElement, InvoiceTemplateModernProps>(
  ({ invoice, showBarcode = true, showQRCode = true }, ref) => {
    return (
      <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto shadow-lg print:shadow-none">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg -mx-8 -mt-8 mb-6">
          <div className="flex justify-between items-start">
            <div>
              {invoice.from.logo && (
                <img
                  src={invoice.from.logo}
                  alt={invoice.from.businessName}
                  className="h-12 mb-3 bg-white p-2 rounded"
                />
              )}
              <h1 className="text-3xl font-bold mb-1">{invoice.type.replace('_', ' ').toUpperCase()}</h1>
              <p className="text-blue-100 text-sm">{invoice.from.businessName}</p>
            </div>
            <div className="text-right">
              <div className="bg-white text-gray-900 px-4 py-2 rounded-lg inline-block">
                <div className="text-xs text-gray-600">Invoice #</div>
                <div className="text-xl font-bold">{invoice.invoiceNumber}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Bill From */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">From</h3>
            <div className="text-sm">
              <p className="font-semibold text-gray-900">{invoice.from.businessName}</p>
              <p className="text-gray-600">{invoice.from.address.line1}</p>
              {invoice.from.address.line2 && <p className="text-gray-600">{invoice.from.address.line2}</p>}
              <p className="text-gray-600">
                {invoice.from.address.city}, {invoice.from.address.state} {invoice.from.address.zipCode}
              </p>
              {invoice.from.address.phone && <p className="text-gray-600">{invoice.from.address.phone}</p>}
              {invoice.from.address.email && <p className="text-blue-600">{invoice.from.address.email}</p>}
              {invoice.from.taxId && <p className="text-gray-600 mt-1 text-xs">Tax ID: {invoice.from.taxId}</p>}
            </div>
          </div>

          {/* Bill To */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Bill To</h3>
            <div className="text-sm">
              <p className="font-semibold text-gray-900">{invoice.to.customerName}</p>
              <p className="text-gray-600">{invoice.to.address.line1}</p>
              {invoice.to.address.line2 && <p className="text-gray-600">{invoice.to.address.line2}</p>}
              <p className="text-gray-600">
                {invoice.to.address.city}, {invoice.to.address.state} {invoice.to.address.zipCode}
              </p>
              {invoice.to.address.phone && <p className="text-gray-600">{invoice.to.address.phone}</p>}
              {invoice.to.address.email && <p className="text-blue-600">{invoice.to.address.email}</p>}
            </div>
          </div>

          {/* Invoice Info */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Details</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{new Date(invoice.date).toLocaleDateString()}</span>
              </div>
              {invoice.dueDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Due Date:</span>
                  <span className="font-medium text-orange-600">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {invoice.poNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600">PO #:</span>
                  <span className="font-medium">{invoice.poNumber}</span>
                </div>
              )}
              {invoice.salesPerson && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Sales Rep:</span>
                  <span className="font-medium">{invoice.salesPerson}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                  invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                  invoice.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {invoice.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-y border-gray-300">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Item</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Qty</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Unit Price</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Tax</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{item.productName}</div>
                    {item.description && <div className="text-xs text-gray-500">{item.description}</div>}
                    {item.sku && <div className="text-xs text-gray-400">SKU: {item.sku}</div>}
                  </td>
                  <td className="py-3 px-4 text-center text-sm">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="py-3 px-4 text-right text-sm">
                    {formatCurrency(item.unitPrice)}
                    {item.discount && item.discount > 0 && (
                      <div className="text-xs text-green-600">
                        -{item.discountType === 'percentage' ? `${item.discount}%` : formatCurrency(item.discount)}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-sm">
                    {item.taxRate ? `${item.taxRate}%` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-medium">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-80">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.totalDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span className="font-medium">-{formatCurrency(invoice.totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Tax:</span>
                <span className="font-medium">{formatCurrency(invoice.totalTax)}</span>
              </div>
              {invoice.shippingCost && invoice.shippingCost > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Shipping:</span>
                  <span className="font-medium">{formatCurrency(invoice.shippingCost)}</span>
                </div>
              )}
              {invoice.adjustments && invoice.adjustments !== 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Adjustments:</span>
                  <span className="font-medium">{formatCurrency(invoice.adjustments)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-lg font-bold text-gray-900">
                <span>Total:</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
              {invoice.amountPaid > 0 && (
                <>
                  <div className="flex justify-between text-green-600">
                    <span>Paid:</span>
                    <span className="font-medium">-{formatCurrency(invoice.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-orange-600">
                    <span>Amount Due:</span>
                    <span>{formatCurrency(invoice.amountDue)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Payment History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="mb-6 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment History</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Date</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Method</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Reference</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((payment, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 px-3">{new Date(payment.date).toLocaleDateString()}</td>
                    <td className="py-2 px-3 capitalize">{payment.method}</td>
                    <td className="py-2 px-3 text-gray-600">{payment.reference || '-'}</td>
                    <td className="py-2 px-3 text-right font-medium text-green-600">
                      {formatCurrency(payment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Notes & Terms */}
        {(invoice.notes || invoice.terms) && (
          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            {invoice.notes && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Notes</h3>
                <p className="text-gray-600 whitespace-pre-line">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Terms & Conditions</h3>
                <p className="text-gray-600 whitespace-pre-line text-xs">{invoice.terms}</p>
              </div>
            )}
          </div>
        )}

        {/* Barcode & QR Code */}
        {(showBarcode || showQRCode) && (
          <div className="flex justify-between items-end border-t pt-6">
            {showBarcode && invoice.barcode && (
              <div>
                <Barcode
                  value={invoice.barcode}
                  width={1.5}
                  height={50}
                  fontSize={12}
                  displayValue={true}
                />
              </div>
            )}
            {showQRCode && invoice.qrCode && (
              <div className="text-center">
                <QRCodeSVG value={invoice.qrCode} size={100} level="H" />
                <p className="text-xs text-gray-500 mt-1">Scan to view online</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {invoice.footer && (
          <div className="mt-6 pt-4 border-t text-center text-xs text-gray-500">
            {invoice.footer}
          </div>
        )}

        {/* Watermark for draft/cancelled */}
        {(invoice.status === 'draft' || invoice.status === 'cancelled' || invoice.status === 'void') && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`text-8xl font-bold transform -rotate-45 ${
              invoice.status === 'draft' ? 'text-gray-300' : 'text-red-300'
            } opacity-20`}>
              {invoice.status.toUpperCase()}
            </div>
          </div>
        )}
      </div>
    );
  }
);

InvoiceTemplateModern.displayName = 'InvoiceTemplateModern';

export default InvoiceTemplateModern;

