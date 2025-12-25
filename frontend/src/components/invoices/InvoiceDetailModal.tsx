import { useState, useRef } from 'react';
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
  LayoutTemplate,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '@/services/invoice.service';
import type { Invoice } from '@/types/invoice.types';
import toast from 'react-hot-toast';
import RecordPaymentModal from './RecordPaymentModal';
import SendInvoiceModal from './SendInvoiceModal';
import InvoiceTemplateModern from './InvoiceTemplateModern';
import InvoiceTemplateClassic from './InvoiceTemplateClassic';
import { useReactToPrint } from 'react-to-print';

interface InvoiceDetailModalProps {
  invoice: Invoice;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

type TemplateType = 'modern' | 'classic';

export default function InvoiceDetailModal({
  invoice,
  onClose,
  onEdit,
  onDelete,
}: InvoiceDetailModalProps) {
  const queryClient = useQueryClient();
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [sendMode, setSendMode] = useState<'email' | 'sms' | null>(null);
  const [template, setTemplate] = useState<TemplateType>('modern');
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${invoice.invoiceNumber}`,
  });

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
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">
              #{invoice.invoiceNumber}
            </h2>
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTemplate('modern')}
                className={`px-3 py-1 text-sm rounded-md transition ${template === 'modern'
                  ? 'bg-white shadow text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-200'
                  }`}
              >
                Modern
              </button>
              <button
                onClick={() => setTemplate('classic')}
                className={`px-3 py-1 text-sm rounded-md transition ${template === 'classic'
                  ? 'bg-white shadow text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-200'
                  }`}
              >
                Classic
              </button>
            </div>
          </div>

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
                Convert
              </button>
            )}
            {invoice.amountDue > 0 &&
              !['cancelled', 'void'].includes(invoice.status) && (
                <button
                  onClick={() => setShowRecordPayment(true)}
                  className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Pay
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
        <div className="flex-1 bg-gray-100 p-8 overflow-y-auto">
          {template === 'modern' ? (
            <InvoiceTemplateModern ref={printRef} invoice={invoice} />
          ) : (
            <InvoiceTemplateClassic ref={printRef} invoice={invoice} />
          )}
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
