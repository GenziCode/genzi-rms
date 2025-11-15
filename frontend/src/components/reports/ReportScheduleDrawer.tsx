import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Mail,
  Globe,
  Copy,
  Send,
  X,
  Loader2,
  CheckCircle2,
  PauseCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { reportTemplatesService } from '@/services/reportTemplates.service';
import {
  reportSchedulesService,
  type ReportSchedule,
  type CreateReportScheduleRequest,
} from '@/services/reportSchedules.service';

interface ReportScheduleDrawerProps {
  reportType: string;
  isOpen: boolean;
  onClose: () => void;
}

const channelOptions = [
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'inbox', label: 'In-app inbox', icon: Send },
  { id: 'webhook', label: 'Webhook', icon: Globe },
] as const;

const frequencyOptions: Array<{
  id: CreateReportScheduleRequest['frequency'];
  label: string;
  description: string;
}> = [
  { id: 'daily', label: 'Daily', description: 'Run every day at chosen time' },
  {
    id: 'weekly',
    label: 'Weekly',
    description: 'Run once per week on selected days',
  },
  {
    id: 'monthly',
    label: 'Monthly',
    description: 'Run on a specific day each month',
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Use custom cron-like cadence',
  },
];

const defaultPayload: CreateReportScheduleRequest = {
  name: '',
  description: '',
  reportType: '',
  format: 'pdf',
  frequency: 'weekly',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  runAt: '09:00',
  daysOfWeek: ['monday'],
  startDate: new Date().toISOString().split('T')[0],
  delivery: {
    channels: ['email'],
    recipients: [],
  },
  isActive: true,
};

export function ReportScheduleDrawer({
  reportType,
  isOpen,
  onClose,
}: ReportScheduleDrawerProps) {
  const queryClient = useQueryClient();
  const [payload, setPayload] = useState<CreateReportScheduleRequest>({
    ...defaultPayload,
    reportType,
    name: `${reportType.replace(/-/g, ' ')} schedule`,
  });

  const [recipientInput, setRecipientInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPayload((prev) => ({
        ...defaultPayload,
        ...prev,
        reportType,
        name: `${reportType.replace(/-/g, ' ')} schedule`,
      }));
    }
  }, [isOpen, reportType]);

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['report-templates', 'schedule-select'],
    queryFn: () => reportTemplatesService.getAll({ isActive: true }),
  });

  const { data: schedules } = useQuery({
    queryKey: ['report-schedules', reportType],
    queryFn: () => reportSchedulesService.getAll({ reportType }),
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateReportScheduleRequest) =>
      reportSchedulesService.create(data),
    onSuccess: () => {
      toast.success('Schedule created');
      queryClient.invalidateQueries({ queryKey: ['report-schedules', reportType] });
      onClose();
    },
    onError: (error: unknown) => {
      const message =
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'error' in error.response.data
          ? (error.response.data.error as { message?: string }).message
          : 'Failed to create schedule';
      toast.error(message);
    },
  });

  const handleChannelToggle = (channel: (typeof channelOptions)[number]['id']) => {
    setPayload((prev) => {
      const exists = prev.delivery.channels.includes(channel);
      return {
        ...prev,
        delivery: {
          ...prev.delivery,
          channels: exists
            ? prev.delivery.channels.filter((ch) => ch !== channel)
            : [...prev.delivery.channels, channel],
        },
      };
    });
  };

  const handleAddRecipient = () => {
    if (!recipientInput.trim()) return;
    setPayload((prev) => ({
      ...prev,
      delivery: {
        ...prev.delivery,
        recipients: Array.from(new Set([...(prev.delivery.recipients || []), recipientInput.trim()])),
      },
    }));
    setRecipientInput('');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!payload.name.trim()) {
      toast.error('Schedule name is required');
      return;
    }
    if (!payload.templateId && templates?.length) {
      toast.error('Please pick a template for this report');
      return;
    }
    if (
      payload.delivery.channels.includes('email') &&
      !(payload.delivery.recipients && payload.delivery.recipients.length)
    ) {
      toast.error('Please add at least one email recipient');
      return;
    }
    createMutation.mutate(payload);
  };

  const activeTemplates = useMemo(
    () =>
      templates?.filter(
        (template) =>
          template.isActive &&
          (template.module === reportType.split('-')[0] || template.category === 'custom')
      ) || [],
    [templates, reportType]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-xl bg-white shadow-2xl h-full overflow-y-auto">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Report scheduling</p>
              <h2 className="text-2xl font-semibold text-slate-900 capitalize">
                {reportType.replace(/-/g, ' ')}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <section className="space-y-3">
              <div>
                <label className="font-medium text-sm text-slate-700">Schedule name</label>
                <input
                  value={payload.name}
                  onChange={(e) => setPayload({ ...payload, name: e.target.value })}
                  className="w-full mt-1.5 rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. Monday 9AM sales summary"
                />
              </div>
              <div>
                <label className="font-medium text-sm text-slate-700">Template</label>
                <select
                  value={payload.templateId || ''}
                  onChange={(e) =>
                    setPayload({
                      ...payload,
                      templateId: e.target.value || undefined,
                    })
                  }
                  className="w-full mt-1.5 rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select template</option>
                  {templatesLoading && <option>Loading...</option>}
                  {activeTemplates.map((template) => (
                    <option key={template._id} value={template._id}>
                      {template.name} (v{template.version})
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section className="space-y-4">
              <p className="text-sm font-medium text-slate-700">Delivery cadence</p>
              <div className="grid grid-cols-2 gap-3">
                {frequencyOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPayload({ ...payload, frequency: option.id })}
                    className={`rounded-2xl border p-4 text-left transition ${
                      payload.frequency === option.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-semibold text-slate-900">{option.label}</p>
                    <p className="text-sm text-slate-500 mt-1">{option.description}</p>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="text-sm font-medium text-slate-700 flex flex-col gap-1.5">
                  <span>Time (24h)</span>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="time"
                      value={payload.runAt}
                      onChange={(e) => setPayload({ ...payload, runAt: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </label>
                <label className="text-sm font-medium text-slate-700 flex flex-col gap-1.5">
                  <span>Timezone</span>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={payload.timezone}
                      onChange={(e) => setPayload({ ...payload, timezone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. Asia/Karachi"
                    />
                  </div>
                </label>
              </div>

              {payload.frequency === 'weekly' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Days of week</p>
                  <div className="flex flex-wrap gap-2">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(
                      (day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() =>
                            setPayload((prev) => ({
                              ...prev,
                              daysOfWeek: prev.daysOfWeek?.includes(day)
                                ? prev.daysOfWeek.filter((d) => d !== day)
                                : [...(prev.daysOfWeek || []), day],
                            }))
                          }
                          className={`px-3 py-1.5 rounded-full border text-sm capitalize ${
                            payload.daysOfWeek?.includes(day)
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {payload.frequency === 'monthly' && (
                <label className="text-sm font-medium text-slate-700 flex flex-col gap-1.5">
                  <span>Day of month</span>
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={payload.dayOfMonth || 1}
                    onChange={(e) =>
                      setPayload({ ...payload, dayOfMonth: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </label>
              )}
            </section>

            <section className="space-y-4">
              <p className="text-sm font-medium text-slate-700">Delivery channels</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {channelOptions.map((channel) => {
                  const Icon = channel.icon;
                  const isActive = payload.delivery.channels.includes(channel.id);
                  return (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => handleChannelToggle(channel.id)}
                      className={`rounded-xl border p-3 flex items-center gap-3 text-left transition ${
                        isActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className="font-medium text-slate-900">{channel.label}</span>
                    </button>
                  );
                })}
              </div>

              {payload.delivery.channels.includes('email') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Recipients</label>
                  <div className="flex gap-2">
                    <input
                      value={recipientInput}
                      onChange={(e) => setRecipientInput(e.target.value)}
                      placeholder="name@company.com"
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddRecipient}
                      className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50"
                    >
                      Add
                    </button>
                  </div>
                  {!!payload.delivery.recipients?.length && (
                    <div className="flex flex-wrap gap-2">
                      {payload.delivery.recipients?.map((recipient) => (
                        <span
                          key={recipient}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm"
                        >
                          {recipient}
                          <button
                            type="button"
                            className="text-slate-500 hover:text-slate-900"
                            onClick={() =>
                              setPayload((prev) => ({
                                ...prev,
                                delivery: {
                                  ...prev.delivery,
                                  recipients:
                                    prev.delivery.recipients?.filter((r) => r !== recipient) || [],
                                },
                              }))
                            }
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {payload.delivery.channels.includes('webhook') && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Webhook URL</label>
                  <input
                    value={payload.delivery.webhookUrl || ''}
                    onChange={(e) =>
                      setPayload({
                        ...payload,
                        delivery: { ...payload.delivery, webhookUrl: e.target.value },
                      })
                    }
                    className="w-full mt-1.5 rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/report-webhook"
                  />
                </div>
              )}
            </section>

            <section className="space-y-3">
              <p className="text-sm font-medium text-slate-700">Existing schedules</p>
              {!schedules?.length ? (
                <p className="text-sm text-slate-500">
                  No schedules configured for this report yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {schedules.map((schedule: ReportSchedule) => (
                    <div
                      key={schedule._id}
                      className="rounded-lg border border-slate-200 p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{schedule.name}</p>
                      <p className="text-xs text-slate-500">
                        Next run:{' '}
                        {schedule.nextRun
                          ? new Date(schedule.nextRun).toLocaleString()
                          : 'Pending'}
                      </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          schedule.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {schedule.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </>
                        ) : (
                          <>
                            <PauseCircle className="w-3 h-3" /> Paused
                          </>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-slate-500">
                Report will be generated via{' '}
                <strong className="text-slate-900 uppercase">{payload.format}</strong> format
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Copy className="w-3 h-3" />
                {payload.delivery.channels.join(', ')}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
                disabled={createMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-70"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Save schedule
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}


