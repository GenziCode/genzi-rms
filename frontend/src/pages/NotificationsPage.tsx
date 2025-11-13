import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Trash2, CheckCheck, Loader2, Megaphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationsService } from '@/services/notifications.service';
import type {
  Notification,
  NotificationType,
  NotificationPreferences,
} from '@/types/notification.types';
import BroadcastModal from '@/components/notifications/BroadcastModal';

const NOTIFICATIONS_QUERY_KEY = ['notifications'];
const NOTIFICATION_PREFERENCES_KEY = ['notification-preferences'];

const defaultPreferences: NotificationPreferences = {
  inApp: true,
  email: false,
  sms: false,
  push: false,
  types: {
    sale: true,
    payment: true,
    inventory: true,
    order: true,
    customer: true,
    alert: true,
    reminder: true,
  },
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<{
    type?: NotificationType;
    read?: boolean;
  }>({});
  const [preferencesForm, setPreferencesForm] = useState<NotificationPreferences>(defaultPreferences);
  const [isDirty, setIsDirty] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  const { data } = useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, filters],
    queryFn: () => notificationsService.getAll(filters),
  });

  const {
    data: preferencesData,
    isLoading: preferencesLoading,
    isFetching: preferencesFetching,
  } = useQuery({
    queryKey: NOTIFICATION_PREFERENCES_KEY,
    queryFn: notificationsService.getPreferences,
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  useEffect(() => {
    if (preferencesData) {
      setPreferencesForm({
        ...defaultPreferences,
        ...preferencesData,
        types: {
          ...defaultPreferences.types,
          ...preferencesData.types,
        },
      });
      setIsDirty(false);
    }
  }, [preferencesData]);

  const invalidateNotifications = () =>
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY, exact: false });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => {
      invalidateNotifications();
    },
    onError: () => {
      toast.error('Failed to mark notification as read');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      invalidateNotifications();
      toast.success('All notifications marked as read');
    },
    onError: () => {
      toast.error('Failed to mark notifications');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsService.delete(id),
    onSuccess: () => {
      invalidateNotifications();
      toast.success('Notification deleted');
    },
    onError: () => {
      toast.error('Failed to delete notification');
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (payload: NotificationPreferences) =>
      notificationsService.updatePreferences(payload),
    onSuccess: (updated) => {
      setPreferencesForm({
        ...defaultPreferences,
        ...updated,
        types: {
          ...defaultPreferences.types,
          ...updated.types,
        },
      });
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_PREFERENCES_KEY });
      toast.success('Notification preferences updated');
    },
    onError: () => {
      toast.error('Failed to update preferences');
    },
  });

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      sale: '💰',
      payment: '💳',
      inventory: '📦',
      order: '🛒',
      customer: '👤',
      alert: '⚠️',
      reminder: '🔔',
      system: 'ℹ️',
    };
    return icons[type] || '📌';
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  };

  const notificationItems = useMemo(
    () =>
      notifications.map((notification: Notification) => (
        <div
          key={notification._id ?? notification.id}
          className={`bg-white rounded-lg shadow p-4 hover:shadow-md transition ${
            !notification.read ? 'border-l-4 border-blue-600' : ''
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl flex-shrink-0">{getNotificationIcon(notification.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {formatTime(notification.createdAt)}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
              <div className="flex items-center gap-2">
                {!notification.read && (
                  <button
                    onClick={() => markAsReadMutation.mutate(notification._id)}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Mark as read
                  </button>
                )}
                <button
                  onClick={() => deleteMutation.mutate(notification._id)}
                  className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )),
    [notifications, markAsReadMutation, deleteMutation]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <CheckCheck className="w-5 h-5 mr-2" />
              {markAllAsReadMutation.isPending ? 'Marking…' : 'Mark All Read'}
            </button>
          )}
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Megaphone className="w-5 h-5 mr-2" />
            Send Broadcast
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Notification preferences</h2>
            <p className="text-sm text-gray-500">
              Control which alerts appear inside the app. Email, SMS, and push delivery are configured under{' '}
              <span className="font-medium text-gray-700">Settings → Communications</span>.
            </p>
          </div>
          {(preferencesLoading || preferencesFetching) && (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          )}
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Enable in-app notifications</p>
              <p className="text-xs text-gray-500">
                Disable to hide new notifications from the bell and notifications page.
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferencesForm.inApp}
              onChange={(e) => {
                setPreferencesForm((prev) => ({ ...prev, inApp: e.target.checked }));
                setIsDirty(true);
              }}
              className="w-5 h-5 text-blue-600"
            />
          </label>

          <label className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Enable push notifications</p>
              <p className="text-xs text-gray-500">
                Reserved for upcoming browser/mobile push support. Toggle off to opt out early.
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferencesForm.push}
              onChange={(e) => {
                setPreferencesForm((prev) => ({ ...prev, push: e.target.checked }));
                setIsDirty(true);
              }}
              className="w-5 h-5 text-purple-600"
            />
          </label>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(preferencesForm.types).map(([key, value]) => (
              <label
                key={key}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                  value ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
                } ${!preferencesForm.inApp ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <span className="text-sm font-medium text-gray-700 capitalize">{key}</span>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => {
                    setPreferencesForm((prev) => ({
                      ...prev,
                      types: {
                        ...prev.types,
                        [key]: e.target.checked,
                      },
                    }));
                    setIsDirty(true);
                  }}
                  className="w-4 h-4 text-blue-600"
                  disabled={!preferencesForm.inApp}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              if (preferencesData) {
                setPreferencesForm({
                  ...defaultPreferences,
                  ...preferencesData,
                  types: {
                    ...defaultPreferences.types,
                    ...preferencesData.types,
                  },
                });
              } else {
                setPreferencesForm(defaultPreferences);
              }
              setIsDirty(false);
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
            disabled={updatePreferencesMutation.isPending || !isDirty}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => updatePreferencesMutation.mutate(preferencesForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={updatePreferencesMutation.isPending || !isDirty}
          >
            {updatePreferencesMutation.isPending ? 'Saving…' : 'Save Preferences'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-2 gap-4">
          <select
            value={filters.type || ''}
            onChange={(e) =>
              setFilters({ ...filters, type: e.target.value ? (e.target.value as NotificationType) : undefined })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="sale">Sales</option>
            <option value="payment">Payments</option>
            <option value="inventory">Inventory</option>
            <option value="order">Orders</option>
            <option value="customer">Customers</option>
            <option value="alert">Alerts</option>
            <option value="reminder">Reminders</option>
          </select>
          <select
            value={filters.read === undefined ? '' : filters.read ? 'read' : 'unread'}
            onChange={(e) =>
              setFilters({
                ...filters,
                read: e.target.value === '' ? undefined : e.target.value === 'read',
              })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">You're all caught up!</p>
          </div>
        ) : (
          notificationItems
        )}
      </div>

      {showBroadcastModal && (
        <BroadcastModal
          onClose={() => setShowBroadcastModal(false)}
          onSuccess={() =>
            queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY, exact: false })
          }
        />
      )}
    </div>
  );
}
