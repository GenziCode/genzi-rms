import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Wifi,
  WifiOff,
  AlertTriangle,
  ServerCog,
  Loader2,
  RefreshCw,
  Radio,
  Cpu,
  MapPin,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { syncService } from '@/services/sync.service';
import { OffCanvas } from '@/components/ui/OffCanvas';
import Toggle from '@/components/ui/Toggle';
import ProgressBar from '@/components/ui/ProgressBar';

const queueCapacity = 50;

export default function SyncCenterPage() {
  const queryClient = useQueryClient();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [monitoring, setMonitoring] = useState<Record<string, boolean>>({});
  const [maintenance, setMaintenance] = useState<Record<string, boolean>>({});

  const devicesQuery = useQuery({
    queryKey: ['sync-devices'],
    queryFn: syncService.getDevices,
    refetchInterval: 30_000,
  });

  const deviceStatusQuery = useQuery({
    enabled: Boolean(selectedDeviceId),
    queryKey: ['sync-device-status', selectedDeviceId],
    queryFn: () => syncService.getDeviceStatus(selectedDeviceId!),
    refetchInterval: 10_000,
  });

  const summaryCards = useMemo(() => {
    if (!devicesQuery.data) return [];
    return [
      {
        title: 'Total Devices',
        value: devicesQuery.data.count,
        icon: Radio,
        color: 'bg-blue-50 text-blue-600',
      },
      {
        title: 'Online',
        value: devicesQuery.data.online,
        icon: Wifi,
        color: 'bg-emerald-50 text-emerald-600',
      },
      {
        title: 'Offline',
        value: devicesQuery.data.offline,
        icon: WifiOff,
        color: 'bg-rose-50 text-rose-600',
      },
      {
        title: 'Degraded',
        value: devicesQuery.data.degraded,
        icon: AlertTriangle,
        color: 'bg-amber-50 text-amber-600',
      },
    ];
  }, [devicesQuery.data]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['sync-devices'] });
    if (selectedDeviceId) {
      queryClient.invalidateQueries({ queryKey: ['sync-device-status', selectedDeviceId] });
    }
    toast.success('Sync telemetry refreshed');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">
            Offline Sync Center
          </p>
          <h1 className="text-3xl font-semibold text-gray-900 mt-1">
            Device Health & Queues
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Monitor device connectivity, queues, and conflicts in real time.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          onClick={handleRefresh}
          disabled={devicesQuery.isFetching}
        >
          <RefreshCw className={`w-4 h-4 ${devicesQuery.isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {devicesQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-24 rounded-xl border border-gray-100 bg-white shadow animate-pulse"
            />
          ))}
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {summaryCards.map((card) => (
              <div key={card.title} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {card.title}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                </div>
                <div className={`p-3 rounded-full ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
              </div>
            ))}
          </section>

          <section className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Device Inventory</h2>
                <p className="text-sm text-gray-500">
                  Click a device to view queue metrics, conflicts, and maintenance controls.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Device
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Last Sync
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Queue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Conflicts
                    </th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {devicesQuery.data?.devices.map((device) => (
                    <tr
                      key={device.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedDeviceId(device.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {device.label ?? device.id}
                        </div>
                        <div className="text-xs text-gray-500">{device.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full capitalize ${
                            device.status === 'online'
                              ? 'bg-emerald-100 text-emerald-700'
                              : device.status === 'degraded'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {device.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {device.lastSyncAt
                          ? formatDistanceToNow(new Date(device.lastSyncAt), { addSuffix: true })
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <ProgressBar
                            value={Math.min(
                              Math.round(((device.queueSize ?? 0) / queueCapacity) * 100),
                              100
                            )}
                            showLabel={false}
                            colorClassName="bg-blue-500"
                          />
                          <p className="text-xs text-gray-500">
                            {(device.queueSize ?? 0)} / {queueCapacity}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {device.conflicts ?? 0}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs text-blue-600 font-medium">View details</span>
                      </td>
                    </tr>
                  ))}
                  {devicesQuery.data?.devices.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-6 text-center text-sm text-gray-500">
                        No devices have been registered yet. Sync activity will appear here once
                        offline POS clients connect.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <OffCanvas
        isOpen={Boolean(selectedDeviceId)}
        onClose={() => setSelectedDeviceId(null)}
        title={deviceStatusQuery.data?.device?.label ?? selectedDeviceId ?? 'Device'}
      >
        {deviceStatusQuery.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : deviceStatusQuery.data?.device ? (
          <div className="space-y-6">
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-full p-3 ${
                    deviceStatusQuery.data.device.status === 'online'
                      ? 'bg-emerald-100 text-emerald-600'
                      : deviceStatusQuery.data.device.status === 'degraded'
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-rose-100 text-rose-600'
                  }`}
                >
                  <ServerCog className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Device ID</p>
                  <p className="text-base font-semibold text-gray-900">
                    {deviceStatusQuery.data.device.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Wifi className="w-4 h-4" />
                <span className="capitalize">{deviceStatusQuery.data.device.status}</span>
                <span className="text-gray-400">•</span>
                <span>
                  Last seen{' '}
                  {deviceStatusQuery.data.device.lastSeenAt
                    ? formatDistanceToNow(new Date(deviceStatusQuery.data.device.lastSeenAt), {
                        addSuffix: true,
                      })
                    : 'never'}
                </span>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Device Controls
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                  <Toggle
                    checked={monitoring[selectedDeviceId!] ?? true}
                    onChange={(checked) => {
                      setMonitoring((prev) => ({ ...prev, [selectedDeviceId!]: checked }));
                      toast.success(
                        `Monitoring ${checked ? 'enabled' : 'paused'} for ${deviceStatusQuery.data?.device?.label ?? selectedDeviceId
                        }`
                      );
                    }}
                    label="Real-time monitoring"
                    description="Pause monitoring if the device is intentionally offline (e.g., maintenance, relocation)."
                  />
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                  <Toggle
                    checked={maintenance[selectedDeviceId!] ?? false}
                    onChange={(checked) => {
                      setMaintenance((prev) => ({ ...prev, [selectedDeviceId!]: checked }));
                      toast.success(
                        `Maintenance mode ${checked ? 'enabled' : 'disabled'} for ${deviceStatusQuery.data?.device?.label ?? selectedDeviceId
                        }`
                      );
                    }}
                    label="Maintenance mode"
                    description="When enabled, sync pushes are deferred and queues are preserved until re-enabled."
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Queue Health
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-500" />
                    Pending queue
                  </p>
                  <ProgressBar
                    value={Math.min(
                      Math.round(
                        ((deviceStatusQuery.data.pendingSales ?? 0) / queueCapacity) * 100
                      ),
                      100
                    )}
                    showLabel={false}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {deviceStatusQuery.data.pendingSales} pending out of {queueCapacity} capacity
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Conflicts
                  </p>
                  <ProgressBar
                    value={Math.min(deviceStatusQuery.data.conflicts * 10, 100)}
                    showLabel={false}
                    colorClassName="bg-amber-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {deviceStatusQuery.data.conflicts} unresolved conflict(s)
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Metadata
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{deviceStatusQuery.data.device.location ?? 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-gray-400" />
                  <span>{deviceStatusQuery.data.device.platform ?? 'Unknown platform'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ServerCog className="w-4 h-4 text-gray-400" />
                  <span>{deviceStatusQuery.data.device.appVersion ?? 'No version reported'}</span>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No telemetry available for this device yet.</p>
        )}
      </OffCanvas>
    </div>
  );
}


