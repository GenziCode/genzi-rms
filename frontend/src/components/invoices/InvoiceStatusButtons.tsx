import { CheckCircle, Send, DollarSign, XCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '@/services/invoice.service';
import type { Invoice, DocumentStatus } from '@/types/invoice.types';
import toast from 'react-hot-toast';

interface InvoiceStatusButtonsProps {
  invoice: Invoice;
}

export default function InvoiceStatusButtons({
  invoice,
}: InvoiceStatusButtonsProps) {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: (status: DocumentStatus) =>
      invoiceService.updateStatus(invoice.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice status updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  const getAvailableActions = () => {
    const actions: Array<{
      status: DocumentStatus;
      label: string;
      icon: any;
      color: string;
    }> = [];

    switch (invoice.status) {
      case 'draft':
        actions.push(
          {
            status: 'pending',
            label: 'Mark as Pending',
            icon: CheckCircle,
            color: 'yellow',
          },
          { status: 'sent', label: 'Mark as Sent', icon: Send, color: 'blue' },
          { status: 'cancelled', label: 'Cancel', icon: XCircle, color: 'gray' }
        );
        break;
      case 'pending':
        actions.push(
          { status: 'sent', label: 'Mark as Sent', icon: Send, color: 'blue' },
          {
            status: 'paid',
            label: 'Mark as Paid',
            icon: DollarSign,
            color: 'green',
          },
          { status: 'cancelled', label: 'Cancel', icon: XCircle, color: 'gray' }
        );
        break;
      case 'sent':
        actions.push(
          {
            status: 'paid',
            label: 'Mark as Paid',
            icon: DollarSign,
            color: 'green',
          },
          {
            status: 'overdue',
            label: 'Mark as Overdue',
            icon: XCircle,
            color: 'red',
          },
          { status: 'cancelled', label: 'Cancel', icon: XCircle, color: 'gray' }
        );
        break;
      case 'partial':
        actions.push({
          status: 'paid',
          label: 'Mark as Paid',
          icon: DollarSign,
          color: 'green',
        });
        break;
      case 'overdue':
        actions.push(
          {
            status: 'paid',
            label: 'Mark as Paid',
            icon: DollarSign,
            color: 'green',
          },
          { status: 'void', label: 'Void Invoice', icon: XCircle, color: 'red' }
        );
        break;
    }

    return actions;
  };

  const getColorClasses = (color: string) => {
    const colors = {
      yellow: 'bg-yellow-600 hover:bg-yellow-700',
      blue: 'bg-blue-600 hover:bg-blue-700',
      green: 'bg-green-600 hover:bg-green-700',
      red: 'bg-red-600 hover:bg-red-700',
      gray: 'bg-gray-600 hover:bg-gray-700',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const availableActions = getAvailableActions();

  if (
    availableActions.length === 0 ||
    ['paid', 'void', 'cancelled'].includes(invoice.status)
  ) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {availableActions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.status}
            onClick={() => {
              if (confirm(`${action.label}?`)) {
                updateStatusMutation.mutate(action.status);
              }
            }}
            disabled={updateStatusMutation.isPending}
            className={`flex items-center px-3 py-2 text-white rounded-lg transition text-sm disabled:opacity-50 ${getColorClasses(action.color)}`}
          >
            <Icon className="w-4 h-4 mr-2" />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
