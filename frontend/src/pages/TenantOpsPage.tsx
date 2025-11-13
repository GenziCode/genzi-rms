import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Gauge,
  Users,
  Layers,
  HardDrive,
  RefreshCw,
  Settings,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { tenantService, type TenantUsageResponse } from '@/services/tenant.service';
import { useAuthStore } from '@/store/authStore';
import { OffCanvas } from '@/components/ui/OffCanvas';
import ProgressBar from '@/components/ui/ProgressBar';
import Toggle from '@/components/ui/Toggle';
import { formatCurrency } from '@/lib/utils';

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes)) return '0 B';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / k ** i;
  return `${value.toFixed(1)} ${sizes[i]}`;
};

const metrics = [
  {
    key: 'seats',
    title: 'Seats',
    icon: Users,
    color: 'bg-blue-100 text-blue-700',
  },
  {
    key: 'stores',
    title: 'Stores',
    icon: Building2,
    color: 'bg-purple-100 text-purple-700',
  },
  {
    key: 'products',
    title: 'Products',
    icon: Layers,
    color: 'bg-emerald-100 text-emerald-700',
  },
  {
    key: 'monthlyTransactions',
    title: 'Monthly Transactions',
    icon: Activity,
    color: 'bg-orange-100 text-orange-700',
  },
  {
    key: 'storage',
    title: 'Storage',
    icon: HardDrive,
    color: 'bg-rose-100 text-rose-700',
  },
 ] as const;

type MetricKey = keyof TenantUsageResponse['usage'];
type UsageMetricCard = {
  key: MetricKey;
  title: string;
  icon: typeof Users;
  color: string;
  percent: number;
  displayValue: string;
  subtitle?: string;
};

export default function TenantOpsPage() {
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((state) => state.tenantId ?? state.user?.tenantId ?? null);
  const { data, isLoading, isFetching } = useQuery({
    enabled: Boolean(tenantId),
    queryKey: ['tenant-usage', tenantId],
    queryFn: () => tenantService.getUsage(tenantId!),
    refetchInterval: 60_000,
  });

  const [isPlanDrawerOpen, setPlanDrawerOpen] = useState(false);
  const [limitsDraft, setLimitsDraft] = useState<Record<string, number>>({});
  const [planDraft, setPlanDraft] = useState<{ plan: string; billingCycle: string }>({
    plan: 'free',
    billingCycle: 'monthly',
  });
  const [featuresDraft, setFeaturesDraft] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isPlanDrawerOpen && data) {
      setPlanDraft({
        plan: data.tenant.plan,
        billingCycle: data.tenant.billingCycle,
      });
      setLimitsDraft({
        users: data.limits.users,
        stores: data.limits.stores,
        products: data.limits.products,
        monthlyTransactions: data.limits.monthlyTransactions,
        storageBytes: data.limits.storageBytes,
      });
      setFeaturesDraft({ ...data.tenant.features });
    }
  }, [isPlanDrawerOpen, data]);

  const updatePlanMutation = useMutation({
    mutationFn: (payload: Parameters<typeof tenantService.updatePlan>[1]) =>
      tenantService.updatePlan(tenantId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-usage', tenantId] });
      toast.success('Plan settings updated');
    },
    onError: () => {
      toast.error('Failed to update plan settings');
    },
  });

  const updateLimitsMutation = useMutation({
    mutationFn: (payload: Record<string, number>) =>
      tenantService.updateLimits(tenantId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-usage', tenantId] });
      toast.success('Limits updated');
    },
    onError: () => toast.error('Failed to update limits'),
  });

  const featureToggleMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: boolean }) =>
      tenantService.updatePlan(tenantId!, { features: { [key]: value } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-usage', tenantId] });
      toast.success('Feature toggled');
    },
    onError: () => toast.error('Failed to toggle feature'),
  });

  const handleSavePlan = async () => {
    if (!data || !tenantId) return;

    const planPayload: Record<string, any> = {};
    if (planDraft.plan !== data.tenant.plan) {
      planPayload.plan = planDraft.plan;
    }
    if (planDraft.billingCycle !== data.tenant.billingCycle) {
      planPayload.billingCycle = planDraft.billingCycle;
    }

    const featuresChanged =
      JSON.stringify(featuresDraft) !== JSON.stringify(data.tenant.features);
    if (featuresChanged) {
      planPayload.features = featuresDraft;
    }

    const limitsChanged =
      JSON.stringify(limitsDraft) !==
      JSON.stringify({
        users: data.limits.users,
        stores: data.limits.stores,
        products: data.limits.products,
        monthlyTransactions: data.limits.monthlyTransactions,
        storageBytes: data.limits.storageBytes,
      });

    try {
      if (Object.keys(planPayload).length > 0) {
        await updatePlanMutation.mutateAsync(planPayload);
      }
      if (limitsChanged) {
        await updateLimitsMutation.mutateAsync(limitsDraft);
      }
      if (Object.keys(planPayload).length === 0 && !limitsChanged) {
        toast('No changes detected', { icon: 'ℹ️' });
      }
      setPlanDrawerOpen(false);
    } catch (error) {
      // Errors handled in mutations
    }
  };

  const usageMetrics = useMemo<UsageMetricCard[]>(() => {
    if (!data) return [];

    return metrics.reduce<UsageMetricCard[]>((acc, metricDef) => {
      switch (metricDef.key) {
        case 'seats': {
          const value = data.usage.seats;
          acc.push({
            ...metricDef,
            percent: value.percent,
            displayValue: `${value.used} / ${value.limit}`,
            subtitle: `${value.byRole
              .map((role) => `${role.count} ${role.role}`)
              .join(', ')}`,
          });
          break;
        }
        case 'stores': {
          const value = data.usage.stores;
          acc.push({
            ...metricDef,
            percent: value.percent,
            displayValue: `${value.used} / ${value.limit}`,
            subtitle: `${value.active} active · ${value.inactive} inactive`,
          });
          break;
        }
        case 'products': {
          const value = data.usage.products;
          acc.push({
            ...metricDef,
            percent: value.percent,
            displayValue: `${value.used} / ${value.limit}`,
          });
          break;
        }
        case 'monthlyTransactions': {
          const value = data.usage.monthlyTransactions;
          acc.push({
            ...metricDef,
            percent: value.percent,
            displayValue: `${value.count} / ${value.limit}`,
            subtitle: `Volume ${formatCurrency(value.totalAmount)} • Tax ${formatCurrency(value.totalTax)}`,
          });
          break;
        }
        case 'storage': {
          const value = data.usage.storage;
          acc.push({
            ...metricDef,
            percent: value.percent,
            displayValue: `${formatBytes(value.usedBytes)} of ${formatBytes(value.limitBytes)}`,
            subtitle: undefined,
          });
          break;
        }
        default:
          break;
      }

      return acc;
    }, []);
  }, [data]);

  if (!tenantId) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-semibold text-gray-900">Tenant Operations</h1>
        <p className="mt-2 text-gray-600">
          Tenant context missing. Please sign in again to continue.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">
            Tenant Operations
          </p>
          <h1 className="text-3xl font-semibold text-gray-900 mt-1">
            Plan Usage & Controls
          </h1>
          {data && (
            <p className="text-sm text-gray-500 mt-2">
              Plan: <span className="font-medium text-gray-800">{data.tenant.plan}</span> • Billing cycle:{' '}
              <span className="font-medium text-gray-800">{data.tenant.billingCycle}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['tenant-usage', tenantId] })}
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            onClick={() => setPlanDrawerOpen(true)}
            disabled={!data}
          >
            <Settings className="w-4 h-4" />
            Manage Plan & Limits
          </button>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="h-32 rounded-lg bg-white shadow animate-pulse border border-gray-100"
            />
          ))}
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {usageMetrics.map((metric) => (
              <div key={metric.key} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      {metric.title}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">{metric.displayValue}</p>
                    {metric.subtitle && (
                      <p className="text-xs text-gray-500 mt-1 leading-snug">
                        {metric.subtitle}
                      </p>
                    )}
                  </div>
                  <div className={`p-3 rounded-full ${metric.color}`}>
                    <metric.icon className="w-5 h-5" />
                  </div>
                </div>
                <ProgressBar value={metric.percent} showLabel={false} />
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Gauge className="w-4 h-4" />
                  <span>{metric.percent}% of allocation</span>
                </div>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Feature Controls
                  </h2>
                  <p className="text-sm text-gray-500">
                    Enable or disable modules for this tenant
                  </p>
                </div>
                <ShieldCheck className="w-5 h-5 text-blue-500" />
              </div>

              <div className="space-y-4">
                {Object.entries(data.tenant.features).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                    <Toggle
                      checked={featuresDraft[key] ?? value}
                      onChange={(checked) => {
                        setFeaturesDraft((prev) => ({ ...prev, [key]: checked }));
                        featureToggleMutation.mutate({ key, value: checked });
                      }}
                      label={key.replace(/([A-Z])/g, ' $1').replace(/^\w/, (c) => c.toUpperCase())}
                      description={`Toggle access to the ${key} module for all users.`}
                      disabled={featureToggleMutation.isPending}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Sync Health Overview
                  </h2>
                  <p className="text-sm text-gray-500">
                    Track device connectivity and conflict status
                  </p>
                </div>
                <Activity className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-blue-50 py-3">
                  <p className="text-xs uppercase text-blue-500 font-medium">Devices</p>
                  <p className="text-2xl font-semibold text-blue-700">{data.sync.deviceCount}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 py-3">
                  <p className="text-xs uppercase text-emerald-500 font-medium">Online</p>
                  <p className="text-2xl font-semibold text-emerald-700">
                    {data.sync.online}
                  </p>
                  <p className="text-[11px] text-emerald-600">
                    {data.sync.online
                      ? `${Math.round((data.sync.online / Math.max(data.sync.deviceCount, 1)) * 100)}%`
                      : '0%'}
                  </p>
                </div>
                <div className="rounded-lg bg-amber-50 py-3">
                  <p className="text-xs uppercase text-amber-500 font-medium">Conflicts</p>
                  <p className="text-2xl font-semibold text-amber-700">
                    {data.sync.conflicts}
                  </p>
                </div>
              </div>
              <div className="border border-gray-100 rounded-lg divide-y">
                {data.sync.devices.slice(0, 4).map((device) => (
                  <div key={device.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {device.label ?? device.id}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Status:{' '}
                        <span className="font-medium capitalize">{device.status}</span> • Queue:{' '}
                        {device.queueSize ?? 0}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        device.status === 'online'
                          ? 'bg-emerald-100 text-emerald-700'
                          : device.status === 'degraded'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {device.status}
                    </span>
                  </div>
                ))}
                {data.sync.devices.length === 0 && (
                  <p className="text-sm text-gray-500 p-4">No devices have synced yet.</p>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Audit Trail Snapshot</h2>
                <p className="text-sm text-gray-500">
                  Critical plan changes are automatically logged with diff metadata.
                </p>
              </div>
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Use the Audit Logs section to drill down into plan updates, feature toggles, and
              limit adjustments. Each action is captured with before/after fields to support
              compliance reviews.
            </p>
          </section>
        </>
      )}

      <OffCanvas
        isOpen={isPlanDrawerOpen}
        onClose={() => setPlanDrawerOpen(false)}
        title="Manage Plan & Limits"
        footer={
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Changes are applied instantly and logged in the audit trail.
            </p>
            <div className="flex items-center gap-3">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                onClick={() => setPlanDrawerOpen(false)}
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                onClick={handleSavePlan}
                disabled={updatePlanMutation.isPending || updateLimitsMutation.isPending}
              >
                <Settings className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        }
      >
        {data ? (
          <div className="space-y-8">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Plan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Plan Tier
                  </span>
                  <select
                    value={planDraft.plan}
                    onChange={(e) => setPlanDraft((prev) => ({ ...prev, plan: e.target.value }))}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    {['free', 'basic', 'professional', 'enterprise'].map((plan) => (
                      <option key={plan} value={plan}>
                        {plan.charAt(0).toUpperCase() + plan.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Billing Cycle
                  </span>
                  <select
                    value={planDraft.billingCycle}
                    onChange={(e) =>
                      setPlanDraft((prev) => ({ ...prev, billingCycle: e.target.value }))
                    }
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Limits
              </h3>
              <div className="space-y-4">
                {[
                  { key: 'users', label: 'Seats / Users' },
                  { key: 'stores', label: 'Stores' },
                  { key: 'products', label: 'Products' },
                  { key: 'monthlyTransactions', label: 'Monthly Transactions' },
                  { key: 'storageBytes', label: 'Storage (Bytes)' },
                ].map((limit) => (
                  <label key={limit.key} className="flex flex-col gap-2">
                    <span className="flex items-center justify-between text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {limit.label}
                      <span className="text-gray-400">
                        Current: {data.limits[limit.key as keyof typeof data.limits]}
                      </span>
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={limitsDraft[limit.key] ?? data.limits[limit.key as keyof typeof data.limits]}
                      onChange={(e) =>
                        setLimitsDraft((prev) => ({
                          ...prev,
                          [limit.key]: Number(e.target.value),
                        }))
                      }
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Features
              </h3>
              <div className="space-y-3">
                {Object.entries(featuresDraft).map(([key, value]) => (
                  <Toggle
                    key={key}
                    checked={value}
                    onChange={(checked) =>
                      setFeaturesDraft((prev) => ({
                        ...prev,
                        [key]: checked,
                      }))
                    }
                    label={key.replace(/([A-Z])/g, ' $1').replace(/^\w/, (c) => c.toUpperCase())}
                    description="Include this module in the tenant’s subscription."
                  />
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-gray-500">Loading tenant data…</p>
          </div>
        )}
      </OffCanvas>
    </div>
  );
}


