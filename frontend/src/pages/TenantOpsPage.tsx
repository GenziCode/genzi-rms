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
  Calendar,
  Clock,
  AlertTriangle,
  Zap,
  Database,
  Globe,
  Bell,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  XCircle,
  Info,
  ChevronRight,
  Sparkles,
  Timer,
  Lock,
  Unlock,
  Copy,
  ExternalLink,
  Code,
} from 'lucide-react';
import { toast } from 'sonner';
import { tenantService, type TenantUsageResponse } from '@/services/tenant.service';
import { useAuthStore } from '@/store/authStore';
import { OffCanvas } from '@/components/ui/OffCanvas';
import ProgressBar from '@/components/ui/ProgressBar';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import Tooltip from '@/components/ui/Tooltip';
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

interface PlanDraft {
  plan: string;
  billingCycle: 'monthly' | 'yearly';
  status: string;
  trialStartDate?: string;
  trialEndDate?: string;
  planStartDate?: string;
  planEndDate?: string;
  gracePeriodDays?: number;
  autoRenew?: boolean;
}

interface LimitsDraft {
  users: number;
  stores: number;
  products: number;
  monthlyTransactions: number;
  storageBytes: number;
  apiRequestsPerMinute?: number;
  apiRequestsPerDay?: number;
  webhookRequestsPerDay?: number;
  maxConcurrentConnections?: number;
}

interface UsageAlertsDraft {
  enabled: boolean;
  thresholds: {
    users?: number;
    stores?: number;
    products?: number;
    monthlyTransactions?: number;
    storageBytes?: number;
  };
  emailNotifications?: boolean;
  webhookUrl?: string;
}

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
  const [activeTab, setActiveTab] = useState<'plan' | 'limits' | 'features' | 'alerts' | 'api' | 'advanced'>('plan');
  const [limitsDraft, setLimitsDraft] = useState<LimitsDraft>({
    users: 0,
    stores: 0,
    products: 0,
    monthlyTransactions: 0,
    storageBytes: 0,
    apiRequestsPerMinute: 60,
    apiRequestsPerDay: 10000,
    webhookRequestsPerDay: 1000,
    maxConcurrentConnections: 10,
  });
  const [storageGB, setStorageGB] = useState<number>(0);

  // Conversion constants
  const BYTES_PER_GB = 1073741824; // 1 GB = 1,073,741,824 bytes

  // Convert bytes to GB
  const bytesToGB = (bytes: number): number => {
    return bytes / BYTES_PER_GB;
  };

  // Convert GB to bytes
  const gbToBytes = (gb: number): number => {
    return Math.round(gb * BYTES_PER_GB);
  };
  const [planDraft, setPlanDraft] = useState<PlanDraft>({
    plan: 'free',
    billingCycle: 'monthly',
    status: 'active',
    autoRenew: true,
    gracePeriodDays: 7,
  });
  const [featuresDraft, setFeaturesDraft] = useState<Record<string, boolean>>({});
  const [usageAlertsDraft, setUsageAlertsDraft] = useState<UsageAlertsDraft>({
    enabled: false,
    thresholds: {},
    emailNotifications: true,
  });

  useEffect(() => {
    if (isPlanDrawerOpen && data) {
      setPlanDraft({
        plan: data.tenant.plan,
        billingCycle: data.tenant.billingCycle as 'monthly' | 'yearly',
        status: data.tenant.status,
        autoRenew: true,
        gracePeriodDays: 7,
      });
      setLimitsDraft({
        users: data.limits.users,
        stores: data.limits.stores,
        products: data.limits.products,
        monthlyTransactions: data.limits.monthlyTransactions,
        storageBytes: data.limits.storageBytes,
        apiRequestsPerMinute: 60,
        apiRequestsPerDay: 10000,
        webhookRequestsPerDay: 1000,
        maxConcurrentConnections: 10,
      });
      setStorageGB(bytesToGB(data.limits.storageBytes));
      setFeaturesDraft({ ...data.tenant.features });
    }
  }, [isPlanDrawerOpen, data]);

  const updatePlanMutation = useMutation({
    mutationFn: (payload: Parameters<typeof tenantService.updatePlan>[1]) =>
      tenantService.updatePlan(tenantId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-usage', tenantId] });
      toast.success('Plan settings updated', {
        description: 'Your plan settings have been updated successfully.',
      });
    },
    onError: () => {
      toast.error('Failed to update plan settings', {
        description: 'Please try again or contact support.',
      });
    },
  });

  const updateLimitsMutation = useMutation({
    mutationFn: (payload: Record<string, number>) =>
      tenantService.updateLimits(tenantId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-usage', tenantId] });
      toast.success('Limits updated', {
        description: 'Resource limits have been updated successfully.',
      });
    },
    onError: () =>
      toast.error('Failed to update limits', {
        description: 'Please try again or contact support.',
      }),
  });

  const featureToggleMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: boolean }) =>
      tenantService.updatePlan(tenantId!, { features: { [key]: value } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-usage', tenantId] });
      toast.success('Feature toggled', {
        description: `Feature has been ${value ? 'enabled' : 'disabled'}.`,
      });
    },
    onError: () =>
      toast.error('Failed to toggle feature', {
        description: 'Please try again or contact support.',
      }),
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
    if (planDraft.status !== data.tenant.status) {
      planPayload.status = planDraft.status;
    }
    if (planDraft.trialStartDate) {
      planPayload.trialStartDate = planDraft.trialStartDate;
    }
    if (planDraft.trialEndDate) {
      planPayload.trialEndDate = planDraft.trialEndDate;
    }
    if (planDraft.planStartDate) {
      planPayload.planStartDate = planDraft.planStartDate;
    }
    if (planDraft.planEndDate) {
      planPayload.planEndDate = planDraft.planEndDate;
    }
    if (planDraft.gracePeriodDays !== undefined) {
      planPayload.gracePeriodDays = planDraft.gracePeriodDays;
    }
    if (planDraft.autoRenew !== undefined) {
      planPayload.autoRenew = planDraft.autoRenew;
    }

    const featuresChanged =
      JSON.stringify(featuresDraft) !== JSON.stringify(data.tenant.features);
    if (featuresChanged) {
      planPayload.features = featuresDraft;
    }

    const limitsChanged =
      JSON.stringify({
        users: limitsDraft.users,
        stores: limitsDraft.stores,
        products: limitsDraft.products,
        monthlyTransactions: limitsDraft.monthlyTransactions,
        storageBytes: limitsDraft.storageBytes,
      }) !==
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
        await updateLimitsMutation.mutateAsync({
          users: limitsDraft.users,
          stores: limitsDraft.stores,
          products: limitsDraft.products,
          monthlyTransactions: limitsDraft.monthlyTransactions,
          storageBytes: limitsDraft.storageBytes,
        });
      }
      if (Object.keys(planPayload).length === 0 && !limitsChanged) {
        toast.info('No changes detected', {
          description: 'Make changes to save.',
        });
      } else {
        setPlanDrawerOpen(false);
      }
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
      <div className="p-4 md:p-6 bg-white rounded-lg shadow">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Tenant Operations</h1>
        <p className="mt-2 text-sm md:text-base text-gray-600">
          Tenant context missing. Please sign in again to continue.
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'plan' as const, label: 'Plan & Billing', icon: CreditCard },
    { id: 'limits' as const, label: 'Resource Limits', icon: Database },
    { id: 'features' as const, label: 'Features', icon: Sparkles },
    { id: 'alerts' as const, label: 'Usage Alerts', icon: Bell },
    { id: 'api' as const, label: 'API Endpoints', icon: Globe },
    { id: 'advanced' as const, label: 'Advanced', icon: Settings },
  ];

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs md:text-sm text-gray-500 font-medium tracking-wide uppercase">
            Tenant Operations
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mt-1">
            Plan Usage & Controls
          </h1>
          {data && (
            <p className="text-xs md:text-sm text-gray-500 mt-2">
              Plan: <span className="font-medium text-gray-800">{data.tenant.plan}</span> • Billing cycle:{' '}
              <span className="font-medium text-gray-800">{data.tenant.billingCycle}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 md:px-4 py-2 text-xs md:text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['tenant-usage', tenantId] })}
            disabled={isFetching}
          >
            {isFetching ? (
              <Spinner size="sm" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            onClick={() => setPlanDrawerOpen(true)}
            disabled={!data}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Manage Plan & Limits</span>
            <span className="sm:hidden">Manage</span>
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
              <div key={metric.key} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5 flex flex-col gap-3 md:gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      {metric.title}
                    </p>
                    <p className="text-xl md:text-2xl font-semibold text-gray-900">{metric.displayValue}</p>
                    {metric.subtitle && (
                      <p className="text-xs text-gray-500 mt-1 leading-snug">
                        {metric.subtitle}
                      </p>
                    )}
                  </div>
                  <div className={`p-2 md:p-3 rounded-full ${metric.color}`}>
                    <metric.icon className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                </div>
                <ProgressBar value={metric.percent} showLabel={false} />
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Gauge className="w-3 h-3 md:w-4 md:h-4" />
                  <span>{metric.percent}% of allocation</span>
                </div>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base md:text-lg font-semibold text-gray-900">
                    Feature Controls
                  </h2>
                  <p className="text-xs md:text-sm text-gray-500">
                    Enable or disable modules for this tenant
                  </p>
                </div>
                <ShieldCheck className="w-5 h-5 text-blue-500" />
              </div>

              <div className="space-y-3 md:space-y-4">
                {Object.entries(data.tenant.features).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 border border-gray-100 rounded-lg p-3 md:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-900 cursor-pointer">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^\w/, (c) => c.toUpperCase())}
                        </label>
                        <p className="text-xs text-gray-600 mt-1">
                          Toggle access to the {key} module for all users.
                        </p>
                      </div>
                      <Switch
                        checked={featuresDraft[key] ?? value}
                        onCheckedChange={(checked) => {
                          setFeaturesDraft((prev) => ({ ...prev, [key]: checked }));
                          featureToggleMutation.mutate({ key, value: checked });
                        }}
                        disabled={featureToggleMutation.isPending}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base md:text-lg font-semibold text-gray-900">
                    Sync Health Overview
                  </h2>
                  <p className="text-xs md:text-sm text-gray-500">
                    Track device connectivity and conflict status
                  </p>
                </div>
                <Activity className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="grid grid-cols-3 gap-2 md:gap-3 text-center">
                <div className="rounded-lg bg-blue-50 py-2 md:py-3">
                  <p className="text-xs uppercase text-blue-500 font-medium">Devices</p>
                  <p className="text-xl md:text-2xl font-semibold text-blue-700">{data.sync.deviceCount}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 py-2 md:py-3">
                  <p className="text-xs uppercase text-emerald-500 font-medium">Online</p>
                  <p className="text-xl md:text-2xl font-semibold text-emerald-700">
                    {data.sync.online}
                  </p>
                  <p className="text-[11px] text-emerald-600">
                    {data.sync.online
                      ? `${Math.round((data.sync.online / Math.max(data.sync.deviceCount, 1)) * 100)}%`
                      : '0%'}
                  </p>
                </div>
                <div className="rounded-lg bg-amber-50 py-2 md:py-3">
                  <p className="text-xs uppercase text-amber-500 font-medium">Conflicts</p>
                  <p className="text-xl md:text-2xl font-semibold text-amber-700">
                    {data.sync.conflicts}
                  </p>
                </div>
              </div>
              <div className="border border-gray-100 rounded-lg divide-y">
                {data.sync.devices.slice(0, 4).map((device) => (
                  <div key={device.id} className="p-3 md:p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {device.label ?? device.id}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Status:{' '}
                        <span className="font-medium capitalize">{device.status}</span> • Queue:{' '}
                        {device.queueSize ?? 0}
                      </p>
                    </div>
                    <span
                      className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${
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

          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-6 space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base md:text-lg font-semibold text-gray-900">Audit Trail Snapshot</h2>
                <p className="text-xs md:text-sm text-gray-500">
                  Critical plan changes are automatically logged with diff metadata.
                </p>
              </div>
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
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
        position="right"
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Manage Plan & Limits</h2>
              <p className="text-xs text-gray-500 mt-0.5">Configure tenant subscription and resources</p>
            </div>
          </div>
        }
        size="xl"
        footer={
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <span>Changes are applied instantly and logged in the audit trail.</span>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => setPlanDrawerOpen(false)}
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
                onClick={handleSavePlan}
                disabled={updatePlanMutation.isPending || updateLimitsMutation.isPending}
              >
                {updatePlanMutation.isPending || updateLimitsMutation.isPending ? (
                  <>
                    <Spinner size="sm" className="text-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        }
      >
        {data ? (
          <div className="space-y-6 md:space-y-8">
            {/* Tabs */}
            <div className="border-b border-gray-200 -mx-4 md:-mx-6 px-4 md:px-6">
              <div className="flex overflow-x-auto scrollbar-hide -mb-px">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap
                        transition-all duration-200
                        ${activeTab === tab.id
                          ? 'border-blue-600 text-blue-600 bg-white'
                          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Plan & Billing Tab */}
            {activeTab === 'plan' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-blue-900 mb-1">Plan & Billing Configuration</h3>
                      <p className="text-xs text-blue-700">
                        Manage subscription plan, billing cycle, trial periods, and renewal settings.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-xs font-medium text-gray-700">
                        Plan Tier <span className="text-red-500">*</span>
                      </label>
                      <Tooltip text="Select the subscription plan tier. Higher tiers include more features and resources.">
                        <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                      </Tooltip>
                    </div>
                    <select
                      value={planDraft.plan}
                      onChange={(e) => setPlanDraft((prev) => ({ ...prev, plan: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                    >
                      {['free', 'basic', 'professional', 'enterprise'].map((plan) => (
                        <option key={plan} value={plan}>
                          {plan.charAt(0).toUpperCase() + plan.slice(1)}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Choose the subscription plan tier for this tenant.</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-xs font-medium text-gray-700">
                        Billing Cycle <span className="text-red-500">*</span>
                      </label>
                      <Tooltip text="Monthly billing charges every month. Yearly billing offers discounts and charges annually.">
                        <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                      </Tooltip>
                    </div>
                    <select
                      value={planDraft.billingCycle}
                      onChange={(e) =>
                        setPlanDraft((prev) => ({ ...prev, billingCycle: e.target.value as 'monthly' | 'yearly' }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Select how often the tenant will be billed.</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-xs font-medium text-gray-700">
                        Subscription Status
                      </label>
                      <Tooltip text="Current status of the subscription. Active = fully operational, Trial = trial period, Suspended = temporarily disabled, Cancelled = subscription ended, Past Due = payment overdue.">
                        <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                      </Tooltip>
                    </div>
                    <select
                      value={planDraft.status}
                      onChange={(e) => setPlanDraft((prev) => ({ ...prev, status: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                    >
                      <option value="active">Active</option>
                      <option value="trial">Trial</option>
                      <option value="suspended">Suspended</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="past_due">Past Due</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Current operational status of the tenant account.</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-xs font-medium text-gray-700">
                        Auto Renewal
                      </label>
                      <Tooltip text="When enabled, subscription automatically renews at the end of billing period. When disabled, manual renewal is required.">
                        <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                      </Tooltip>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Switch
                        checked={planDraft.autoRenew ?? true}
                        onCheckedChange={(checked) => setPlanDraft((prev) => ({ ...prev, autoRenew: checked }))}
                      />
                      <span className="text-xs text-gray-600">
                        {planDraft.autoRenew ? 'Automatically renew subscription' : 'Manual renewal required'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Control automatic subscription renewal.</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-xs font-medium text-gray-700">
                        Trial Start Date
                      </label>
                      <Tooltip text="Date and time when the trial period begins. Leave empty if not using trial period.">
                        <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                      </Tooltip>
                    </div>
                    <input
                      type="datetime-local"
                      value={planDraft.trialStartDate || ''}
                      onChange={(e) => setPlanDraft((prev) => ({ ...prev, trialStartDate: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">When the trial period started (if applicable).</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-xs font-medium text-gray-700">
                        Trial End Date
                      </label>
                      <Tooltip text="Date and time when the trial period expires. After this date, subscription becomes active or requires payment.">
                        <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                      </Tooltip>
                    </div>
                    <input
                      type="datetime-local"
                      value={planDraft.trialEndDate || ''}
                      onChange={(e) => setPlanDraft((prev) => ({ ...prev, trialEndDate: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">When the trial period ends (if applicable).</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-xs font-medium text-gray-700">
                        Plan Start Date
                      </label>
                      <Tooltip text="Date and time when the current subscription plan became active.">
                        <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                      </Tooltip>
                    </div>
                    <input
                      type="datetime-local"
                      value={planDraft.planStartDate || ''}
                      onChange={(e) => setPlanDraft((prev) => ({ ...prev, planStartDate: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">When the current plan period started.</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-xs font-medium text-gray-700">
                        Plan End Date
                      </label>
                      <Tooltip text="Date and time when the current subscription plan expires. Used for billing cycle calculations.">
                        <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                      </Tooltip>
                    </div>
                    <input
                      type="datetime-local"
                      value={planDraft.planEndDate || ''}
                      onChange={(e) => setPlanDraft((prev) => ({ ...prev, planEndDate: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">When the current plan period ends.</p>
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-xs font-medium text-gray-700">
                        Grace Period (Days)
                      </label>
                      <Tooltip text="Number of days after plan expiration before the account is automatically suspended. During grace period, tenant can still access the system but should renew.">
                        <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                      </Tooltip>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={planDraft.gracePeriodDays || 7}
                      onChange={(e) => setPlanDraft((prev) => ({ ...prev, gracePeriodDays: parseInt(e.target.value) || 0 }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      placeholder="7"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Number of days after expiration before suspending the account. Recommended: 7 days.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Resource Limits Tab */}
            {activeTab === 'limits' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Database className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-purple-900 mb-1">Resource Limits</h3>
                      <p className="text-xs text-purple-700">
                        Configure resource limits for users, stores, products, transactions, and storage.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { 
                      key: 'users', 
                      label: 'Seats / Users', 
                      icon: Users, 
                      description: 'Maximum number of user accounts',
                      tooltip: 'Total number of user accounts that can be created. Each user can have different roles and permissions.',
                      hint: 'Set to 0 for unlimited users'
                    },
                    { 
                      key: 'stores', 
                      label: 'Stores', 
                      icon: Building2, 
                      description: 'Maximum number of store locations',
                      tooltip: 'Total number of physical or virtual store locations the tenant can manage. Each store can have its own inventory and settings.',
                      hint: 'Each store can have separate inventory and settings'
                    },
                    { 
                      key: 'products', 
                      label: 'Products', 
                      icon: Layers, 
                      description: 'Maximum number of products in catalog',
                      tooltip: 'Total number of products that can be added to the product catalog. Includes active, inactive, and archived products.',
                      hint: 'Includes all product variants and SKUs'
                    },
                    { 
                      key: 'monthlyTransactions', 
                      label: 'Monthly Transactions', 
                      icon: Activity, 
                      description: 'Maximum transactions per billing period',
                      tooltip: 'Maximum number of transactions (sales, purchases, adjustments) allowed per calendar month. Resets at the start of each month.',
                      hint: 'Resets monthly at the start of billing cycle'
                    },
                    { 
                      key: 'storageBytes', 
                      label: 'Storage', 
                      icon: HardDrive, 
                      description: 'Maximum storage capacity',
                      tooltip: 'Total storage capacity for files, images, documents, and other media. Includes product images, documents, and backups.',
                      hint: '1 GB = 1,073,741,824 bytes'
                    },
                  ].map((limit) => {
                    const Icon = limit.icon;
                    const currentValue = data.limits[limit.key as keyof typeof data.limits];
                    
                    // Special handling for storage
                    if (limit.key === 'storageBytes') {
                      return (
                        <div key={limit.key} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg bg-white border border-gray-200`}>
                              <Icon className="w-4 h-4 text-gray-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <label className="text-sm font-medium text-gray-900">
                                    Storage Capacity
                                  </label>
                                  <Tooltip text={limit.tooltip}>
                                    <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                                  </Tooltip>
                                </div>
                                <span className="text-xs text-gray-500">
                                  Current: {formatBytes(currentValue)} ({bytesToGB(currentValue).toFixed(2)} GB)
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mb-1">{limit.description}</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Storage (GB)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    value={storageGB === 0 ? '0' : storageGB || ''}
                                    onChange={(e) => {
                                      const gbValue = parseFloat(e.target.value) || 0;
                                      setStorageGB(gbValue);
                                      setLimitsDraft((prev) => ({
                                        ...prev,
                                        storageBytes: gbToBytes(gbValue),
                                      }));
                                    }}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                                    placeholder="0.00"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">Enter value in GB (e.g., 0.01, 1.5, 100)</p>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Storage (Bytes)
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={limitsDraft.storageBytes ?? currentValue}
                                    onChange={(e) => {
                                      const bytesValue = Number(e.target.value) || 0;
                                      setLimitsDraft((prev) => ({
                                        ...prev,
                                        storageBytes: bytesValue,
                                      }));
                                      setStorageGB(bytesToGB(bytesValue));
                                    }}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                                    placeholder="0"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">1 GB = {BYTES_PER_GB.toLocaleString()} bytes</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={limit.key} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg bg-white border border-gray-200`}>
                            <Icon className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-900">
                                  {limit.label}
                                </label>
                                <Tooltip text={limit.tooltip} position="top">
                                  <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                                </Tooltip>
                              </div>
                              <span className="text-xs text-gray-500">
                                Current: {currentValue.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mb-1">{limit.description}</p>
                            {limit.hint && (
                              <p className="text-xs text-gray-500 mb-3 italic">{limit.hint}</p>
                            )}
                            <input
                              type="number"
                              min={0}
                              value={limitsDraft[limit.key as keyof LimitsDraft] ?? currentValue}
                              onChange={(e) =>
                                setLimitsDraft((prev) => ({
                                  ...prev,
                                  [limit.key]: Number(e.target.value),
                                }))
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* API & Rate Limiting */}
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      API & Rate Limiting
                    </h4>
                    <Tooltip text="Configure API rate limits to prevent abuse and ensure fair usage across all tenants. Limits are enforced per tenant.">
                      <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                    </Tooltip>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-xs font-medium text-gray-700">
                          API Requests per Minute
                        </label>
                        <Tooltip text="Maximum number of API requests allowed per minute. Exceeding this limit will result in 429 Too Many Requests error.">
                          <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                        </Tooltip>
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={limitsDraft.apiRequestsPerMinute || 60}
                        onChange={(e) =>
                          setLimitsDraft((prev) => ({
                            ...prev,
                            apiRequestsPerMinute: Number(e.target.value),
                          }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                      <p className="text-xs text-gray-500 mt-1">Recommended: 60 requests/minute for standard usage</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-xs font-medium text-gray-700">
                          API Requests per Day
                        </label>
                        <Tooltip text="Daily limit for total API requests. Resets at midnight UTC. Helps prevent abuse and manage server load.">
                          <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                        </Tooltip>
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={limitsDraft.apiRequestsPerDay || 10000}
                        onChange={(e) =>
                          setLimitsDraft((prev) => ({
                            ...prev,
                            apiRequestsPerDay: Number(e.target.value),
                          }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                      <p className="text-xs text-gray-500 mt-1">Daily quota resets at midnight UTC</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-xs font-medium text-gray-700">
                          Webhook Requests per Day
                        </label>
                        <Tooltip text="Maximum number of webhook deliveries allowed per day. Webhooks are used for real-time event notifications.">
                          <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                        </Tooltip>
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={limitsDraft.webhookRequestsPerDay || 1000}
                        onChange={(e) =>
                          setLimitsDraft((prev) => ({
                            ...prev,
                            webhookRequestsPerDay: Number(e.target.value),
                          }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                      <p className="text-xs text-gray-500 mt-1">Includes all webhook event types</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-xs font-medium text-gray-700">
                          Max Concurrent Connections
                        </label>
                        <Tooltip text="Maximum number of simultaneous API connections allowed. Prevents resource exhaustion from too many concurrent requests.">
                          <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                        </Tooltip>
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={limitsDraft.maxConcurrentConnections || 10}
                        onChange={(e) =>
                          setLimitsDraft((prev) => ({
                            ...prev,
                            maxConcurrentConnections: Number(e.target.value),
                          }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                      <p className="text-xs text-gray-500 mt-1">Simultaneous API connections limit</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Features Tab */}
            {activeTab === 'features' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-emerald-900 mb-1">Feature Management</h3>
                      <p className="text-xs text-emerald-700">
                        Enable or disable features and modules for this tenant. Changes take effect immediately.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      key: 'multiStore',
                      label: 'Multi-Store Management',
                      description: 'Manage multiple store locations, inter-store transfers, and store-wise reporting',
                      icon: Building2,
                      category: 'Core',
                    },
                    {
                      key: 'restaurant',
                      label: 'Restaurant Operations',
                      description: 'Table management, kitchen order tickets (KOT), waiter assignment, and order tracking',
                      icon: Layers,
                      category: 'Operations',
                    },
                    {
                      key: 'inventory',
                      label: 'Inventory Management',
                      description: 'Stock tracking, adjustments, transfers, batch/lot tracking, and low stock alerts',
                      icon: Database,
                      category: 'Core',
                    },
                    {
                      key: 'loyalty',
                      label: 'Loyalty Program',
                      description: 'Customer loyalty points, rewards, membership tiers, and promotional campaigns',
                      icon: Sparkles,
                      category: 'CRM',
                    },
                    {
                      key: 'reporting',
                      label: 'Reporting & Analytics',
                      description: 'Sales reports, inventory reports, financial reports, and custom dashboards',
                      icon: TrendingUp,
                      category: 'Analytics',
                    },
                    {
                      key: 'api',
                      label: 'API Access',
                      description: 'RESTful API access for integrations, third-party apps, and custom development',
                      icon: Globe,
                      category: 'Integration',
                    },
                    {
                      key: 'webhooks',
                      label: 'Webhooks',
                      description: 'Real-time event notifications via HTTP callbacks for external integrations',
                      icon: Zap,
                      category: 'Integration',
                    },
                  ].map((feature) => {
                    const Icon = feature.icon;
                    const value = featuresDraft[feature.key] ?? false;
                    return (
                      <div key={feature.key} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 rounded-lg bg-white border border-gray-200 flex-shrink-0">
                              <Icon className="w-4 h-4 text-gray-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <label className="text-sm font-medium text-gray-900 cursor-pointer">
                                  {feature.label}
                                </label>
                                <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                                  {feature.category}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mb-2">{feature.description}</p>
                              <Tooltip text={`Toggle ${feature.label} module. When disabled, this feature will be hidden from the tenant's interface.`} position="top">
                                <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help inline-block" />
                              </Tooltip>
                            </div>
                          </div>
                          <Switch
                            checked={value}
                            onCheckedChange={(checked) =>
                              setFeaturesDraft((prev) => ({
                                ...prev,
                                [feature.key]: checked,
                              }))
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Additional modules that might be added later */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Coming Soon</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { label: 'POS System', description: 'Point of sale with cart, payments, receipts' },
                        { label: 'Purchase Orders', description: 'Vendor management and procurement' },
                        { label: 'Financial Accounting', description: 'GL, P&L, balance sheets, tax reports' },
                        { label: 'Employee Management', description: 'Staff scheduling, attendance, payroll' },
                        { label: 'Export & Import', description: 'Bulk data operations, CSV/Excel support' },
                        { label: 'Sync Center', description: 'Data synchronization and replication' },
                        { label: 'Audit Logs', description: 'Complete audit trail and compliance' },
                        { label: 'Notifications', description: 'In-app and email notifications' },
                      ].map((module) => (
                        <div key={module.label} className="bg-gray-50 border border-gray-200 rounded-lg p-3 opacity-60">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-gray-700">{module.label}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{module.description}</p>
                            </div>
                            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">Soon</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Usage Alerts Tab */}
            {activeTab === 'alerts' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Bell className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-amber-900 mb-1">Usage Alerts & Notifications</h3>
                      <p className="text-xs text-amber-700">
                        Configure alerts when resource usage approaches limits.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <label className="text-sm font-medium text-gray-900">Enable Usage Alerts</label>
                        <p className="text-xs text-gray-600 mt-1">
                          Receive notifications when usage approaches limits
                        </p>
                      </div>
                      <Switch
                        checked={usageAlertsDraft.enabled}
                        onCheckedChange={(checked) =>
                          setUsageAlertsDraft((prev) => ({ ...prev, enabled: checked }))
                        }
                      />
                    </div>

                    {usageAlertsDraft.enabled && (
                      <div className="space-y-4 pt-4 border-t border-gray-200">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Alert Thresholds (%)
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                              { key: 'users', label: 'Users' },
                              { key: 'stores', label: 'Stores' },
                              { key: 'products', label: 'Products' },
                              { key: 'monthlyTransactions', label: 'Transactions' },
                              { key: 'storageBytes', label: 'Storage' },
                            ].map((item) => (
                              <div key={item.key}>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={usageAlertsDraft.thresholds[item.key as keyof typeof usageAlertsDraft.thresholds] || 80}
                                  onChange={(e) =>
                                    setUsageAlertsDraft((prev) => ({
                                      ...prev,
                                      thresholds: {
                                        ...prev.thresholds,
                                        [item.key]: Number(e.target.value),
                                      },
                                    }))
                                  }
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                  placeholder="80"
                                />
                                <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-sm font-medium text-gray-900">Email Notifications</label>
                              <p className="text-xs text-gray-600 mt-1">
                                Send alerts via email
                              </p>
                            </div>
                            <Switch
                              checked={usageAlertsDraft.emailNotifications ?? true}
                              onCheckedChange={(checked) =>
                                setUsageAlertsDraft((prev) => ({ ...prev, emailNotifications: checked }))
                              }
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              Webhook URL (Optional)
                            </label>
                            <input
                              type="url"
                              value={usageAlertsDraft.webhookUrl || ''}
                              onChange={(e) =>
                                setUsageAlertsDraft((prev) => ({ ...prev, webhookUrl: e.target.value }))
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                              placeholder="https://example.com/webhook"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* API Endpoints Tab */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-indigo-900 mb-1">Available API Endpoints</h3>
                      <p className="text-xs text-indigo-700">
                        Manage tenant resources through RESTful API endpoints. All endpoints require authentication.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      method: 'GET',
                      endpoint: `/api/tenants/${tenantId}/usage`,
                      description: 'Get current usage statistics and limits',
                      color: 'bg-green-100 text-green-700 border-green-200',
                      icon: Activity,
                    },
                    {
                      method: 'PATCH',
                      endpoint: `/api/tenants/${tenantId}/limits`,
                      description: 'Update resource limits (users, stores, products, transactions, storage)',
                      color: 'bg-blue-100 text-blue-700 border-blue-200',
                      icon: Database,
                    },
                    {
                      method: 'PATCH',
                      endpoint: `/api/tenants/${tenantId}/plan`,
                      description: 'Update subscription plan, billing cycle, and features',
                      color: 'bg-purple-100 text-purple-700 border-purple-200',
                      icon: CreditCard,
                    },
                    {
                      method: 'GET',
                      endpoint: `/api/tenants/${tenantId}`,
                      description: 'Get tenant details and configuration',
                      color: 'bg-green-100 text-green-700 border-green-200',
                      icon: Info,
                    },
                    {
                      method: 'PUT',
                      endpoint: `/api/tenants/${tenantId}`,
                      description: 'Update tenant information and settings',
                      color: 'bg-orange-100 text-orange-700 border-orange-200',
                      icon: Settings,
                    },
                    {
                      method: 'PATCH',
                      endpoint: `/api/tenants/${tenantId}/suspend`,
                      description: 'Suspend tenant account (requires reason)',
                      color: 'bg-red-100 text-red-700 border-red-200',
                      icon: Lock,
                    },
                    {
                      method: 'PATCH',
                      endpoint: `/api/tenants/${tenantId}/activate`,
                      description: 'Reactivate suspended tenant account',
                      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                      icon: Unlock,
                    },
                  ].map((api, index) => {
                    const Icon = api.icon;
                    return (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${api.color} border`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-semibold ${
                                    api.method === 'GET'
                                      ? 'bg-green-100 text-green-700'
                                      : api.method === 'POST'
                                        ? 'bg-blue-100 text-blue-700'
                                        : api.method === 'PUT'
                                          ? 'bg-orange-100 text-orange-700'
                                          : api.method === 'PATCH'
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {api.method}
                                </span>
                                <code className="text-xs md:text-sm font-mono text-gray-900 break-all">
                                  {api.endpoint}
                                </code>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(api.endpoint);
                                  toast.success('Copied!', {
                                    description: 'API endpoint copied to clipboard',
                                  });
                                }}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                                title="Copy endpoint"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-600">{api.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Example Request
                  </h4>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-xs text-green-400 font-mono">
                      <code>{`curl -X PATCH ${window.location.origin}/api/tenants/${tenantId}/limits \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "limits": {
      "users": 50,
      "stores": 10,
      "products": 5000
    }
  }'`}</code>
                    </pre>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const example = `curl -X PATCH ${window.location.origin}/api/tenants/${tenantId}/limits \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "limits": {
      "users": 50,
      "stores": 10,
      "products": 5000
    }
  }'`;
                      navigator.clipboard.writeText(example);
                      toast.success('Copied!', {
                        description: 'Example request copied to clipboard',
                      });
                    }}
                    className="mt-3 px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <Copy className="w-3 h-3" />
                    Copy Example
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900 mb-1">API Documentation</h4>
                      <p className="text-xs text-blue-700 mb-3">
                        For complete API documentation, request examples, and authentication details, visit the API docs.
                      </p>
                      <button
                        type="button"
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                        onClick={() => {
                          toast.info('API Documentation', {
                            description: 'Full API docs available at /api/docs',
                          });
                        }}
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Full Documentation
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Settings className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">Advanced Settings</h3>
                      <p className="text-xs text-gray-700">
                        Additional configuration options and system settings.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-900 mb-1">Usage Reset</h4>
                        <p className="text-xs text-yellow-700 mb-3">
                          Reset usage counters for the current billing period. This action cannot be undone.
                        </p>
                        <button
                          type="button"
                          className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-xs font-medium hover:bg-yellow-700 transition-colors"
                          onClick={() => {
                            toast.warning('Usage Reset', {
                              description: 'This feature will be implemented soon.',
                            });
                          }}
                        >
                          Reset Usage Counters
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900 mb-1">Plan History</h4>
                        <p className="text-xs text-blue-700 mb-3">
                          View plan changes and upgrade/downgrade history.
                        </p>
                        <button
                          type="button"
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                          onClick={() => {
                            toast.info('Plan History', {
                              description: 'This feature will be implemented soon.',
                            });
                          }}
                        >
                          View Plan History
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Lock className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-red-900 mb-1">Suspend Tenant</h4>
                        <p className="text-xs text-red-700 mb-3">
                          Temporarily suspend tenant access. All operations will be blocked until reactivation.
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
                            onClick={() => {
                              toast.error('Suspend Tenant', {
                                description: 'This feature requires confirmation.',
                              });
                            }}
                          >
                            Suspend Account
                          </button>
                          {data.tenant.status === 'suspended' && (
                            <button
                              type="button"
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                              onClick={() => {
                                setPlanDraft((prev) => ({ ...prev, status: 'active' }));
                                toast.success('Account Reactivated', {
                                  description: 'Tenant account has been reactivated.',
                                });
                              }}
                            >
                              <Unlock className="w-4 h-4 inline mr-1" />
                              Reactivate
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Spinner size="md" className="mx-auto mb-4" />
              <p className="text-sm text-gray-500">Loading tenant data…</p>
            </div>
          </div>
        )}
      </OffCanvas>
    </div>
  );
}
