import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Filter,
  Globe,
  Loader2,
  Mail,
  Megaphone,
  MessageSquare,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { notificationsService } from '@/services/notifications.service';
import type {
  InboxNotification,
  NotificationChannel,
  NotificationPreferences,
} from '@/types/notification.types';
import BroadcastModal from '@/components/notifications/BroadcastModal';

const INBOX_QUERY_KEY = ['notification-inbox'];
const PREFERENCES_QUERY_KEY = ['notification-preferences'];

const channelMeta: Record<
  NotificationChannel,
  { label: string; description: string; icon: React.ComponentType<{ className?: string }> }
> = {
  in_app: {
    label: 'In-App',
    description: 'Shows up in the bell dropdown and inbox.',
    icon: BellRing,
  },
  email: {
    label: 'Email',
    description: 'Delivers via configured SMTP provider.',
    icon: Mail,
  },
  sms: {
    label: 'SMS',
    description: 'Sends text messages via Twilio gateway.',
    icon: MessageSquare,
  },
  webhook: {
    label: 'Webhook',
    description: 'Posts payloads to partner systems.',
    icon: Globe,
  },
};

const defaultPreferences: NotificationPreferences = {
  channels: {
    in_app: { enabled: true },
    email: { enabled: false },
    sms: { enabled: false },
    webhook: { enabled: false },
  },
};

const mergePreferences = (data?: NotificationPreferences): NotificationPreferences => ({
  channels: {
    in_app: {
      enabled: data?.channels?.in_app?.enabled ?? true,
      quietHours: data?.channels?.in_app?.quietHours,
    },
    email: {
      enabled: data?.channels?.email?.enabled ?? false,
      quietHours: data?.channels?.email?.quietHours,
    },
    sms: {
      enabled: data?.channels?.sms?.enabled ?? false,
      quietHours: data?.channels?.sms?.quietHours,
    },
    webhook: {
      enabled: data?.channels?.webhook?.enabled ?? false,
      quietHours: data?.channels?.webhook?.quietHours,
    },
  },
  metadata: data?.metadata,
});

const severityColors: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-rose-100 text-rose-700',
};

const channelBadgeColors: Record<NotificationChannel, string> = {
  in_app: 'bg-blue-50 text-blue-700',
  email: 'bg-amber-50 text-amber-700',
  sms: 'bg-emerald-50 text-emerald-700',
  webhook: 'bg-purple-50 text-purple-700',
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<{
    read: 'all' | 'read' | 'unread';
    channel: '' | NotificationChannel;
    search: string;
  }>({
    read: 'all',
    channel: '',
    search: '',
  });
  const [preferencesForm, setPreferencesForm] =
    useState<NotificationPreferences>(defaultPreferences);
  const [isDirty, setIsDirty] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  const inboxQuery = useQuery({
    queryKey: [...INBOX_QUERY_KEY, filters],
    queryFn: () =>
      notificationsService.listInbox({
        read: filters.read === 'all' ? undefined : filters.read === 'read',
        channel: filters.channel || undefined,
        search: filters.search.trim() || undefined,
        limit: 40,
      }),
  });

  const preferencesQuery = useQuery({
    queryKey: PREFERENCES_QUERY_KEY,
    queryFn: notificationsService.getPreferences,
  });

  useEffect(() => {
    if (preferencesQuery.data) {
      setPreferencesForm(mergePreferences(preferencesQuery.data));
      setIsDirty(false);
    }
  }, [preferencesQuery.data]);

  const invalidateInbox = () =>
    queryClient.invalidateQueries({ queryKey: INBOX_QUERY_KEY, exact: false });

  const markInboxMutation = useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) =>
      notificationsService.markInboxRead(id, read),
    onSuccess: () => invalidateInbox(),
    onError: () => toast.error('Unable to update notification'),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsService.markAllInboxRead(),
    onSuccess: (count) => {
      invalidateInbox();
      toast.success(`Marked ${count} notification${count === 1 ? '' : 's'} as read`);
    },
    onError: () => toast.error('Unable to mark notifications'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsService.deleteInboxItem(id),
    onSuccess: () => invalidateInbox(),
    onError: () => toast.error('Unable to remove notification'),
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (payload: NotificationPreferences) =>
      notificationsService.updatePreferences(payload),
    onSuccess: (updated) => {
      setPreferencesForm(mergePreferences(updated));
      setIsDirty(false);
      toast.success('Preferences saved');
      queryClient.invalidateQueries({ queryKey: PREFERENCES_QUERY_KEY });
    },
    onError: () => toast.error('Unable to save preferences'),
  });

  const notifications = useMemo(
    () => inboxQuery.data?.records ?? [],
    [inboxQuery.data]
  );
  const unreadCount = inboxQuery.data?.unreadCount ?? 0;

  const formatTime = (value: string) => {
    const now = new Date();
    const date = new Date(value);
    const diffMs = now.getTime() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleString();
  };

  const filteredNotifications = useMemo(() => {
    if (!filters.search.trim()) return notifications;
    const term = filters.search.toLowerCase();
    return notifications.filter(
      (notif) =>
        notif.title.toLowerCase().includes(term) ||
        notif.message.toLowerCase().includes(term) ||
        notif.eventKey.toLowerCase().includes(term)
    );
  }, [notifications, filters.search]);

  const renderNotification = (notification: InboxNotification) => {
    const Icon = channelMeta[notification.channels[0] ?? 'in_app']?.icon ?? Bell;
    return (
      <div
        key={notification._id}
        className={`rounded-2xl border p-5 shadow-sm transition hover:shadow ${
          notification.read ? 'bg-white border-gray-100' : 'border-blue-200 bg-blue-50/40'
        }`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ${
                  severityColors[notification.severity] ?? severityColors.info
                }`}
              >
                {notification.severity.toUpperCase()}
              </span>
              <span className="text-gray-400">•</span>
              <span>{notification.eventKey}</span>
              <span className="text-gray-400">•</span>
              <span>{formatTime(notification.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-2xl bg-blue-100 p-2 text-blue-600">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                <p className="text-sm text-gray-600">{notification.message}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {notification.channels.map((channel) => (
                <span
                  key={`${notification._id}-${channel}`}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${channelBadgeColors[channel]}`}
                >
                  {channelMeta[channel]?.label ?? channel}
                </span>
              ))}
              {notification.actionUrl && (
                <a
                  href={notification.actionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  View details →
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                markInboxMutation.mutate({ id: notification._id, read: !notification.read })
              }
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-blue-200 hover:text-blue-600"
              disabled={markInboxMutation.isPending}
            >
              <Check className="h-3.5 w-3.5" />
              {notification.read ? 'Mark unread' : 'Mark read'}
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate(notification._id)}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-rose-200 hover:text-rose-600"
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handlePreferenceToggle = (channel: NotificationChannel, enabled: boolean) => {
    setPreferencesForm((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: {
          ...prev.channels[channel],
          enabled,
        },
      },
    }));
    setIsDirty(true);
  };

  const handleQuietHoursChange = (
    channel: NotificationChannel,
    key: 'start' | 'end',
    value: string
  ) => {
    setPreferencesForm((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: {
          ...prev.channels[channel],
          quietHours: {
            ...prev.channels[channel]?.quietHours,
            [key]: value || undefined,
          },
        },
      },
    }));
    setIsDirty(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Inbox</p>
          <h1 className="text-3xl font-bold text-gray-900">Notification Inbox</h1>
          <p className="text-gray-600">
            {unreadCount > 0 ? `${unreadCount} unread messages` : 'You are all caught up ✨'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => inboxQuery.refetch()}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-blue-200 hover:text-blue-600"
          >
            {inboxQuery.isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <CheckCheck className="h-4 w-4" />
              {markAllMutation.isPending ? 'Marking…' : 'Mark all read'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowBroadcastModal(true)}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-indigo-200 hover:text-indigo-600"
          >
            <Megaphone className="h-4 w-4" />
            Send broadcast
          </button>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search title, message, or event key"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            <select
              value={filters.read}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, read: e.target.value as 'all' | 'read' | 'unread' }))
              }
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All statuses</option>
              <option value="unread">Unread only</option>
              <option value="read">Read only</option>
            </select>
            <select
              value={filters.channel}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  channel: e.target.value as '' | NotificationChannel,
                }))
              }
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All channels</option>
              {Object.keys(channelMeta).map((channel) => (
                <option key={channel} value={channel}>
                  {channelMeta[channel as NotificationChannel].label}
                </option>
              ))}
            </select>
          </div>

          {inboxQuery.isLoading ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-16 text-center text-gray-500">
              <Loader2 className="mx-auto mb-4 h-6 w-6 animate-spin text-blue-500" />
              Loading inbox…
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-16 text-center text-gray-500">
              <Bell className="mx-auto mb-4 h-10 w-10 text-gray-300" />
              No notifications match your filters.
            </div>
          ) : (
            <div className="space-y-3">{filteredNotifications.map(renderNotification)}</div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Preferences
                </p>
                <h2 className="text-lg font-semibold text-gray-900">
                  Channel opt-ins & quiet hours
                </h2>
                <p className="text-sm text-gray-500">
                  Changes apply instantly to both inbox and delivery channels.
                </p>
              </div>
              {preferencesQuery.isFetching && (
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              )}
            </div>
            <div className="space-y-4">
              {(Object.keys(channelMeta) as NotificationChannel[]).map((channel) => {
                const meta = channelMeta[channel];
                const preferences = preferencesForm.channels[channel];
                return (
                  <div
                    key={channel}
                    className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 shadow-inner"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{meta.label}</p>
                        <p className="text-xs text-gray-500">{meta.description}</p>
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                        <span>{preferences?.enabled ? 'Enabled' : 'Muted'}</span>
                        <input
                          type="checkbox"
                          checked={preferences?.enabled ?? false}
                          onChange={(e) => handlePreferenceToggle(channel, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </label>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <label className="text-xs font-medium text-gray-600">
                        Quiet hours start
                        <input
                          type="time"
                          value={preferences?.quietHours?.start ?? ''}
                          onChange={(e) => handleQuietHoursChange(channel, 'start', e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          disabled={!preferences?.enabled}
                        />
                      </label>
                      <label className="text-xs font-medium text-gray-600">
                        Quiet hours end
                        <input
                          type="time"
                          value={preferences?.quietHours?.end ?? ''}
                          onChange={(e) => handleQuietHoursChange(channel, 'end', e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          disabled={!preferences?.enabled}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (preferencesQuery.data) {
                    setPreferencesForm(mergePreferences(preferencesQuery.data));
                  } else {
                    setPreferencesForm(defaultPreferences);
                  }
                  setIsDirty(false);
                }}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
                disabled={!isDirty || updatePreferencesMutation.isPending}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => updatePreferencesMutation.mutate(preferencesForm)}
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                disabled={!isDirty || updatePreferencesMutation.isPending}
              >
                {updatePreferencesMutation.isPending ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 p-4 text-sm text-gray-600">
            <p className="font-semibold text-gray-900">Storage & limits</p>
            <p className="mt-1">
              We keep the most recent 200 inbox messages per user. Older entries auto-archive so the
              inbox stays fast. Download delivery logs from the admin Notification Center for full
              history.
            </p>
          </div>
        </div>
      </section>

      {showBroadcastModal && (
        <BroadcastModal
          onClose={() => setShowBroadcastModal(false)}
          onSuccess={() => {
            setShowBroadcastModal(false);
            toast.success('Broadcast queued');
            invalidateInbox();
          }}
        />
      )}
    </div>
  );
}

