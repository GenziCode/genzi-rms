import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Send, Loader2, Mail, MessageCircle, Paperclip } from 'lucide-react';
import toast from 'react-hot-toast';
import { invoiceService } from '@/services/invoice.service';
import type { Invoice } from '@/types/invoice.types';
import { formatCurrency } from '@/lib/utils';

type SendMode = 'email' | 'sms';

interface SendInvoiceModalProps {
  invoice: Invoice;
  mode: SendMode;
  onClose: () => void;
}

interface EmailFormState {
  to: string;
  subject: string;
  message: string;
  attachPdf: boolean;
}

interface SmsFormState {
  phone: string;
  message: string;
}

const buildDefaultEmailMessage = (invoice: Invoice) => {
  const greetingName = invoice.to.customerName || 'there';
  const total = formatCurrency(invoice.total);
  const dueLine = invoice.dueDate ? `\nDue Date: ${invoice.dueDate}` : '';

  return `Hi ${greetingName},\n\nPlease find attached invoice #${invoice.invoiceNumber} for ${total}.${dueLine}\n\nIf you have any questions, feel free to reply to this email.\n\nThank you,\n${invoice.from.businessName}`;
};

const buildDefaultSmsMessage = (invoice: Invoice) => {
  const total = formatCurrency(invoice.total);
  const dueLine = invoice.dueDate ? ` due ${invoice.dueDate}` : '';
  return `Invoice ${invoice.invoiceNumber}: ${total}${dueLine}. Reply with questions.`;
};

export default function SendInvoiceModal({ invoice, mode, onClose }: SendInvoiceModalProps) {
  const queryClient = useQueryClient();

  const [emailForm, setEmailForm] = useState<EmailFormState>(() => ({
    to: invoice.to.address.email || '',
    subject: `Invoice ${invoice.invoiceNumber} from ${invoice.from.businessName}`,
    message: buildDefaultEmailMessage(invoice),
    attachPdf: true,
  }));

  const [smsForm, setSmsForm] = useState<SmsFormState>(() => ({
    phone: invoice.to.address.phone || '',
    message: buildDefaultSmsMessage(invoice),
  }));

  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === 'email') {
        if (!emailForm.to) {
          throw new Error('Please provide a recipient email address.');
        }

        await invoiceService.sendEmail(invoice.id, emailForm.to, {
          subject: emailForm.subject,
          message: emailForm.message,
          attachPdf: emailForm.attachPdf,
        });
      } else {
        if (!smsForm.phone) {
          throw new Error('Please provide a recipient phone number.');
        }

        await invoiceService.sendSMS(invoice.id, smsForm.phone, {
          message: smsForm.message,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success(
        mode === 'email' ? 'Invoice email sent successfully!' : 'Invoice SMS sent successfully!'
      );
      onClose();
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        (mode === 'email'
          ? 'Failed to send invoice email'
          : 'Failed to send invoice SMS');
      toast.error(message);
    },
  });

  const messageLength = useMemo(() => {
    if (mode === 'email') {
      return emailForm.message.length;
    }
    return smsForm.message.length;
  }, [mode, emailForm.message, smsForm.message]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mutation.isPending) return;
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2">
            {mode === 'email' ? (
              <Mail className="h-5 w-5 text-blue-600" />
            ) : (
              <MessageCircle className="h-5 w-5 text-emerald-600" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {mode === 'email' ? 'Email Invoice' : 'Send SMS Invoice'}
              </h3>
              <p className="text-sm text-gray-500">
                Invoice #{invoice.invoiceNumber} · {formatCurrency(invoice.total)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close send invoice modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {mode === 'email' ? (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={emailForm.to}
                  onChange={(event) =>
                    setEmailForm((prev) => ({ ...prev, to: event.target.value }))
                  }
                  placeholder="customer@example.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
                <input
                  type="text"
                  value={emailForm.subject}
                  onChange={(event) =>
                    setEmailForm((prev) => ({ ...prev, subject: event.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  maxLength={150}
                />
                <p className="mt-1 text-xs text-gray-400">
                  {emailForm.subject.length}/150 characters
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Message</label>
                <textarea
                  value={emailForm.message}
                  onChange={(event) =>
                    setEmailForm((prev) => ({ ...prev, message: event.target.value }))
                  }
                  rows={6}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  maxLength={2000}
                />
                <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
                  <span>Include any personal note before the invoice summary.</span>
                  <span>{messageLength}/2000</span>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 shadow-sm transition hover:border-blue-200">
                <input
                  type="checkbox"
                  checked={emailForm.attachPdf}
                  onChange={(event) =>
                    setEmailForm((prev) => ({ ...prev, attachPdf: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-blue-600" />
                  <span>Attach PDF invoice</span>
                </div>
              </label>
            </>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Recipient Phone
                </label>
                <input
                  type="tel"
                  value={smsForm.phone}
                  onChange={(event) =>
                    setSmsForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  placeholder="+1 555 123 4567"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  value={smsForm.message}
                  onChange={(event) =>
                    setSmsForm((prev) => ({ ...prev, message: event.target.value }))
                  }
                  rows={4}
                  maxLength={320}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
                <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
                  <span>SMS messages longer than 160 characters may be split.</span>
                  <span>{messageLength}/320</span>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              disabled={mutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow transition ${
                mode === 'email'
                  ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/40'
                  : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500/40'
              } disabled:cursor-not-allowed disabled:opacity-70`}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {mode === 'email' ? 'Send Email' : 'Send SMS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


