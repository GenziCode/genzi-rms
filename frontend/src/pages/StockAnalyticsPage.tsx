import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, RefreshCw, Search, TrendingUp, Warehouse } from 'lucide-react';
import { stockAnalyticsService } from '@/services/stockAnalytics.service';
import { settingsService } from '@/services/settings.service';

export default function StockAnalyticsPage() {
  const [filters, setFilters] = useState({
    storeId: '',
    categoryId: '',
    search: '',
    lookbackDays: 90,
  });

  const storesQuery = useQuery({
    queryKey: ['stores', 'select'],
    queryFn: () => settingsService.getStores(),
  });

  const agingQuery = useQuery({
    queryKey: ['analytics-aging', filters.storeId, filters.categoryId],
    queryFn: () =>
      stockAnalyticsService.getAging({
        storeId: filters.storeId || undefined,
        categoryId: filters.categoryId || undefined,
      }),
  });

  const turnoverQuery = useQuery({
    queryKey: ['analytics-turnover', filters.storeId, filters.lookbackDays],
    queryFn: () =>
      stockAnalyticsService.getTurnover({
        storeId: filters.storeId || undefined,
        lookbackDays: filters.lookbackDays,
        limit: 10,
      }),
  });

  const congestionQuery = useQuery({
    queryKey: ['analytics-congestion', filters.storeId, filters.lookbackDays],
    queryFn: () =>
      stockAnalyticsService.getCongestion({
        storeId: filters.storeId || undefined,
        lookbackDays: filters.lookbackDays,
      }),
  });

  const filteredBuckets = useMemo(() => {
    if (!agingQuery.data) return [];
    if (!filters.search.trim()) return agingQuery.data;
    const term = filters.search.toLowerCase();
    return agingQuery.data.map((bucket) => ({
      ...bucket,
      products: bucket.products.filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          product.sku.toLowerCase().includes(term)
      ),
    }));
  }, [agingQuery.data, filters.search]);

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
            Advanced Inventory
          </p>
          <h1 className="text-3xl font-bold text-gray-900">Stock Analytics</h1>
          <p className="text-gray-600 mt-1">
            Age buckets, turnover velocity, and congestion signals to spot blind spots in inventory health.
          </p>
        </div>
        <button
          onClick={() => {
            agingQuery.refetch();
            turnoverQuery.refetch();
            congestionQuery.refetch();
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </header>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, search: event.target.value }))
              }
              placeholder="Filter products by name or SKU..."
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
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
            <option value={180}>180 days</option>
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <AnalyticsCard
            title="Inventory Aging"
            isLoading={agingQuery.isLoading}
            content={
              filteredBuckets.map((bucket) => (
                <div key={bucket._id} className="rounded-xl border border-gray-100 p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{bucket._id}</p>
                    <p className="text-xs text-gray-500">{bucket.count} SKUs</p>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{bucket.totalUnits} units</p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    {bucket.products.slice(0, 4).map((product) => (
                      <span key={product.sku} className="rounded-full bg-gray-50 px-3 py-1">
                        {product.name} ({Math.round(product.daysSinceMovement)}d)
                      </span>
                    ))}
                    {bucket.products.length > 4 && (
                      <span className="text-gray-400">+{bucket.products.length - 4} more</span>
                    )}
                  </div>
                </div>
              )) || <p className="text-sm text-gray-500">No aging data</p>
            }
          />

          <AnalyticsCard
            title="Top Turnover"
            isLoading={turnoverQuery.isLoading}
            content={
              turnoverQuery.data ? (
                <div className="space-y-2">
                  {turnoverQuery.data.map((entry) => (
                    <div
                      key={entry.productId}
                      className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2"
                    >
                      <p className="text-sm font-medium text-gray-900">{entry.productId}</p>
                      <span className="text-sm font-semibold text-gray-700">
                        {entry.turnover.toFixed(1)} / mo
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No turnover data</p>
              )
            }
          />
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700">Movement Congestion</p>
            <p className="text-xs text-gray-500">
              Distribution of movements per store/type over the selected window.
            </p>
          </div>
          {congestionQuery.isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {congestionQuery.data?.map((entry, index) => (
            <div
              key={`${entry._id.store}-${entry._id.type}-${index}`}
              className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700"
            >
              <p className="font-semibold text-gray-900">
                {entry._id.type} • {entry._id.store}
              </p>
              <p className="text-xs text-gray-500">{entry.count} movements</p>
            </div>
          )) || <p className="text-sm text-gray-500">No congestion data</p>}
        </div>
      </section>
    </div>
  );
}

interface AnalyticsCardProps {
  title: string;
  isLoading: boolean;
  content: React.ReactNode;
}

function AnalyticsCard({ title, isLoading, content }: AnalyticsCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 min-h-[200px]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
      </div>
      <div className="mt-3 text-sm text-gray-700 space-y-2">{content}</div>
    </div>
  );
}

