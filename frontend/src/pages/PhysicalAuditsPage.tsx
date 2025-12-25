import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { physicalAuditsService, type CreatePhysicalAuditRequest, type PhysicalAuditSession, type PhysicalAuditStatus, type PhysicalAuditType } from '@/services/physicalAudits.service';
import { settingsService } from '@/services/settings.service';
import { productsService } from '@/services/products.service';
import { formatDistanceToNow } from 'date-fns';

const statusMeta: Record<
  PhysicalAuditStatus,
  { label: string; color: string }
> = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700' },
  scheduled: { label: 'Scheduled', color: 'bg-amber-100 text-amber-700' },
  counting: { label: 'Counting', color: 'bg-blue-100 text-blue-700' },
  review: { label: 'Review', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-200 text-gray-600' },
};

const typeMeta: Record<
  PhysicalAuditType,
  { label: string; description: string }
> = {
  cycle: { label: 'Cycle', description: 'Focus on rotating segments' },
  blind: { label: 'Blind', description: 'Counters ignore expected qty' },
  full: { label: 'Full', description: 'Entire catalog snapshot' },
};

export default function PhysicalAuditsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<{
    status: '' | PhysicalAuditStatus;
    type: '' | PhysicalAuditType;
    search: string;
  }>({
    status: '',
    type: '',
    search: '',
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sessionsQuery = useQuery({
    queryKey: ['physical-audits', filters],
    queryFn: () =>
      physicalAuditsService.list({
        status: filters.status || undefined,
        type: filters.type || undefined,
        search: filters.search || undefined,
        limit: 50,
      }),
  });

  const mutation = useMutation({
    mutationFn: (data: { action: 'start' | 'review' | 'complete'; id: string }) => {
      switch (data.action) {
        case 'start':
          return physicalAuditsService.start(data.id);
        case 'review':
          return physicalAuditsService.moveToReview(data.id);
        case 'complete':
          return physicalAuditsService.complete(data.id);
      }
    },
    onSuccess: () => {
      toast.success('Audit updated');
      queryClient.invalidateQueries({ queryKey: ['physical-audits'] });
    },
    onError: () => toast.error('Unable to update audit'),
  });

  const sessions = sessionsQuery.data?.records ?? [];

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
            Advanced Inventory
          </p>
          <h1 className="text-3xl font-bold text-gray-900">Physical Audits</h1>
          <p className="text-gray-600 mt-1">
            Plan cycle counts, capture blind audits, and reconcile variances with confidence.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => sessionsQuery.refetch()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {sessionsQuery.isFetching ? (
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
            New Audit
          </button>
        </div>
      </header>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              placeholder="Search by name or reference..."
              className="w-full rounded-xl border border-gray-200 pl-9 pr-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                status: event.target.value as PhysicalAuditStatus | '',
              }))
            }
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All statuses</option>
            {Object.keys(statusMeta).map((status) => (
              <option key={status} value={status}>
                {statusMeta[status as PhysicalAuditStatus].label}
              </option>
            ))}
          </select>
          <select
            value={filters.type}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                type: event.target.value as PhysicalAuditType | '',
              }))
            }
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Any type</option>
            {Object.entries(typeMeta).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          {sessionsQuery.isLoading ? (
            <div className="py-16 flex flex-col items-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mb-3" />
              Loading audits...
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-gray-500">
              <ClipboardList className="w-10 h-10 text-gray-300 mb-3" />
              No audits yet. Launch your first cycle count!
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="py-3 px-4">Audit</th>
                  <th className="py-3 px-4">Store</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Entries</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map((session) => (
                  <tr key={session._id} className="hover:bg-gray-50/60">
                    <td className="py-4 px-4">
                      <p className="font-semibold text-gray-900">{session.name}</p>
                      <p className="text-xs text-gray-500">{session.reference}</p>
                    </td>
                    <td className="py-4 px-4 text-gray-700">
                      {typeof session.store === 'string'
                        ? session.store
                        : session.store?.name || session.store?.code || '—'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm font-medium text-gray-900">{typeMeta[session.type].label}</div>
                      <p className="text-xs text-gray-500">{typeMeta[session.type].description}</p>
                    </td>
                    <td className="py-4 px-4 text-gray-700">{session.entries.length} items</td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusMeta[session.status].color}`}
                      >
                        {statusMeta[session.status].label}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {session.timeline.startedAt ? (
                        <>
                          Started{' '}
                          {formatDistanceToNow(new Date(session.timeline.startedAt), {
                            addSuffix: true,
                          })}
                        </>
                      ) : session.scheduledFor ? (
                        <>
                          Scheduled {new Date(session.scheduledFor).toLocaleDateString()}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-end gap-2">
                        {session.status === 'draft' || session.status === 'scheduled' ? (
                          <ActionButton
                            label="Start"
                            onClick={() => mutation.mutate({ action: 'start', id: session._id })}
                            loading={mutation.isPending}
                          />
                        ) : null}
                        {session.status === 'counting' ? (
                          <ActionButton
                            label="Move to review"
                            onClick={() => mutation.mutate({ action: 'review', id: session._id })}
                            loading={mutation.isPending}
                          />
                        ) : null}
                        {session.status === 'review' ? (
                          <ActionButton
                            label="Complete"
                            onClick={() => mutation.mutate({ action: 'complete', id: session._id })}
                            loading={mutation.isPending}
                          />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <CreateAuditDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  loading?: boolean;
}

function ActionButton({ label, onClick, loading }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
      {label}
    </button>
  );
}

interface CreateAuditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function CreateAuditDrawer({ isOpen, onClose }: CreateAuditDrawerProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreatePhysicalAuditRequest>({
    name: '',
    type: 'cycle',
    storeId: '',
    scheduledFor: '',
    dueDate: '',
    instructions: '',
    entries: [],
  });
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState<Array<{ _id: string; name: string; sku?: string; category?: string }>>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setForm({
        name: '',
        type: 'cycle',
        storeId: '',
        scheduledFor: '',
        dueDate: '',
        instructions: '',
        entries: [],
      });
      setProductQuery('');
      setProductResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!productQuery || productQuery.length < 2) {
      setProductResults([]);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(() => {
      productsService
        .search(productQuery)
        .then((results) => setProductResults(results.slice(0, 5)))
        .catch(() => setProductResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [productQuery]);

  const storesQuery = useQuery({
    queryKey: ['stores', 'select'],
    queryFn: () => settingsService.getStores(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreatePhysicalAuditRequest) => physicalAuditsService.create(payload),
    onSuccess: () => {
      toast.success('Audit created');
      queryClient.invalidateQueries({ queryKey: ['physical-audits'] });
      onClose();
    },
    onError: () => toast.error('Unable to create audit'),
  });

  const addEntry = (product: { _id: string; name: string; sku?: string; category?: string }) => {
    setForm((prev) => {
      if (prev.entries.some((entry) => entry.productId === product._id)) {
        return prev;
      }
      return {
        ...prev,
        entries: [
          ...prev.entries,
          {
            productId: product._id,
            name: product.name,
            sku: product.sku,
            category: product.category,
            expectedQty: 0,
          },
        ],
      };
    });
    setProductQuery('');
    setProductResults([]);
  };

  const updateEntryQty = (productId: string, qty: number) => {
    setForm((prev) => ({
      ...prev,
      entries: prev.entries.map((entry) =>
        entry.productId === productId ? { ...entry, expectedQty: qty } : entry
      ),
    }));
  };

  const removeEntry = (productId: string) => {
    setForm((prev) => ({
      ...prev,
      entries: prev.entries.filter((entry) => entry.productId !== productId),
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error('Audit name is required');
      return;
    }
    if (!form.storeId) {
      toast.error('Select a store');
      return;
    }
    if (!form.entries.length) {
      toast.error('Add at least one product');
      return;
    }
    createMutation.mutate(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col">
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Create audit
              </p>
              <h2 className="text-xl font-semibold text-gray-900">New physical audit</h2>
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
              <label className="text-sm font-medium text-gray-700">Audit name</label>
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Cycle Count - Aisle 5"
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Audit type</label>
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      type: event.target.value as PhysicalAuditType,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {Object.entries(typeMeta).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ))}
                </select>
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
                  {storesQuery.data?.map((store) => (
                    <option key={store._id} value={store._id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Scheduled date</label>
                <input
                  type="date"
                  value={form.scheduledFor}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, scheduledFor: event.target.value }))
                  }
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Due date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, dueDate: event.target.value }))
                  }
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Instructions</label>
              <textarea
                value={form.instructions}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, instructions: event.target.value }))
                }
                rows={3}
                placeholder="Provide special instructions for counters..."
                className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Products to count</label>
                <span className="text-xs text-gray-500">{form.entries.length} selected</span>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={productQuery}
                  onChange={(event) => setProductQuery(event.target.value)}
                  placeholder="Search product name, SKU..."
                  className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              {productQuery.length > 1 && (
                <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3 space-y-2 max-h-40 overflow-y-auto">
                  {searching ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" /> Searching...
                    </div>
                  ) : productResults.length === 0 ? (
                    <p className="text-sm text-gray-500">No products match that search.</p>
                  ) : (
                    productResults.map((product) => (
                      <button
                        type="button"
                        key={product._id}
                        onClick={() => addEntry(product)}
                        className="w-full text-left rounded-xl bg-white px-3 py-2 shadow-sm hover:bg-blue-50"
                      >
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.sku || '—'}</p>
                      </button>
                    ))
                  )}
                </div>
              )}

              <div className="space-y-3">
                {form.entries.map((entry) => (
                  <div
                    key={entry.productId}
                    className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{entry.name || 'Product'}</p>
                      <p className="text-xs text-gray-500">{entry.sku}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={entry.expectedQty}
                        onChange={(event) =>
                          updateEntryQty(entry.productId, Number(event.target.value))
                        }
                        className="w-24 rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeEntry(entry.productId)}
                        className="rounded-full border border-gray-200 p-1 text-gray-500 hover:text-gray-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {!form.entries.length && (
                  <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                    Search for products to add them to this audit
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Audits move through draft → counting → review → completion.
            </p>
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
                disabled={createMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ClipboardList className="w-4 h-4" />
                )}
                Create audit
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

