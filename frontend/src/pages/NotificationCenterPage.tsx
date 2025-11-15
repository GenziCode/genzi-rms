import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Bell,
  Filter,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  Settings2,
  TableOfContents,
} from 'lucide-react';
import {
  notificationAdminService,
  type NotificationLog,
  type NotificationChannel,
  type NotificationRouteConfig,
  type NotificationStatus,
} from '@/services/notifications.service';

const channelIcons: Record<NotificationChannel, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  sms: Send,
  webhook: TableOfContents,
  in_app: Bell,
};

const statusColors: Record<NotificationStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  scheduled: 'bg-slate-100 text-slate-600',
  sending: 'bg-sky-100 text-sky-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-rose-100 text-rose-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const defaultChannels: NotificationChannel[] = ['email', 'sms', 'webhook', 'in_app'];

export default function NotificationCenterPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<{
    status: '' | NotificationStatus;
    channel: '' | NotificationChannel;
    search: string;
  }>({
    status: '',
    channel: '',
    search: '',
  });
  const [isComposerOpen, setComposerOpen] = useState(false);
  const [isRouteDrawerOpen, setRouteDrawerOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<NotificationRouteConfig | null>(null);

  const notificationsQuery = useQuery({
    queryKey: ['notifications', filters],
    queryFn: () =>
      notificationAdminService.list({
        status: filters.status || undefined,
        channel: filters.channel || undefined,
        limit: 50,
      }),
  });

  const routesQuery = useQuery({
    queryKey: ['notification-routes'],
    queryFn: () => notificationAdminService.listRoutes(),
  });

  const filteredRecords = useMemo(() => {
    const records = notificationsQuery.data?.records ?? [];
    if (!filters.search.trim()) {
      return records;
    }
    const term = filters.search.toLowerCase();
    return records.filter(
      (notif) =>
        notif.eventKey.toLowerCase().includes(term) ||
        notif.recipients.some(
          (recipient) =>
            recipient.email?.toLowerCase().includes(term) ||
            recipient.phone?.toLowerCase().includes(term) ||
            recipient.name?.toLowerCase().includes(term)
        )
    );
  }, [notificationsQuery.data?.records, filters.search]);

  const createNotificationMutation = useMutation({
    mutationFn: notificationAdminService.create,
    onSuccess: () => {
      toast.success('Notification sent');
      setComposerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => toast.error('Unable to send notification'),
  });

  const upsertRouteMutation = useMutation({
    mutationFn: notificationAdminService.upsertRoute,
    onSuccess: () => {
      toast.success('Route saved');
      setRouteDrawerOpen(false);
      setSelectedRoute(null);
      queryClient.invalidateQueries({ queryKey: ['notification-routes'] });
    },
    onError: () => toast.error('Unable to save route'),
  });

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
            Platform
          </p>
          <h1 className="text-3xl font-bold text-gray-900">Notification Center</h1>
          <p className="text-gray-600 mt-1">
            Monitor outgoing communication, send test messages, and configure routing rules.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => notificationsQuery.refetch()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {notificationsQuery.isFetching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </button>
          <button
            onClick={() => setRouteDrawerOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Settings2 className="w-4 h-4" />
            Manage Routes
          </button>
          <button
            onClick={() => setComposerOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
            Send Test
          </button>
        </div>
      </header>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              placeholder="Search event or recipient..."
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, search: event.target.value }))
              }
              className="w-full rounded-xl border border-gray-200 pl-9 pr-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                status: event.target.value as NotificationStatus | '',
              }))
            }
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Any status</option>
            {Object.keys(statusColors).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            value={filters.channel}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                channel: event.target.value as NotificationChannel | '',
              }))
            }
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Any channel</option>
            {defaultChannels.map((channel) => (
              <option key={channel} value={channel}>
                {channel}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          {notificationsQuery.isLoading ? (
            <div className="py-16 flex flex-col items-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mb-3" />
              Loading notifications...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-gray-500">
              <Bell className="w-10 h-10 text-gray-300 mb-3" />
              No notifications found for the selected filters.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Channels</th>
                  <th className="py-3 px-4">Recipients</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Attempts</th>
                  <th className="py-3 px-4">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.map((notification: NotificationLog) => (
                  <tr key={notification._id} className="hover:bg-gray-50/70">
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {notification.eventKey}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-2">
                        {notification.channels.map((channel) => {
                          const Icon = channelIcons[channel];
                          return (
                            <span
                              key={`${notification._id}-${channel}`}
                              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                            >
                              <Icon className="w-3 h-3" />
                              {channel}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {notification.recipients
                        .map((recipient) => recipient.email || recipient.phone || recipient.name)
                        .filter(Boolean)
                        .join(', ')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusColors[notification.status]}`}
                      >
                        {notification.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{notification.attempts}</td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(notification.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {isComposerOpen && (
        <SendTestDrawer
          isOpen={isComposerOpen}
          onClose={() => setComposerOpen(false)}
          onSubmit={createNotificationMutation.mutate}
          isSubmitting={createNotificationMutation.isLoading}
        />
      )}

      {isRouteDrawerOpen && (
        <RouteDrawer
          isOpen={isRouteDrawerOpen}
          onClose={() => {
            setRouteDrawerOpen(false);
            setSelectedRoute(null);
          }}
          onSubmit={(payload) =>
            upsertRouteMutation.mutate({
              eventKey: payload.eventKey,
              channels: payload.channels,
              filters: payload.filters,
              metadata: payload.metadata,
            })
          }
          isSubmitting={upsertRouteMutation.isLoading}
          routes={routesQuery.data ?? []}
          initialRoute={selectedRoute}
          onSelectRoute={(route) => setSelectedRoute(route)}
        />
      )}
    </div>
  );
}

interface SendTestDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => void;
  isSubmitting: boolean;
}

function SendTestDrawer({ isOpen, onClose, onSubmit, isSubmitting }: SendTestDrawerProps) {
  const [form, setForm] = useState<{
    eventKey: string;
    channels: NotificationChannel[];
    email: string;
    phone: string;
    payload: string;
    inboxOnly: boolean;
  }>({
    eventKey: '',
    channels: ['email'],
    email: '',
    phone: '',
    payload: '{ "message": "Hello from Genzi RMS" }',
    inboxOnly: false,
  });

  const toggleChannel = (channel: NotificationChannel) => {
    setForm((prev) => {
      if (prev.channels.includes(channel)) {
        return { ...prev, channels: prev.channels.filter((c) => c !== channel) };
      }
      return { ...prev, channels: [...prev.channels, channel] };
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.eventKey.trim()) {
      toast.error('Event key is required');
      return;
    }
    if (!form.inboxOnly && form.channels.length === 0) {
      toast.error('Select at least one channel');
      return;
    }
    const recipients = [];
    if (form.email) recipients.push({ email: form.email });
    if (form.phone) recipients.push({ phone: form.phone });
    if (recipients.length === 0 && !form.inboxOnly) {
      toast.error('Provide an email or phone recipient');
      return;
    }
    let parsedPayload: Record<string, unknown> = {};
    try {
      parsedPayload = JSON.parse(form.payload);
    } catch (error) {
      toast.error('Payload must be valid JSON');
      return;
    }
    onSubmit({
      eventKey: form.eventKey,
      channels: form.inboxOnly ? ['in_app'] : form.channels,
      recipients: form.inboxOnly ? [{ name: 'Inbox only' }] : recipients,
      payload: parsedPayload,
      inboxOnly: form.inboxOnly,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Send test notification
            </p>
            <h2 className="text-xl font-semibold text-gray-900">Manual composer</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-200 p-1 text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700">Event key</label>
            <input
              value={form.eventKey}
              onChange={(event) => setForm((prev) => ({ ...prev, eventKey: event.target.value }))}
              placeholder="inventory.str.approved"
              className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Channels</label>
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={form.inboxOnly}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      inboxOnly: event.target.checked,
                      channels: event.target.checked ? ['in_app'] : prev.channels,
                    }))
                  }
                />
                Inbox only
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {defaultChannels.map((channel) => {
                const Icon = channelIcons[channel];
                const active = form.channels.includes(channel);
                return (
                  <button
                    key={channel}
                    type="button"
                    disabled={form.inboxOnly && channel !== 'in_app'}
                    onClick={() => toggleChannel(channel)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
                      active
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600'
                    } ${form.inboxOnly && channel !== 'in_app' ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                    {channel}
                  </button>
                );
              })}
            </div>
          </div>

          {!form.inboxOnly && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Email recipient</label>
                <input
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="jane@example.com"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Phone recipient</label>
                <input
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="+1 555 123 4567"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Payload (JSON)</label>
            <textarea
              rows={5}
              value={form.payload}
              onChange={(event) => setForm((prev) => ({ ...prev, payload: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono"
            />
          </div>
        </div>

        <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

interface RouteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    eventKey: string;
    channels: NotificationRouteConfig['channels'];
    filters?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }) => void;
  isSubmitting: boolean;
  routes: NotificationRouteConfig[];
  initialRoute: NotificationRouteConfig | null;
  onSelectRoute: (route: NotificationRouteConfig) => void;
}

function RouteDrawer({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  routes,
  initialRoute,
  onSelectRoute,
}: RouteDrawerProps) {
  const [form, setForm] = useState<{
    eventKey: string;
    channels: NotificationRouteConfig['channels'];
    filters?: string;
    metadata?: string;
  }>({
    eventKey: initialRoute?.eventKey ?? '',
    channels:
      initialRoute?.channels ??
      defaultChannels.map((channel) => ({
        channel,
        enabled: channel === 'in_app',
      })),
    filters: initialRoute?.filters ? JSON.stringify(initialRoute.filters, null, 2) : '',
    metadata: initialRoute?.metadata ? JSON.stringify(initialRoute.metadata, null, 2) : '',
  });

  const applyRoute = (route: NotificationRouteConfig) => {
    onSelectRoute(route);
    setForm({
      eventKey: route.eventKey,
      channels: route.channels,
      filters: route.filters ? JSON.stringify(route.filters, null, 2) : '',
      metadata: route.metadata ? JSON.stringify(route.metadata, null, 2) : '',
    });
  };

  const toggleChannel = (channel: NotificationChannel) => {
    setForm((prev) => ({
      ...prev,
      channels: prev.channels.map((config) =>
        config.channel === channel ? { ...config, enabled: !config.enabled } : config
      ),
    }));
  };

  const updateQuietHours = (
    channel: NotificationChannel,
    field: 'start' | 'end',
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      channels: prev.channels.map((config) =>
        config.channel === channel
          ? {
              ...config,
              quietHours: {
                ...config.quietHours,
                [field]: value,
              },
            }
          : config
      ),
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.eventKey.trim()) {
      toast.error('Event key is required');
      return;
    }
    let parsedFilters: Record<string, unknown> | undefined;
    let parsedMetadata: Record<string, unknown> | undefined;
    if (form.filters) {
      try {
        parsedFilters = JSON.parse(form.filters);
      } catch {
        toast.error('Filters JSON is invalid');
        return;
      }
    }
    if (form.metadata) {
      try {
        parsedMetadata = JSON.parse(form.metadata);
      } catch {
        toast.error('Metadata JSON is invalid');
        return;
      }
    }
    onSubmit({
      eventKey: form.eventKey,
      channels: form.channels,
      filters: parsedFilters,
      metadata: parsedMetadata,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wide text-blue-600"
            >
              Routing configuration
            </p>
            <h2 className="text-xl font-semibold text-gray-900">Notification routes</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-200 p-1 text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700">Event key</label>
            <input
              value={form.eventKey}
              onChange={(event) => setForm((prev) => ({ ...prev, eventKey: event.target.value }))}
              placeholder="inventory.audit.variance"
              className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Channels</label>
            <div className="mt-3 grid grid-cols-1 gap-3">
              {form.channels.map((config) => {
                const Icon = channelIcons[config.channel];
                const active = config.enabled;
                return (
                  <div
                    key={config.channel}
                    className="rounded-2xl border border-gray-100 bg-gray-50 p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <Icon className="w-4 h-4" />
                        {config.channel}
                      </div>
                      <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => toggleChannel(config.channel)}
                        />
                        Enabled
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                      <div>
                        <p className="font-medium mb-1">Quiet hours start</p>
                        <input
                          type="time"
                          value={config.quietHours?.start ?? ''}
                          onChange={(event) =>
                            updateQuietHours(config.channel, 'start', event.target.value)
                          }
                          className="w-full rounded-lg border border-gray-200 px-2 py-1"
                        />
                      </div>
                      <div>
                        <p className="font-medium mb-1">Quiet hours end</p>
                        <input
                          type="time"
                          value={config.quietHours?.end ?? ''}
                          onChange={(event) =>
                            updateQuietHours(config.channel, 'end', event.target.value)
                          }
                          className="w-full rounded-lg border border-gray-200 px-2 py-1"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Fallback channels</p>
                      <div className="flex flex-wrap gap-2">
                        {defaultChannels
                          .filter((channel) => channel !== config.channel)
                          .map((channel) => {
                            const fallbackActive = config.fallback?.includes(channel);
                            return (
                              <button
                                key={`${config.channel}-${channel}`}
                                type="button"
                                onClick={() =>
                                  setForm((prev) => ({
                                    ...prev,
                                    channels: prev.channels.map((c) =>
                                      c.channel === config.channel
                                        ? {
                                            ...c,
                                            fallback: fallbackActive
                                              ? c.fallback?.filter((item) => item !== channel)
                                              : [...(c.fallback ?? []), channel],
                                          }
                                        : c
                                    ),
                                  }))
                                }
                                className={`rounded-full border px-3 py-0.5 text-xs ${
                                  fallbackActive
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 text-gray-600'
                                }`}
                              >
                                {channel}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Filters (JSON)</label>
            <textarea
              rows={3}
              value={form.filters}
              onChange={(event) => setForm((prev) => ({ ...prev, filters: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono"
              placeholder='e.g. { "priority": "high" }'
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Metadata (JSON)</label>
            <textarea
              rows={3}
              value={form.metadata}
              onChange={(event) => setForm((prev) => ({ ...prev, metadata: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono"
              placeholder='e.g. { "escalation": true }'
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Existing routes</p>
            <div className="flex flex-wrap gap-2">
              {routes.map((route) => (
                <button
                  key={route._id}
                  type="button"
                  onClick={() => applyRoute(route)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    form.eventKey === route.eventKey
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {route.eventKey}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings2 className="w-4 h-4" />}
            Save route
          </button>
        </div>
      </form>
    </div>
  );
}

