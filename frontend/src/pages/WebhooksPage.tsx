import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Webhook,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Send,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Copy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  webhooksService,
  type WebhookConfig,
} from '@/services/webhooks.service';

const AVAILABLE_EVENTS = [
  'sale.created',
  'sale.updated',
  'sale.cancelled',
  'payment.received',
  'payment.failed',
  'product.created',
  'product.updated',
  'product.deleted',
  'inventory.low_stock',
  'inventory.out_of_stock',
  'customer.created',
  'customer.updated',
  'order.created',
  'order.shipped',
];

export default function WebhooksPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    maxRetries: 3,
  });
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});

  // Fetch webhooks
  const { data, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => webhooksService.getAll(),
  });

  const webhooks = data?.webhooks || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: {
      name: string;
      url: string;
      events: string[];
      maxRetries: number;
    }) => webhooksService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook created successfully!');
      setShowModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create webhook');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      webhooksService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook updated successfully!');
      setShowModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update webhook');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => webhooksService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete webhook');
    },
  });

  // Test mutation
  const testMutation = useMutation({
    mutationFn: (id: string) => webhooksService.test(id),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Test webhook sent successfully!');
      } else {
        toast.error(data.error || 'Test webhook failed');
      }
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to send test webhook'
      );
    },
  });

  const handleOpenModal = (webhook?: WebhookConfig) => {
    if (webhook) {
      setEditingWebhook(webhook);
      setFormData({
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        maxRetries: webhook.maxRetries,
      });
    } else {
      setEditingWebhook(null);
      setFormData({ name: '', url: '', events: [], maxRetries: 3 });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.events.length === 0) {
      toast.error('Select at least one event');
      return;
    }

    if (editingWebhook) {
      updateMutation.mutate({
        id: editingWebhook._id,
        data: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleEvent = (event: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  const handleTest = (webhook: WebhookConfig) => {
    testMutation.mutate(webhook._id);
  };

  const toggleSecret = (id: string) => {
    setVisibleSecrets(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Webhooks</h1>
          <p className="text-gray-600 mt-1">
            Configure webhook endpoints for event notifications
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Webhook
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Webhooks</p>
          <p className="text-2xl font-bold text-gray-900">{webhooks.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {webhooks.filter((w) => w.isActive).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Deliveries</p>
          <p className="text-2xl font-bold text-blue-600">
            {webhooks.reduce((sum, w) => sum + w.deliveryCount, 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Failed Deliveries</p>
          <p className="text-2xl font-bold text-red-600">
            {webhooks.reduce((sum, w) => sum + w.failureCount, 0)}
          </p>
        </div>
      </div>

      {/* Webhooks List */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading webhooks...</p>
        </div>
      ) : webhooks.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Webhook className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No webhooks configured
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first webhook to receive real-time event notifications
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Webhook
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div key={webhook._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {webhook.name}
                    </h3>
                    {webhook.isActive ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                        INACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 font-mono mb-3">
                    {webhook.url}
                  </p>

                  {/* Secret Display */}
                  <div className="flex items-center gap-2 mb-3 bg-gray-50 p-2 rounded-md w-fit">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Secret:</span>
                    <code className="text-sm font-mono text-gray-800">
                      {visibleSecrets[webhook._id] ? webhook.secret : '••••••••••••••••••••••••'}
                    </code>
                    <button
                      onClick={() => toggleSecret(webhook._id)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                      title={visibleSecrets[webhook._id] ? 'Hide Secret' : 'Show Secret'}
                    >
                      {visibleSecrets[webhook._id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(webhook.secret);
                        toast.success('Secret copied to clipboard');
                      }}
                      className="p-1 text-gray-500 hover:text-gray-700"
                      title="Copy Secret"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {webhook.events.map((event) => (
                      <span
                        key={event}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Deliveries: {webhook.deliveryCount}</span>
                    <span>Failures: {webhook.failureCount}</span>
                    {webhook.lastDeliveryAt && (
                      <span className="flex items-center gap-1">
                        {webhook.lastDeliveryStatus === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        Last:{' '}
                        {new Date(webhook.lastDeliveryAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTest(webhook)}
                    disabled={testMutation.isPending}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition disabled:opacity-50"
                    title="Test webhook"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleOpenModal(webhook)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this webhook?')) {
                        deleteMutation.mutate(webhook._id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingWebhook ? 'Edit Webhook' : 'Create New Webhook'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="My Webhook"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endpoint URL
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="https://api.example.com/webhooks"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Events ({formData.events.length} selected)
                </label>
                <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_EVENTS.map((event) => (
                      <label
                        key={event}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.events.includes(event)}
                          onChange={() => handleToggleEvent(event)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-700">{event}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Retries
                </label>
                <input
                  type="number"
                  value={formData.maxRetries}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxRetries: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="10"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingWebhook
                      ? 'Update Webhook'
                      : 'Create Webhook'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
