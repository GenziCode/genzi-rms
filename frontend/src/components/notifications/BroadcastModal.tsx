import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  X,
  Megaphone,
  Send,
  Mail,
  MessageCircle,
  BellRing,
  LayoutList,
  Loader2,
  Link,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationsService } from '@/services/notifications.service';
import type { NotificationType } from '@/types/notification.types';

const channelOptions: Array<{
  id: 'in_app' | 'email' | 'sms' | 'push';
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}> = [
  {
    id: 'in_app',
    label: 'In-app',
    description: 'Appears in the notification center and bell icon.',
    icon: BellRing,
    accent: 'text-blue-600 bg-blue-100',
  },
  {
    id: 'email',
    label: 'Email',
    description: 'Sends via configured SMTP provider.',
    icon: Mail,
    accent: 'text-amber-600 bg-amber-100',
  },
  {
    id: 'sms',
    label: 'SMS',
    description: 'Sends via Twilio SMS number.',
    icon: MessageCircle,
    accent: 'text-emerald-600 bg-emerald-100',
  },
  {
    id: 'push',
    label: 'Push (beta)',
    description: 'Reserved for upcoming push channel support.',
    icon: LayoutList,
    accent: 'text-purple-600 bg-purple-100',
  },
];

const notificationTypes: Array<{ id: NotificationType; label: string }> = [
  { id: 'system', label: 'System' },
  { id: 'sale', label: 'Sales' },
  { id: 'payment', label: 'Payments' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'order', label: 'Orders' },
  { id: 'customer', label: 'Customers' },
  { id: 'alert', label: 'Alerts' },
  { id: 'reminder', label: 'Reminders' },
];

interface BroadcastModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function BroadcastModal({ onClose, onSuccess }: BroadcastModalProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [channels, setChannels] = useState<Array<'in_app' | 'email' | 'sms' | 'push'>>([
    'in_app',
  ]);
  const [type, setType] = useState<NotificationType>('system');
  const [actionUrl, setActionUrl] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      notificationsService.broadcast({
        title,
        message,
        type,
        channels,
        actionUrl: actionUrl.trim() ? actionUrl.trim() : undefined,
      }),
    onSuccess: (result) => {
      toast.success(
        `Broadcast queued: ${result.queued} message(s) for ${result.targetCount} recipients`
      );
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to send broadcast');
    },
  });

  const isValid = useMemo(() => {
    return (
      title.trim().length > 0 &&
      message.trim().length > 0 &&
      channels.length > 0 &&
      !mutation.isPending
    );
  }, [title, message, channels.length, mutation.isPending]);

  const toggleChannel = (channel: 'in_app' | 'email' | 'sms' | 'push') => {
    setChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((item) => item !== channel)
        : [...prev, channel]
    );
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Send Broadcast</h2>
              <p className="text-sm text-gray-500">
                Send an announcement to all active users. Channels respect each user’s
                preferences and tenant communication settings.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 px-6 py-6 md:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Scheduled maintenance tonight at 10PM"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Message</label>
              <textarea
                rows={6}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="Include key details your users need to know..."
              />
              <p className="mt-1 text-xs text-gray-400">{message.length} characters</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Link className="h-4 w-4 text-gray-500" />
                Action URL (optional)
              </label>
              <input
                type="url"
                value={actionUrl}
                onChange={(event) => setActionUrl(event.target.value)}
                placeholder="https://status.yourdomain.com"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-5 rounded-xl border border-gray-200 bg-gray-50 p-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Notification Type</h3>
              <p className="text-xs text-gray-500">
                Helps recipients categorize the message and applies preference filters.
              </p>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as NotificationType)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                {notificationTypes.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Channels</h3>
              <p className="text-xs text-gray-500">
                Channels automatically skip recipients who opted out or lack configuration.
              </p>
              <div className="space-y-2">
                {channelOptions.map((option) => {
                  const Icon = option.icon;
                  const disabled = false;
                  const selected = channels.includes(option.id);
                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 transition ${
                        selected
                          ? 'border-blue-200 bg-white shadow-sm'
                          : 'border-gray-200 bg-white'
                      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 text-blue-600"
                        checked={selected}
                        disabled={disabled}
                        onChange={() => toggleChannel(option.id)}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${option.accent}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <p className="text-sm font-medium text-gray-900">{option.label}</p>
                        </div>
                        <p className="pl-8 text-xs text-gray-500">{option.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            disabled={mutation.isPending}
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!isValid}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send Broadcast
          </button>
        </div>
      </div>
    </div>
  );
}


