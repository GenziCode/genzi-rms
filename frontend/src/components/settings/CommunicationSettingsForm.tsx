import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Mail,
  MessageCircle,
  Save,
  ShieldCheck,
  RefreshCw,
  EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsService } from '@/services/settings.service';
import { notificationsService } from '@/services/notifications.service';
import type {
  CommunicationSettings,
  CommunicationTestResult,
} from '@/types/settings.types';

const COMMUNICATION_SETTINGS_QUERY_KEY = ['communication-settings'];

interface CommunicationFormState {
  emailNotifications: boolean;
  smsNotifications: boolean;
  emailConfig: {
    enabled: boolean;
    host: string;
    port: string;
    secure: boolean;
    user: string;
    fromEmail: string;
    replyTo: string;
    passwordInput: string;
    passwordSet: boolean;
    clearPassword: boolean;
    lastTestedAt?: string;
    lastTestResult?: CommunicationTestResult;
  };
  smsConfig: {
    enabled: boolean;
    provider: 'twilio';
    accountSid: string;
    fromNumber: string;
    authTokenInput: string;
    authTokenSet: boolean;
    clearAuthToken: boolean;
    lastTestedAt?: string;
    lastTestResult?: CommunicationTestResult;
  };
}

const initialFormState: CommunicationFormState = {
  emailNotifications: false,
  smsNotifications: false,
  emailConfig: {
    enabled: false,
    host: '',
    port: '587',
    secure: false,
    user: '',
    fromEmail: '',
    replyTo: '',
    passwordInput: '',
    passwordSet: false,
    clearPassword: false,
  },
  smsConfig: {
    enabled: false,
    provider: 'twilio',
    accountSid: '',
    fromNumber: '',
    authTokenInput: '',
    authTokenSet: false,
    clearAuthToken: false,
  },
};

const formatDateTime = (value?: string) => {
  if (!value) return 'Never';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

export default function CommunicationSettingsForm() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CommunicationFormState>(initialFormState);
  const [isDirty, setIsDirty] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testPhoneNumber, setTestPhoneNumber] = useState('');

  const {
    data,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: COMMUNICATION_SETTINGS_QUERY_KEY,
    queryFn: settingsService.getCommunicationSettings,
  });

  useEffect(() => {
    if (data) {
      setForm({
        emailNotifications: data.emailNotifications,
        smsNotifications: data.smsNotifications,
        emailConfig: {
          enabled: data.emailConfig.enabled,
          host: data.emailConfig.host || '',
          port: (data.emailConfig.port ?? 587).toString(),
          secure: data.emailConfig.secure,
          user: data.emailConfig.user || '',
          fromEmail: data.emailConfig.fromEmail || '',
          replyTo: data.emailConfig.replyTo || '',
          passwordInput: '',
          passwordSet: data.emailConfig.passwordSet,
          clearPassword: false,
          lastTestedAt: data.emailConfig.lastTestedAt,
          lastTestResult: data.emailConfig.lastTestResult,
        },
        smsConfig: {
          enabled: data.smsConfig.enabled,
          provider: data.smsConfig.provider,
          accountSid: data.smsConfig.accountSid || '',
          fromNumber: data.smsConfig.fromNumber || '',
          authTokenInput: '',
          authTokenSet: data.smsConfig.authTokenSet,
          clearAuthToken: false,
          lastTestedAt: data.smsConfig.lastTestedAt,
          lastTestResult: data.smsConfig.lastTestResult,
        },
      });
      setIsDirty(false);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: settingsService.updateCommunicationSettings,
    onSuccess: (updated) => {
      toast.success('Communication settings updated');
      queryClient.setQueryData<CommunicationSettings>(
        COMMUNICATION_SETTINGS_QUERY_KEY,
        updated
      );
      setForm((prev) => ({
        emailNotifications: updated.emailNotifications,
        smsNotifications: updated.smsNotifications,
        emailConfig: {
          ...prev.emailConfig,
          enabled: updated.emailConfig.enabled,
          host: updated.emailConfig.host || '',
          port: (updated.emailConfig.port ?? 587).toString(),
          secure: updated.emailConfig.secure,
          user: updated.emailConfig.user || '',
          fromEmail: updated.emailConfig.fromEmail || '',
          replyTo: updated.emailConfig.replyTo || '',
          passwordInput: '',
          passwordSet: updated.emailConfig.passwordSet,
          clearPassword: false,
          lastTestedAt: updated.emailConfig.lastTestedAt,
          lastTestResult: updated.emailConfig.lastTestResult,
        },
        smsConfig: {
          ...prev.smsConfig,
          enabled: updated.smsConfig.enabled,
          provider: updated.smsConfig.provider,
          accountSid: updated.smsConfig.accountSid || '',
          fromNumber: updated.smsConfig.fromNumber || '',
          authTokenInput: '',
          authTokenSet: updated.smsConfig.authTokenSet,
          clearAuthToken: false,
          lastTestedAt: updated.smsConfig.lastTestedAt,
          lastTestResult: updated.smsConfig.lastTestResult,
        },
      }));
      setIsDirty(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update communication settings');
    },
  });

  const handleSave = () => {
    const payload = {
      emailNotifications: form.emailNotifications,
      smsNotifications: form.smsNotifications,
      emailConfig: {
        enabled: form.emailConfig.enabled,
        host: form.emailConfig.host.trim() || undefined,
        port: form.emailConfig.port ? Number(form.emailConfig.port) : undefined,
        secure: form.emailConfig.secure,
        user: form.emailConfig.user.trim() || undefined,
        fromEmail: form.emailConfig.fromEmail.trim() || undefined,
        replyTo: form.emailConfig.replyTo.trim() || undefined,
        password: form.emailConfig.clearPassword
          ? null
          : form.emailConfig.passwordInput.trim().length > 0
            ? form.emailConfig.passwordInput
            : undefined,
      },
      smsConfig: {
        enabled: form.smsConfig.enabled,
        provider: form.smsConfig.provider,
        accountSid: form.smsConfig.accountSid.trim() || undefined,
        fromNumber: form.smsConfig.fromNumber.trim() || undefined,
        authToken: form.smsConfig.clearAuthToken
          ? null
          : form.smsConfig.authTokenInput.trim().length > 0
            ? form.smsConfig.authTokenInput
            : undefined,
      },
    };

    if (
      payload.emailConfig?.port !== undefined &&
      (Number.isNaN(payload.emailConfig.port) || payload.emailConfig.port! <= 0)
    ) {
      toast.error('SMTP port must be a positive number');
      return;
    }

    if (form.emailNotifications && payload.emailConfig?.enabled) {
      const missingEmailFields: string[] = [];
      if (!payload.emailConfig.host) missingEmailFields.push('host');
      if (!payload.emailConfig.user) missingEmailFields.push('username');
      const passwordProvided =
        payload.emailConfig.password !== undefined ||
        form.emailConfig.passwordSet;
      if (!passwordProvided) missingEmailFields.push('password');
      if (!payload.emailConfig.fromEmail) missingEmailFields.push('from email');

      if (missingEmailFields.length > 0) {
        toast.error(
          `SMTP configuration incomplete: ${missingEmailFields.join(', ')}`
        );
        return;
      }
    }

    if (form.smsNotifications && payload.smsConfig?.enabled) {
      const missingSmsFields: string[] = [];
      if (!payload.smsConfig.accountSid) missingSmsFields.push('account SID');
      const authProvided =
        payload.smsConfig.authToken !== undefined ||
        form.smsConfig.authTokenSet;
      if (!authProvided) missingSmsFields.push('auth token');
      if (!payload.smsConfig.fromNumber) missingSmsFields.push('from number');

      if (missingSmsFields.length > 0) {
        toast.error(
          `SMS configuration incomplete: ${missingSmsFields.join(', ')}`
        );
        return;
      }
    }

    updateMutation.mutate(payload);
  };

  const resetForm = () => {
    if (data) {
      setForm({
        emailNotifications: data.emailNotifications,
        smsNotifications: data.smsNotifications,
        emailConfig: {
          enabled: data.emailConfig.enabled,
          host: data.emailConfig.host || '',
          port: (data.emailConfig.port ?? 587).toString(),
          secure: data.emailConfig.secure,
          user: data.emailConfig.user || '',
          fromEmail: data.emailConfig.fromEmail || '',
          replyTo: data.emailConfig.replyTo || '',
          passwordInput: '',
          passwordSet: data.emailConfig.passwordSet,
          clearPassword: false,
          lastTestedAt: data.emailConfig.lastTestedAt,
          lastTestResult: data.emailConfig.lastTestResult,
        },
        smsConfig: {
          enabled: data.smsConfig.enabled,
          provider: data.smsConfig.provider,
          accountSid: data.smsConfig.accountSid || '',
          fromNumber: data.smsConfig.fromNumber || '',
          authTokenInput: '',
          authTokenSet: data.smsConfig.authTokenSet,
          clearAuthToken: false,
          lastTestedAt: data.smsConfig.lastTestedAt,
          lastTestResult: data.smsConfig.lastTestResult,
        },
      });
      setIsDirty(false);
    } else {
      setForm(initialFormState);
      setIsDirty(false);
    }
  };

  const handleTestEmail = async () => {
    const targetEmail = testEmailAddress.trim() || form.emailConfig.fromEmail.trim();
    if (!targetEmail) {
      toast.error('Enter a test email address first');
      return;
    }
    if (!isEmailChannelReady) {
      toast.error('SMTP configuration is incomplete. Update credentials before testing.');
      return;
    }
    try {
      const success = await notificationsService.testEmail(targetEmail);
      toast[success ? 'success' : 'error'](
        success ? 'Test email sent successfully' : 'Failed to send test email'
      );
      if (success) {
        queryClient.invalidateQueries({ queryKey: COMMUNICATION_SETTINGS_QUERY_KEY });
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to send test email');
    }
  };

  const handleTestSMS = async () => {
    const targetPhone = testPhoneNumber.trim() || form.smsConfig.fromNumber.trim();
    if (!targetPhone) {
      toast.error('Enter a test phone number first');
      return;
    }
    if (!isSmsChannelReady) {
      toast.error('SMS configuration is incomplete. Update credentials before testing.');
      return;
    }
    try {
      const success = await notificationsService.testSMS(targetPhone);
      toast[success ? 'success' : 'error'](
        success ? 'Test SMS sent successfully' : 'Failed to send test SMS'
      );
      if (success) {
        queryClient.invalidateQueries({ queryKey: COMMUNICATION_SETTINGS_QUERY_KEY });
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to send test SMS');
    }
  };

  const emailTestStatus = useMemo(() => {
    if (!form.emailConfig.lastTestResult) return 'Never tested';
    return `${form.emailConfig.lastTestResult === 'success' ? 'Success' : 'Failure'} · ${formatDateTime(form.emailConfig.lastTestedAt)}`;
  }, [form.emailConfig.lastTestResult, form.emailConfig.lastTestedAt]);

  const smsTestStatus = useMemo(() => {
    if (!form.smsConfig.lastTestResult) return 'Never tested';
    return `${form.smsConfig.lastTestResult === 'success' ? 'Success' : 'Failure'} · ${formatDateTime(form.smsConfig.lastTestedAt)}`;
  }, [form.smsConfig.lastTestResult, form.smsConfig.lastTestedAt]);

  const isEmailChannelReady = useMemo(() => {
    if (!form.emailNotifications || !form.emailConfig.enabled) return false;
    const hasPassword =
      form.emailConfig.passwordInput.trim().length > 0 || form.emailConfig.passwordSet;
    return (
      form.emailConfig.host.trim().length > 0 &&
      form.emailConfig.user.trim().length > 0 &&
      hasPassword &&
      form.emailConfig.fromEmail.trim().length > 0
    );
  }, [form.emailNotifications, form.emailConfig]);

  const isSmsChannelReady = useMemo(() => {
    if (!form.smsNotifications || !form.smsConfig.enabled) return false;
    const hasToken =
      form.smsConfig.authTokenInput.trim().length > 0 || form.smsConfig.authTokenSet;
    return (
      form.smsConfig.accountSid.trim().length > 0 &&
      hasToken &&
      form.smsConfig.fromNumber.trim().length > 0
    );
  }, [form.smsNotifications, form.smsConfig]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Communication Channels</h3>
          <p className="text-sm text-gray-600">
            Manage the SMTP and SMS credentials used for invoice delivery and notification
            workflows.
          </p>
        </div>
        {(isLoading || isFetching) && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
      </div>

      <div className="space-y-4">
        <label className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-900">Allow email notifications</p>
            <p className="text-xs text-gray-500">
              Toggle whether the system is permitted to send transactional emails.
            </p>
          </div>
          <input
            type="checkbox"
            className="h-5 w-5 text-blue-600"
            checked={form.emailNotifications}
            onChange={(event) => {
              setForm((prev) => ({ ...prev, emailNotifications: event.target.checked }));
              setIsDirty(true);
            }}
          />
        </label>

        <label className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-900">Allow SMS notifications</p>
            <p className="text-xs text-gray-500">
              Toggle whether the system is permitted to send SMS messages.
            </p>
          </div>
          <input
            type="checkbox"
            className="h-5 w-5 text-blue-600"
            checked={form.smsNotifications}
            onChange={(event) => {
              setForm((prev) => ({ ...prev, smsNotifications: event.target.checked }));
              setIsDirty(true);
            }}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Email configuration */}
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-gray-900">SMTP (Email)</h4>
                <p className="text-xs text-gray-500">Used for invoice delivery and email alerts.</p>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <span>Enabled</span>
              <input
                type="checkbox"
                className="h-5 w-5 text-blue-600"
                checked={form.emailConfig.enabled}
                onChange={(event) => {
                  setForm((prev) => ({
                    ...prev,
                    emailConfig: { ...prev.emailConfig, enabled: event.target.checked },
                  }));
                  setIsDirty(true);
                }}
                disabled={!form.emailNotifications}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">SMTP Host</label>
              <input
                type="text"
                value={form.emailConfig.host}
                onChange={(event) => {
                  setForm((prev) => ({
                    ...prev,
                    emailConfig: { ...prev.emailConfig, host: event.target.value },
                  }));
                  setIsDirty(true);
                }}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="smtp.your-provider.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Port</label>
                <input
                  type="number"
                  value={form.emailConfig.port}
                  onChange={(event) => {
                    setForm((prev) => ({
                      ...prev,
                      emailConfig: { ...prev.emailConfig, port: event.target.value },
                    }));
                    setIsDirty(true);
                  }}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="587"
                />
              </div>
              <label className="mt-6 flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={form.emailConfig.secure}
                  onChange={(event) => {
                    setForm((prev) => ({
                      ...prev,
                      emailConfig: { ...prev.emailConfig, secure: event.target.checked },
                    }));
                    setIsDirty(true);
                  }}
                  className="h-4 w-4 text-blue-600"
                />
                Use TLS (port 465)
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                value={form.emailConfig.user}
                onChange={(event) => {
                  setForm((prev) => ({
                    ...prev,
                    emailConfig: { ...prev.emailConfig, user: event.target.value },
                  }));
                  setIsDirty(true);
                }}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="SMTP username or API key"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Password / API Key</label>
              <input
                type="password"
                value={form.emailConfig.passwordInput}
                onChange={(event) => {
                  const value = event.target.value;
                  setForm((prev) => ({
                    ...prev,
                    emailConfig: {
                      ...prev.emailConfig,
                      passwordInput: value,
                      clearPassword: false,
                    },
                  }));
                  setIsDirty(true);
                }}
                placeholder={form.emailConfig.passwordSet ? '********' : 'Enter SMTP password'}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
              {form.emailConfig.passwordSet && (
                <button
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      emailConfig: {
                        ...prev.emailConfig,
                        passwordInput: '',
                        clearPassword: true,
                      },
                    }));
                    setIsDirty(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                >
                  <EyeOff className="h-3 w-3" />
                  Clear stored password
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">From Email</label>
                <input
                  type="email"
                  value={form.emailConfig.fromEmail}
                  onChange={(event) => {
                    setForm((prev) => ({
                      ...prev,
                      emailConfig: { ...prev.emailConfig, fromEmail: event.target.value },
                    }));
                    setIsDirty(true);
                  }}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="no-reply@yourdomain.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reply-To (optional)</label>
                <input
                  type="email"
                  value={form.emailConfig.replyTo}
                  onChange={(event) => {
                    setForm((prev) => ({
                      ...prev,
                      emailConfig: { ...prev.emailConfig, replyTo: event.target.value },
                    }));
                    setIsDirty(true);
                  }}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="support@yourdomain.com"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700 space-y-1">
            <p>
              Configure credentials from providers like SendGrid, Mailgun or Amazon SES. Leave blank
              to fall back to server-wide SMTP environment variables.
            </p>
            {form.emailNotifications && form.emailConfig.enabled && !isEmailChannelReady && (
              <p className="font-medium text-amber-600">
                Complete host, username, password, and from email before enabling SMTP deliveries.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Last status</p>
                <p className="text-xs text-gray-500">{emailTestStatus}</p>
              </div>
              <ShieldCheck className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <input
                type="email"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="Test email recipient"
                value={testEmailAddress}
                onChange={(event) => setTestEmailAddress(event.target.value)}
              />
              <button
                type="button"
                onClick={handleTestEmail}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-200 disabled:text-white/80"
                disabled={isLoading || isFetching || !isEmailChannelReady}
              >
                <RefreshCw className="h-4 w-4" />
                Test Email
              </button>
            </div>
          </div>
        </div>

        {/* SMS configuration */}
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-gray-900">SMS (Twilio)</h4>
                <p className="text-xs text-gray-500">Used for SMS invoice links and alerts.</p>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <span>Enabled</span>
              <input
                type="checkbox"
                className="h-5 w-5 text-emerald-600"
                checked={form.smsConfig.enabled}
                onChange={(event) => {
                  setForm((prev) => ({
                    ...prev,
                    smsConfig: { ...prev.smsConfig, enabled: event.target.checked },
                  }));
                  setIsDirty(true);
                }}
                disabled={!form.smsNotifications}
              />
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Account SID</label>
              <input
                type="text"
                value={form.smsConfig.accountSid}
                onChange={(event) => {
                  setForm((prev) => ({
                    ...prev,
                    smsConfig: { ...prev.smsConfig, accountSid: event.target.value },
                  }));
                  setIsDirty(true);
                }}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Auth Token</label>
              <input
                type="password"
                value={form.smsConfig.authTokenInput}
                onChange={(event) => {
                  const value = event.target.value;
                  setForm((prev) => ({
                    ...prev,
                    smsConfig: {
                      ...prev.smsConfig,
                      authTokenInput: value,
                      clearAuthToken: false,
                    },
                  }));
                  setIsDirty(true);
                }}
                placeholder={form.smsConfig.authTokenSet ? '********' : 'Enter Twilio auth token'}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              />
              {form.smsConfig.authTokenSet && (
                <button
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      smsConfig: {
                        ...prev.smsConfig,
                        authTokenInput: '',
                        clearAuthToken: true,
                      },
                    }));
                    setIsDirty(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                >
                  <EyeOff className="h-3 w-3" />
                  Clear stored token
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">From Number</label>
              <input
                type="tel"
                value={form.smsConfig.fromNumber}
                onChange={(event) => {
                  setForm((prev) => ({
                    ...prev,
                    smsConfig: { ...prev.smsConfig, fromNumber: event.target.value },
                  }));
                  setIsDirty(true);
                }}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                placeholder="+15551234567"
              />
            </div>
          </div>

          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-700 space-y-1">
            <p>
              Currently supports Twilio credentials. Leave blank to fall back to environment
              variables on the server.
            </p>
            {form.smsNotifications && form.smsConfig.enabled && !isSmsChannelReady && (
              <p className="font-medium text-amber-600">
                Provide account SID, auth token, and from number before enabling SMS deliveries.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Last status</p>
                <p className="text-xs text-gray-500">{smsTestStatus}</p>
              </div>
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <input
                type="tel"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                placeholder="Test phone number"
                value={testPhoneNumber}
                onChange={(event) => setTestPhoneNumber(event.target.value)}
              />
              <button
                type="button"
                onClick={handleTestSMS}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-200 disabled:text-white/80"
                disabled={isLoading || isFetching || !isSmsChannelReady}
              >
                <RefreshCw className="h-4 w-4" />
                Test SMS
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={resetForm}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
          disabled={updateMutation.isPending || !isDirty}
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={
            updateMutation.isPending ||
            !isDirty ||
            (form.emailNotifications && form.emailConfig.enabled && !isEmailChannelReady) ||
            (form.smsNotifications && form.smsConfig.enabled && !isSmsChannelReady)
          }
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </button>
      </div>
    </div>
  );
}


