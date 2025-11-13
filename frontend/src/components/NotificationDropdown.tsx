import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Trash2, CheckCheck, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationsService } from '@/services/notifications.service';
import type { Notification } from '@/types/notification.types';
import toast from 'react-hot-toast';

const NOTIFICATIONS_QUERY_KEY = ['notifications'];

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, { limit: 10 }],
    queryFn: () => notificationsService.getAll({ limit: 10 }),
    refetchInterval: isOpen ? 15000 : 30000,
    refetchOnWindowFocus: isOpen,
  });

  const notifications = useMemo(() => data?.notifications ?? [], [data]);
  const unreadCount = data?.unreadCount ?? 0;

  const invalidateNotifications = () =>
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY, exact: false });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => {
      invalidateNotifications();
    },
    onError: () => {
      toast.error('Failed to update notification');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: (count) => {
      invalidateNotifications();
      toast.success(`Marked ${count} notification${count === 1 ? '' : 's'} as read`);
    },
    onError: () => {
      toast.error('Failed to mark notifications as read');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsService.delete(id),
    onSuccess: () => {
      invalidateNotifications();
    },
    onError: () => {
      toast.error('Failed to delete notification');
    },
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      refetch().catch(() => {
        /* handled by isError */
      });
    }
  }, [isOpen, refetch]);

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

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="p-8 flex flex-col items-center justify-center text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mb-2" />
          Loading notifications...
        </div>
      );
    }

    if (isError) {
      const message = (error as any)?.response?.data?.message || 'Failed to load notifications';
      return (
        <div className="p-6 text-center text-sm text-red-600">
          {message}
        </div>
      );
    }

    if (notifications.length === 0) {
      return (
        <div className="p-8 text-center">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No notifications</p>
        </div>
      );
    }

    return notifications.map((notification: Notification) => (
      <div
        key={notification._id ?? notification.id}
        className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition ${
          !notification.read ? 'bg-blue-50' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl flex-shrink-0">{getNotificationIcon(notification.type)}</div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
            <p className="text-xs text-gray-400 mt-1">{formatTime(notification.createdAt)}</p>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {!notification.read && (
              <button
                onClick={() => markAsReadMutation.mutate(notification._id)}
                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                title="Mark as read"
                aria-label="Mark notification as read"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => deleteMutation.mutate(notification._id)}
              className="p-1 text-red-600 hover:bg-red-100 rounded"
              title="Delete notification"
              aria-label="Delete notification"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50"
              >
                <CheckCheck className="w-4 h-4" />
                {markAllAsReadMutation.isPending ? 'Marking…' : 'Mark all read'}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">{renderContent()}</div>

          <div className="px-4 py-3 bg-gray-50 text-center border-t">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

