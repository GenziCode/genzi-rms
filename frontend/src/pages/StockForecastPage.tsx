import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  ArrowDownCircle,
  Calculator,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { stockForecastService, type StockForecast } from '@/services/stockForecast.service';
import { settingsService } from '@/services/settings.service';

const lookbackOptions = [
  { label: '30 days', value: 30 },
  { label: '60 days', value: 60 },
  { label: '90 days', value: 90 },
  { label: '180 days', value: 180 },
];

export default function StockForecastPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    storeId: '',
    lookbackDays: 90,
    minVelocity: 0,
    search: '',
  });
  const [editingProduct, setEditingProduct] = useState<StockForecast | null>(null);

  const storesQuery = useQuery({
    queryKey: ['stores', 'select'],
    queryFn: () => settingsService.getStores(),
  });

  const forecastQuery = useQuery({
    queryKey: ['stock-forecast', filters],
    queryFn: () =>
      stockForecastService.list({
        storeId: filters.storeId || undefined,
        lookbackDays: filters.lookbackDays,
        minVelocity: filters.minVelocity || undefined,
      }),
  });

  const updateOverrideMutation = useMutation({
    mutationFn: (payload: {
      productId: string;
      leadTimeDays?: number;
      safetyStockDays?: number;
      notes?: string;
    }) => stockForecastService.updateOverride(payload.productId, payload),
    onSuccess: () => {
      toast.success('Forecast override saved');
      queryClient.invalidateQueries({ queryKey: ['stock-forecast'] });
      setEditingProduct(null);
    },
    onError: () => toast.error('Unable to save override'),
  });

  const filteredForecasts = useMemo(() => {
    if (!forecastQuery.data?.forecasts) return [];
    if (!filters.search.trim()) return forecastQuery.data.forecasts;
    const term = filters.search.toLowerCase();
    return forecastQuery.data.forecasts.filter((forecast) => {
      const product = forecast.product;
      return (
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term)
      );
    });
  }, [forecastQuery.data?.forecasts, filters.search]);

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
            Advanced Inventory
          </p>
          <h1 className="text-3xl font-bold text-gray-900">Stock Forecasting</h1>
          <p className="text-gray-600 mt-1 max-w-2xl">
            Generate demand-driven reorder signals with configurable lead-time and safety stock overrides.
          </p>
        </div>
        <button
          onClick={() => forecastQuery.refetch()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {forecastQuery.isFetching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Products analyzed"
          value={forecastQuery.data?.metadata.totalProducts ?? 0}
          icon={<Calculator className="w-5 h-5 text-blue-600" />}
          description={`Lookback window: ${forecastQuery.data?.metadata.lookbackDays ?? filters.lookbackDays} days`}
        />
        <MetricCard
          title="Average days of supply"
          value={averageDaysOfSupply(filteredForecasts)}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          description="Median projected days left across items"
        />
        <MetricCard
          title="Below reorder"
          value={filteredForecasts.filter((f) => f.onHand <= f.reorderPoint).length}
          icon={<TrendingDown className="w-5 h-5 text-rose-600" />}
          description="Items at or below reorder point"
        />
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, search: event.target.value }))
              }
              placeholder="Search by product name or SKU..."
              className="w-full rounded-xl border border-gray-200 pl-9 pr-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <select
            value={filters.storeId}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, storeId: event.target.value }))
            }
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All stores</option>
            {storesQuery.data?.map((store) => (
              <option key={store._id} value={store._id}>
                {store.name}
              </option>
            ))}
          </select>
          <select
            value={filters.lookbackDays}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, lookbackDays: Number(event.target.value) }))
            }
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {lookbackOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5">
            <span className="text-sm text-gray-600">Min velocity</span>
            <input
              type="number"
              value={filters.minVelocity}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, minVelocity: Number(event.target.value) }))
              }
              className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {forecastQuery.isLoading ? (
            <div className="py-16 flex flex-col items-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mb-3" />
              Generating forecasts...
            </div>
          ) : filteredForecasts.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-gray-500">
              <ArrowDownCircle className="w-10 h-10 text-gray-300 mb-3" />
              No products match the current filters.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Avg daily</th>
                  <th className="py-3 px-4">On hand</th>
                  <th className="py-3 px-4">Reorder point</th>
                  <th className="py-3 px-4">Days of supply</th>
                  <th className="py-3 px-4">Overrides</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredForecasts.map((forecast) => (
                  <tr key={forecast.product.id} className="hover:bg-gray-50/60">
                    <td className="py-4 px-4">
                      <p className="font-semibold text-gray-900">{forecast.product.name}</p>
                      <p className="text-xs text-gray-500">{forecast.product.sku}</p>
                    </td>
                    <td className="py-4 px-4 font-semibold text-gray-900">
                      {forecast.avgDailyDemand.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-gray-700">{forecast.onHand}</td>
                    <td className="py-4 px-4">
                      <div className="text-gray-900 font-semibold">{forecast.reorderPoint}</div>
                      <p className="text-xs text-gray-500">
                        Safety stock {forecast.safetyStock} • Lead time {forecast.leadTimeDays}d
                      </p>
                    </td>
                    <td className="py-4 px-4 text-gray-700">
                      {forecast.projectedDaysRemaining !== null
                        ? `${forecast.projectedDaysRemaining} days`
                        : '—'}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {forecast.override ? (
                        <>
                          LT {forecast.override.leadTimeDays ?? '-'}d / SS{' '}
                          {forecast.override.safetyStockDays ?? '-'}d
                          {forecast.override.notes ? (
                            <p className="text-xs text-gray-500 mt-1">
                              {forecast.override.notes}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">Default</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setEditingProduct(forecast)}
                        className="inline-flex items-center rounded-full bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-600/20"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {editingProduct && (
        <OverrideDrawer
          forecast={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={(payload) =>
            updateOverrideMutation.mutate({
              productId: editingProduct.product.id,
              ...payload,
            })
          }
          isSaving={updateOverrideMutation.isLoading}
        />
      )}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
}

function MetricCard({ title, value, description, icon }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 flex items-center gap-4">
      <div className="rounded-2xl bg-blue-50 p-3">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
    </div>
  );
}

function averageDaysOfSupply(forecasts: StockForecast[]) {
  if (!forecasts.length) return 0;
  const days = forecasts
    .map((forecast) => forecast.projectedDaysRemaining ?? 0)
    .filter((val) => val > 0);
  if (!days.length) return 0;
  const sorted = [...days].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return median.toFixed(1);
}

interface OverrideDrawerProps {
  forecast: StockForecast;
  onClose: () => void;
  onSave: (payload: { leadTimeDays?: number; safetyStockDays?: number; notes?: string }) => void;
  isSaving: boolean;
}

function OverrideDrawer({ forecast, onClose, onSave, isSaving }: OverrideDrawerProps) {
  const [leadTime, setLeadTime] = useState(forecast.leadTimeDays);
  const [safetyDays, setSafetyDays] = useState(forecast.safetyStockDays);
  const [notes, setNotes] = useState(forecast.override?.notes ?? '');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({
      leadTimeDays: leadTime,
      safetyStockDays: safetyDays,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Override settings
              </p>
              <h2 className="text-xl font-semibold text-gray-900">{forecast.product.name}</h2>
              <p className="text-xs text-gray-500">{forecast.product.sku}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-200 p-1 text-gray-500 hover:text-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-700">Lead time (days)</label>
              <input
                type="number"
                min={0}
                value={leadTime}
                onChange={(event) => setLeadTime(Number(event.target.value))}
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Safety stock days</label>
              <input
                type="number"
                min={0}
                value={safetyDays}
                onChange={(event) => setSafetyDays(Number(event.target.value))}
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Why is this override needed?"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Overrides immediately influence reorder point calculations.
            </p>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Save override
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

