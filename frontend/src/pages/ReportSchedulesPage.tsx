import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RefreshCw,
  Play,
  PauseCircle,
  PlayCircle,
  History,
  Mail,
  Send,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  reportSchedulesService,
  type ReportSchedule,
} from '@/services/reportSchedules.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReportExecutionHistoryModal } from '@/components/reports/ReportExecutionHistoryModal';

type StatusFilter = 'all' | 'active' | 'paused';

const channelIcons: Record<string, JSX.Element> = {
  email: <Mail className="h-4 w-4" />,
  inbox: <Send className="h-4 w-4" />,
  webhook: <Globe className="h-4 w-4" />,
};

export default function ReportSchedulesPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [historySchedule, setHistorySchedule] = useState<ReportSchedule | null>(null);

  const { data: schedules, isLoading, refetch } = useQuery({
    queryKey: ['report-schedules', statusFilter],
    queryFn: () =>
      reportSchedulesService.getAll({
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
      }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      reportSchedulesService.toggleStatus(id, isActive),
    onSuccess: (_, variables) => {
      toast.success(`Schedule ${variables.isActive ? 'activated' : 'paused'}`);
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
    },
    onError: () => toast.error('Failed to update schedule status'),
  });

  const runNowMutation = useMutation({
    mutationFn: (id: string) => reportSchedulesService.runNow(id),
    onSuccess: () => {
      toast.success('Schedule queued for execution');
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
    },
    onError: () => toast.error('Failed to trigger schedule'),
  });

  const filteredSchedules = useMemo(() => {
    if (!schedules) return [];
    return schedules.filter((schedule) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !schedule.name.toLowerCase().includes(term) &&
          !schedule.reportType.toLowerCase().includes(term)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [schedules, searchTerm]);

  const metrics = useMemo(() => {
    const total = schedules?.length ?? 0;
    const active = schedules?.filter((s) => s.isActive).length ?? 0;
    const paused = total - active;
    const nextRun = schedules
      ?.filter((s) => s.nextRun)
      .sort(
        (a, b) =>
          new Date(a.nextRun ?? Number.MAX_SAFE_INTEGER).getTime() -
          new Date(b.nextRun ?? Number.MAX_SAFE_INTEGER).getTime()
      )[0]?.nextRun;

    return { total, active, paused, nextRun };
  }, [schedules]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Reports Automation
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Schedule Center</h1>
          <p className="text-sm text-slate-500">
            Manage recurring report deliveries, pause schedules, or trigger ad-hoc runs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total schedules</CardDescription>
            <CardTitle className="text-3xl">{metrics.total}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">
            {metrics.active} active / {metrics.paused} paused
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Next run</CardDescription>
            <CardTitle className="text-xl">
              {metrics.nextRun
                ? new Date(metrics.nextRun).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })
                : 'No upcoming runs'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">
            Local timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Recent activity</CardDescription>
            <CardTitle className="text-3xl">
              {schedules?.filter((s) => s.stats?.lastStatus === 'success').length ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">
            Successful deliveries recorded in the latest sync.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Schedules</CardTitle>
              <CardDescription>
                Filter by status or search by name to locate a schedule quickly.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                placeholder="Search by report or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="sm:w-60"
              />
              <div className="flex rounded-lg border border-slate-200">
                {(['all', 'active', 'paused'] as StatusFilter[]).map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'ghost'}
                    size="sm"
                    className="capitalize"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="px-4 py-3">Schedule</th>
                <th className="px-4 py-3">Report</th>
                <th className="px-4 py-3">Cadence</th>
                <th className="px-4 py-3">Delivery</th>
                <th className="px-4 py-3">Next Run</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    Loading schedules…
                  </td>
                </tr>
              ) : filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    No schedules found for the selected filters.
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((schedule) => (
                  <tr
                    key={schedule._id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-900">{schedule.name}</p>
                      {schedule.description && (
                        <p className="text-xs text-slate-500">{schedule.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="outline" className="capitalize">
                        {schedule.reportType.replace(/-/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-xs capitalize text-slate-600">
                      {schedule.frequency} @ {schedule.runAt} ({schedule.timezone})
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600">
                      <div className="flex flex-wrap gap-2">
                        {schedule.delivery.channels.map((channel) => (
                          <span
                            key={`${schedule._id}-${channel}`}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-700"
                          >
                            {channelIcons[channel]}
                            {channel}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600">
                      {schedule.nextRun
                        ? new Date(schedule.nextRun).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <Badge
                        className={
                          schedule.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-600'
                        }
                      >
                        {schedule.isActive ? 'Active' : 'Paused'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2 text-slate-500">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            toggleMutation.mutate({
                              id: schedule._id,
                              isActive: !schedule.isActive,
                            })
                          }
                          disabled={toggleMutation.isPending}
                          title={schedule.isActive ? 'Pause schedule' : 'Resume schedule'}
                        >
                          {schedule.isActive ? (
                            <PauseCircle className="h-4 w-4" />
                          ) : (
                            <PlayCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => runNowMutation.mutate(schedule._id)}
                          disabled={runNowMutation.isPending}
                          title="Run now"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setHistorySchedule(schedule)}
                          title="View executions"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <ReportExecutionHistoryModal
        schedule={historySchedule}
        isOpen={Boolean(historySchedule)}
        onClose={() => setHistorySchedule(null)}
      />
    </div>
  );
}


