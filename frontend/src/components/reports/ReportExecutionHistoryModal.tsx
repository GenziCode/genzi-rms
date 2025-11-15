import { useQuery } from '@tanstack/react-query';
import { X, Clock, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import {
  reportSchedulesService,
  type ReportExecution,
  type ReportSchedule,
} from '@/services/reportSchedules.service';

interface ReportExecutionHistoryModalProps {
  schedule: ReportSchedule | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusStyles: Record<
  ReportExecution['status'],
  { label: string; className: string }
> = {
  pending: { label: 'Pending', className: 'text-slate-500' },
  running: { label: 'Running', className: 'text-blue-600' },
  success: { label: 'Success', className: 'text-green-600' },
  failed: { label: 'Failed', className: 'text-red-600' },
};

export function ReportExecutionHistoryModal({
  schedule,
  isOpen,
  onClose,
}: ReportExecutionHistoryModalProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['report-schedule-executions', schedule?._id],
    queryFn: () =>
      schedule ? reportSchedulesService.getExecutions(schedule._id) : [],
    enabled: isOpen && Boolean(schedule?._id),
  });

  if (!isOpen || !schedule) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Execution history
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              {schedule.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p>Loading executions…</p>
            </div>
          ) : !data || data.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-500">
              <Clock className="h-6 w-6" />
              <p>No executions recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((execution) => {
                const status = statusStyles[execution.status];
                return (
                  <div
                    key={execution._id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {new Date(
                            execution.startedAt
                          ).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            Duration:{' '}
                            {execution.durationMs
                              ? `${Math.round(execution.durationMs / 1000)}s`
                              : '—'}
                          </span>
                          <span>Format: {execution.format.toUpperCase()}</span>
                          {!!execution.recipients?.length && (
                            <span>
                              Recipients: {execution.recipients.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`text-sm font-semibold ${status.className}`}>
                        {execution.status === 'success' && (
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            {status.label}
                          </span>
                        )}
                        {execution.status === 'failed' && (
                          <span className="inline-flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" />
                            {status.label}
                          </span>
                        )}
                        {execution.status === 'pending' && status.label}
                        {execution.status === 'running' && status.label}
                      </div>
                    </div>
                    {execution.error && (
                      <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                        Error: {execution.error}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


