import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Boxes,
  Loader2,
  Map as MapIcon,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import {
  warehouseService,
  type CreateWarehouseRequest,
  type Warehouse,
} from '@/services/warehouse.service';
import { settingsService } from '@/services/settings.service';

export default function WarehouseManagementPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ storeId: '', search: '' });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const storesQuery = useQuery({
    queryKey: ['stores', 'select'],
    queryFn: () => settingsService.getStores(),
  });

  const warehousesQuery = useQuery({
    queryKey: ['warehouses', filters],
    queryFn: () =>
      warehouseService.list({
        storeId: filters.storeId || undefined,
        search: filters.search || undefined,
      }),
  });

  const warehouses = warehousesQuery.data?.records ?? [];

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
            Advanced Inventory
          </p>
          <h1 className="text-3xl font-bold text-gray-900">Warehouse Management</h1>
          <p className="text-gray-600 mt-1">
            Map storage zones, manage bins, and orchestrate warehouse tasks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => warehousesQuery.refetch()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {warehousesQuery.isFetching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </button>
          <button
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Warehouse
          </button>
        </div>
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
              placeholder="Search by warehouse name or code..."
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
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {warehousesQuery.isLoading ? (
            <div className="col-span-full py-16 flex flex-col items-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mb-3" />
              Loading warehouses...
            </div>
          ) : warehouses.length === 0 ? (
            <div className="col-span-full py-16 flex flex-col items-center text-gray-500 text-center">
              <MapPin className="w-10 h-10 text-gray-300 mb-3" />
              No warehouses defined yet.
            </div>
          ) : (
            warehouses.map((warehouse) => (
              <WarehouseCard key={warehouse._id} warehouse={warehouse} />
            ))
          )}
        </div>
      </section>

      {drawerOpen && (
        <WarehouseDrawer
          onClose={() => setDrawerOpen(false)}
          stores={storesQuery.data || []}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ['warehouses'] });
            setDrawerOpen(false);
          }}
        />
      )}
    </div>
  );
}

function WarehouseCard({ warehouse }: { warehouse: Warehouse }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
            {warehouse.code}
          </p>
          <h3 className="text-lg font-semibold text-gray-900">{warehouse.name}</h3>
          <p className="text-xs text-gray-500">
            Store:{' '}
            {typeof warehouse.store === 'string' ? warehouse.store : (warehouse.store as any)?.name}
          </p>
        </div>
        <div className="rounded-full bg-blue-50 p-3">
          <Boxes className="w-5 h-5 text-blue-600" />
        </div>
      </div>
      <p className="text-sm text-gray-600">
        {warehouse.description || 'No description provided'}
      </p>
      <div className="grid grid-cols-3 gap-2">
        <MetricPill label="Zones" value={warehouse.zones.length} />
        <MetricPill label="Bins" value={warehouse.bins.length} />
        <MetricPill
          label="Tasks"
          value={(warehouse as any).tasks?.length ?? 0}
        />
      </div>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-gray-50 py-2 px-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

interface WarehouseDrawerProps {
  onClose: () => void;
  onCreated: () => void;
  stores: Array<{ _id: string; name: string }>;
}

function WarehouseDrawer({ onClose, onCreated, stores }: WarehouseDrawerProps) {
  const [form, setForm] = useState<CreateWarehouseRequest>({
    name: '',
    code: '',
    storeId: '',
    description: '',
    zones: [],
    bins: [],
  });
  const [zoneDraft, setZoneDraft] = useState({
    name: '',
    code: '',
    type: 'storage',
    description: '',
  });
  const [binDraft, setBinDraft] = useState({
    code: '',
    zoneCode: '',
    capacity: 0,
    allowOversize: false,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateWarehouseRequest) => warehouseService.create(payload),
    onSuccess: () => {
      toast.success('Warehouse created');
      onCreated();
    },
    onError: () => toast.error('Unable to create warehouse'),
  });

  const addZone = () => {
    if (!zoneDraft.name.trim() || !zoneDraft.code.trim()) {
      toast.error('Zone name/code required');
      return;
    }
    setForm((prev) => ({
      ...prev,
      zones: [
        ...(prev.zones || []),
        {
          name: zoneDraft.name.trim(),
          code: zoneDraft.code.trim(),
          type: zoneDraft.type as any,
          description: zoneDraft.description || undefined,
        },
      ],
    }));
    setZoneDraft({ name: '', code: '', type: 'storage', description: '' });
  };

  const addBin = () => {
    if (!binDraft.code.trim() || !binDraft.zoneCode.trim()) {
      toast.error('Bin code and zone required');
      return;
    }
    setForm((prev) => ({
      ...prev,
      bins: [
        ...(prev.bins || []),
        {
          code: binDraft.code.trim(),
          zoneCode: binDraft.zoneCode.trim(),
          capacity: binDraft.capacity || undefined,
          allowOversize: binDraft.allowOversize,
        },
      ],
    }));
    setBinDraft({ code: '', zoneCode: '', capacity: 0, allowOversize: false });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Name and code are required');
      return;
    }
    if (!form.storeId) {
      toast.error('Select a store');
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col">
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Create warehouse
              </p>
              <h2 className="text-xl font-semibold text-gray-900">New warehouse</h2>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Code</label>
                <input
                  value={form.code}
                  onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Store</label>
              <select
                value={form.storeId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, storeId: event.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select store</option>
                {stores.map((store) => (
                  <option key={store._id} value={store._id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, description: event.target.value }))
                }
                rows={3}
                className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Zones</p>
                <button
                  type="button"
                  onClick={addZone}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Add zone
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  value={zoneDraft.name}
                  onChange={(event) =>
                    setZoneDraft((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Zone name"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
                <input
                  value={zoneDraft.code}
                  onChange={(event) =>
                    setZoneDraft((prev) => ({ ...prev, code: event.target.value }))
                  }
                  placeholder="Zone code"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={zoneDraft.type}
                  onChange={(event) =>
                    setZoneDraft((prev) => ({ ...prev, type: event.target.value }))
                  }
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="storage">Storage</option>
                  <option value="receiving">Receiving</option>
                  <option value="picking">Picking</option>
                  <option value="staging">Staging</option>
                </select>
                <input
                  value={zoneDraft.description}
                  onChange={(event) =>
                    setZoneDraft((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="Notes"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                {form.zones?.map((zone) => (
                  <div
                    key={zone.code}
                    className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{zone.name}</p>
                      <p className="text-xs text-gray-500">
                        {zone.code} • {zone.type}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          zones: prev.zones?.filter((z) => z.code !== zone.code),
                        }))
                      }
                      className="text-xs text-gray-400 hover:text-gray-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Bins</p>
                <button
                  type="button"
                  onClick={addBin}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Add bin
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  value={binDraft.code}
                  onChange={(event) =>
                    setBinDraft((prev) => ({ ...prev, code: event.target.value }))
                  }
                  placeholder="Bin code"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
                <input
                  value={binDraft.zoneCode}
                  onChange={(event) =>
                    setBinDraft((prev) => ({ ...prev, zoneCode: event.target.value }))
                  }
                  placeholder="Zone code"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="number"
                  value={binDraft.capacity}
                  onChange={(event) =>
                    setBinDraft((prev) => ({
                      ...prev,
                      capacity: Number(event.target.value),
                    }))
                  }
                  placeholder="Capacity"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
                <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={binDraft.allowOversize}
                    onChange={(event) =>
                      setBinDraft((prev) => ({
                        ...prev,
                        allowOversize: event.target.checked,
                      }))
                    }
                  />
                  Allow oversize
                </label>
              </div>
              <div className="space-y-2">
                {form.bins?.map((bin) => (
                  <div
                    key={bin.code}
                    className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{bin.code}</p>
                      <p className="text-xs text-gray-500">
                        Zone {bin.zoneCode} • Cap {bin.capacity ?? '—'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          bins: prev.bins?.filter((b) => b.code !== bin.code),
                        }))
                      }
                      className="text-xs text-gray-400 hover:text-gray-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between">
            <p className="text-xs text-gray-500">Zones and bins can be edited later.</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
              >
                {createMutation.isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MapIcon className="w-4 h-4" />
                )}
                Create warehouse
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

