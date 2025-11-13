import { useState } from 'react';
import {
  X,
  Download,
  Send,
  Printer,
  Edit,
  Trash2,
  DollarSign,
  Copy,
  MessageCircle,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import { invoiceService } from '@/services/invoice.service';
import type { Invoice } from '@/types/invoice.types';
import toast from 'react-hot-toast';
import InvoiceStatusButtons from './InvoiceStatusButtons';
import RecordPaymentModal from './RecordPaymentModal';
import SendInvoiceModal from './SendInvoiceModal';

interface InvoiceDetailModalProps {
  invoice: Invoice;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function InvoiceDetailModal({
  invoice,
  onClose,
  onEdit,
  onDelete,
}: InvoiceDetailModalProps) {
  const queryClient = useQueryClient();
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [sendMode, setSendMode] = useState<'email' | 'sms' | null>(null);

  const downloadPDFMutation = useMutation({
    mutationFn: () => invoiceService.downloadPDF(invoice.id),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully!');
    },
    onError: () => {
      toast.error('Failed to generate PDF');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: () => invoiceService.duplicate(invoice.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice duplicated successfully!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to duplicate invoice'
      );
    },
  });

  const convertMutation = useMutation({
    mutationFn: () => invoiceService.convertQuotation(invoice.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Quotation converted to invoice!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to convert quotation'
      );
    },
  });

  const handleDownloadPDF = () => {
    downloadPDFMutation.mutate();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDuplicate = () => {
    if (confirm('Duplicate this invoice?')) {
      duplicateMutation.mutate();
    }
  };

  const handleConvert = () => {
    if (confirm('Convert this quotation to an invoice?')) {
      convertMutation.mutate();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            Invoice #{invoice.invoiceNumber}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={downloadPDFMutation.isPending}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
              title="Download PDF"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                if (!invoice.to.address.email) {
                  toast.error('Customer email is required');
                  return;
                }
                setSendMode('email');
              }}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
              disabled={!invoice.to.address.email}
              title="Send Email"
            >
              <Send className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                if (!invoice.to.address.phone) {
                  toast.error('Customer phone number is required');
                  return;
                }
                setSendMode('sms');
              }}
              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition disabled:opacity-50"
              disabled={!invoice.to.address.phone}
              title="Send SMS"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
              title="Print"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={handleDuplicate}
              disabled={duplicateMutation.isPending}
              className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition disabled:opacity-50"
              title="Duplicate"
            >
              <Copy className="w-5 h-5" />
            </button>
            {invoice.type === 'quotation' && invoice.status !== 'cancelled' && (
              <button
                onClick={handleConvert}
                disabled={convertMutation.isPending}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                title="Convert to Invoice"
              >
                Convert to Invoice
              </button>
            )}
            {invoice.amountDue > 0 &&
              !['cancelled', 'void'].includes(invoice.status) && (
                <button
                  onClick={() => setShowRecordPayment(true)}
                  className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Record Payment
                </button>
              )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                title="Edit"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}
            {onDelete && invoice.status === 'draft' && (
              <button
                onClick={onDelete}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-8" id="invoice-content">
          {/* Header Section */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-blue-600 mb-2">INVOICE</h1>
              <p className="text-gray-600">
                Invoice #: {invoice.invoiceNumber}
              </p>
              <p className="text-gray-600">
                Date: {new Date(invoice.date).toLocaleDateString()}
              </p>
              {invoice.dueDate && (
                <p className="text-gray-600">
                  Due Date: {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-gray-900 mb-2">FROM:</h2>
              <p className="text-gray-900 font-semibold">
                {invoice.from.businessName}
              </p>
              <p className="text-gray-600">{invoice.from.address.street}</p>
              <p className="text-gray-600">
                {invoice.from.address.city}, {invoice.from.address.state}{' '}
                {invoice.from.address.zipCode}
              </p>
              <p className="text-gray-600">{invoice.from.address.country}</p>
              {invoice.from.address.email && (
                <p className="text-gray-600">{invoice.from.address.email}</p>
              )}
              {invoice.from.address.phone && (
                <p className="text-gray-600">{invoice.from.address.phone}</p>
              )}
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-2">BILL TO:</h3>
            <p className="text-gray-900 font-semibold">
              {invoice.to.customerName}
            </p>
            <p className="text-gray-600">{invoice.to.address.street}</p>
            <p className="text-gray-600">
              {invoice.to.address.city}, {invoice.to.address.state}{' '}
              {invoice.to.address.zipCode}
            </p>
            <p className="text-gray-600">{invoice.to.address.country}</p>
            {invoice.to.address.email && (
              <p className="text-gray-600">{invoice.to.address.email}</p>
            )}
            {invoice.to.address.phone && (
              <p className="text-gray-600">{invoice.to.address.phone}</p>
            )}
          </div>

          {/* Status Badge & Actions */}
          <div className="mb-6 flex items-center justify-between">
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                invoice.status === 'paid'
                  ? 'bg-green-100 text-green-700'
                  : invoice.status === 'overdue'
                    ? 'bg-red-100 text-red-700'
                    : invoice.status === 'draft'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {invoice.status.toUpperCase()}
            </span>
            <InvoiceStatusButtons invoice={invoice} />
          </div>

          {/* Line Items */}
          <div className="mb-8">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-300">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="px-4 py-3 text-gray-900">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 font-semibold">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-80 space-y-2">
              <div className="flex justify-between text-gray-900">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-gray-900">
                  <span>Discount:</span>
                  <span className="text-red-600">
                    -{formatCurrency(invoice.discountAmount)}
                  </span>
                </div>
              )}
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-gray-900">
                  <span>Tax:</span>
                  <span>{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t-2 border-gray-300">
                <span>Total:</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
              {invoice.amountPaid > 0 && (
                <div className="flex justify-between text-gray-900">
                  <span>Amount Paid:</span>
                  <span className="text-green-600">
                    -{formatCurrency(invoice.amountPaid)}
                  </span>
                </div>
              )}
              {invoice.amountDue > 0 && (
                <div className="flex justify-between text-lg font-bold text-orange-600">
                  <span>Amount Due:</span>
                  <span>{formatCurrency(invoice.amountDue)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes & Terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="grid grid-cols-2 gap-6 pt-6 border-t">
              {invoice.notes && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Notes:</h4>
                  <p className="text-gray-600 text-sm">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Terms & Conditions:
                  </h4>
                  <p className="text-gray-600 text-sm">{invoice.terms}</p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t text-center text-gray-500 text-sm">
            <p>Thank you for your business!</p>
          </div>
        </div>

        {/* Record Payment Modal */}
        {showRecordPayment && (
          <RecordPaymentModal
            invoiceId={invoice.id}
            amountDue={invoice.amountDue}
            onClose={() => setShowRecordPayment(false)}
          />
        )}

        {sendMode && (
          <SendInvoiceModal
            invoice={invoice}
            mode={sendMode}
            onClose={() => setSendMode(null)}
          />
        )}
      </div>
    </div>
  );
}
