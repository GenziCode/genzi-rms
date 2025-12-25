import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { formatCurrency } from '@/lib/utils';
import type { Invoice } from '@/types/invoice.types';

interface InvoiceTemplateClassicProps {
    invoice: Invoice;
    showBarcode?: boolean;
    showQRCode?: boolean;
}

const InvoiceTemplateClassic = React.forwardRef<HTMLDivElement, InvoiceTemplateClassicProps>(
    ({ invoice, showBarcode = true, showQRCode = true }, ref) => {
        return (
            <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto shadow-lg print:shadow-none font-serif">
                {/* Header */}
                <div className="border-b-2 border-black pb-6 mb-6">
                    <div className="flex justify-between items-start">
                        <div className="w-1/2">
                            {invoice.from.logo && (
                                <img
                                    src={invoice.from.logo}
                                    alt={invoice.from.businessName}
                                    className="h-16 mb-4 object-contain"
                                />
                            )}
                            <h1 className="text-4xl font-bold text-gray-900 uppercase tracking-wider mb-2">
                                {invoice.type.replace('_', ' ')}
                            </h1>
                            <div className="text-sm text-gray-600">
                                <p className="font-bold text-gray-900 text-lg">{invoice.from.businessName}</p>
                                <p>{invoice.from.address.line1}</p>
                                {invoice.from.address.line2 && <p>{invoice.from.address.line2}</p>}
                                <p>
                                    {invoice.from.address.city}, {invoice.from.address.state} {invoice.from.address.zipCode}
                                </p>
                                <p>{invoice.from.address.country}</p>
                                {invoice.from.taxId && <p className="mt-1">Tax ID: {invoice.from.taxId}</p>}
                            </div>
                        </div>
                        <div className="w-1/2 text-right">
                            <table className="ml-auto text-sm">
                                <tbody>
                                    <tr>
                                        <td className="font-bold pr-4 py-1 text-gray-600">Invoice #:</td>
                                        <td className="font-bold py-1">{invoice.invoiceNumber}</td>
                                    </tr>
                                    <tr>
                                        <td className="font-bold pr-4 py-1 text-gray-600">Date:</td>
                                        <td className="py-1">{new Date(invoice.date).toLocaleDateString()}</td>
                                    </tr>
                                    {invoice.dueDate && (
                                        <tr>
                                            <td className="font-bold pr-4 py-1 text-gray-600">Due Date:</td>
                                            <td className="py-1">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                                        </tr>
                                    )}
                                    {invoice.poNumber && (
                                        <tr>
                                            <td className="font-bold pr-4 py-1 text-gray-600">PO #:</td>
                                            <td className="py-1">{invoice.poNumber}</td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td className="font-bold pr-4 py-1 text-gray-600">Status:</td>
                                        <td className="py-1 uppercase">{invoice.status}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Bill To */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-gray-500 uppercase border-b border-gray-300 pb-1 mb-3">Bill To</h3>
                    <div className="text-sm">
                        <p className="font-bold text-lg text-gray-900">{invoice.to.customerName}</p>
                        <p className="text-gray-700">{invoice.to.address.line1}</p>
                        {invoice.to.address.line2 && <p className="text-gray-700">{invoice.to.address.line2}</p>}
                        <p className="text-gray-700">
                            {invoice.to.address.city}, {invoice.to.address.state} {invoice.to.address.zipCode}
                        </p>
                        <p className="text-gray-700">{invoice.to.address.country}</p>
                        {invoice.to.address.phone && <p className="text-gray-700">Phone: {invoice.to.address.phone}</p>}
                        {invoice.to.address.email && <p className="text-gray-700">Email: {invoice.to.address.email}</p>}
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-8">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b-2 border-black">
                                <th className="text-left py-2 font-bold text-gray-900 uppercase w-1/2">Description</th>
                                <th className="text-center py-2 font-bold text-gray-900 uppercase">Qty</th>
                                <th className="text-right py-2 font-bold text-gray-900 uppercase">Price</th>
                                <th className="text-right py-2 font-bold text-gray-900 uppercase">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((item, index) => (
                                <tr key={index} className="border-b border-gray-200">
                                    <td className="py-3 pr-4">
                                        <p className="font-bold text-gray-900">{item.productName}</p>
                                        {item.description && item.description !== item.productName && (
                                            <p className="text-gray-600 text-xs mt-1">{item.description}</p>
                                        )}
                                    </td>
                                    <td className="py-3 text-center align-top">{item.quantity}</td>
                                    <td className="py-3 text-right align-top">{formatCurrency(item.unitPrice)}</td>
                                    <td className="py-3 text-right align-top font-bold">{formatCurrency(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-10">
                    <div className="w-1/3">
                        <table className="w-full text-sm">
                            <tbody>
                                <tr>
                                    <td className="py-1 text-gray-600 text-right pr-4">Subtotal:</td>
                                    <td className="py-1 text-right font-medium">{formatCurrency(invoice.subtotal)}</td>
                                </tr>
                                {invoice.totalDiscount > 0 && (
                                    <tr>
                                        <td className="py-1 text-gray-600 text-right pr-4">Discount:</td>
                                        <td className="py-1 text-right text-red-600">-{formatCurrency(invoice.totalDiscount)}</td>
                                    </tr>
                                )}
                                <tr>
                                    <td className="py-1 text-gray-600 text-right pr-4">Tax:</td>
                                    <td className="py-1 text-right font-medium">{formatCurrency(invoice.totalTax)}</td>
                                </tr>
                                <tr className="border-t-2 border-black">
                                    <td className="py-2 text-gray-900 text-right pr-4 font-bold text-lg">Total:</td>
                                    <td className="py-2 text-right font-bold text-lg">{formatCurrency(invoice.total)}</td>
                                </tr>
                                {invoice.amountPaid > 0 && (
                                    <tr>
                                        <td className="py-1 text-gray-600 text-right pr-4">Amount Paid:</td>
                                        <td className="py-1 text-right text-green-600">-{formatCurrency(invoice.amountPaid)}</td>
                                    </tr>
                                )}
                                {invoice.amountDue > 0 && (
                                    <tr className="bg-gray-100">
                                        <td className="py-2 text-gray-900 text-right pr-4 font-bold">Amount Due:</td>
                                        <td className="py-2 text-right font-bold text-red-600">{formatCurrency(invoice.amountDue)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Notes & Terms */}
                <div className="grid grid-cols-2 gap-8 mb-8 text-sm border-t border-gray-300 pt-6">
                    {invoice.notes && (
                        <div>
                            <h4 className="font-bold text-gray-900 mb-2 uppercase text-xs">Notes</h4>
                            <p className="text-gray-600">{invoice.notes}</p>
                        </div>
                    )}
                    {invoice.terms && (
                        <div>
                            <h4 className="font-bold text-gray-900 mb-2 uppercase text-xs">Terms & Conditions</h4>
                            <p className="text-gray-600">{invoice.terms}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t-2 border-black pt-4 flex justify-between items-end">
                    <div className="text-xs text-gray-500">
                        <p>Thank you for your business.</p>
                        {invoice.footer && <p className="mt-1">{invoice.footer}</p>}
                    </div>
                    {(showBarcode || showQRCode) && (
                        <div className="flex gap-4">
                            {showBarcode && invoice.barcode && (
                                <Barcode value={invoice.barcode} width={1} height={30} fontSize={10} displayValue={false} />
                            )}
                            {showQRCode && invoice.qrCode && (
                                <QRCodeSVG value={invoice.qrCode} size={60} />
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }
);

InvoiceTemplateClassic.displayName = 'InvoiceTemplateClassic';

export default InvoiceTemplateClassic;
