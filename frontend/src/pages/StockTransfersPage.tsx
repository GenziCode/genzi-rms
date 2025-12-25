import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  ArrowRightLeft,
  CheckCircle2,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  X,
} from 'lucide-react';
import {
  stockTransfersService,
  type CreateStockTransferRequest,
  type StockTransfer,
  type StockTransferPriority,
  type StockTransferStatus,
} from '@/services/stockTransfers.service';
import { settingsService } from '@/services/settings.service';
import { productsService } from '@/services/products.service';

const statusMeta: Record<
  StockTransferStatus,
  { label: string; className: string }
> = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700' },
  pending_approval: { label: 'Pending approval', className: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Approved', className: 'bg-blue-100 text-blue-700' },
  picking: { label: 'Picking', className: 'bg-indigo-100 text-indigo-700' },
  in_transit: { label: 'In transit', className: 'bg-cyan-100 text-cyan-700' },
  received: { label: 'Received', className: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', className: 'bg-slate-200 text-slate-600' },
  rejected: { label: 'Rejected', className: 'bg-rose-100 text-rose-700' },
};

const priorityMeta: Record<
  StockTransferPriority,
  { label: string; className: string }
> = {
  low: { label: 'Low', className: 'text-slate-500 bg-slate-100' },
  normal: { label: 'Normal', className: 'text-slate-600 bg-slate-100' },
  high: { label: 'High', className: 'text-orange-600 bg-orange-100' },
  urgent: { label: 'Urgent', className: 'text-rose-600 bg-rose-100' },
};

const statusFilters: Array<{ id: '' | StockTransferStatus; label: string }> = [
  { id: '', label: 'All statuses' },
  { id: 'draft', label: 'Draft' },
  { id: 'pending_approval', label: 'Pending approval' },
  { id: 'approved', label: 'Approved' },
  { id: 'picking', label: 'Picking' },
  { id: 'in_transit', label: 'In transit' },
  { id: 'received', label: 'Received' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'rejected', label: 'Rejected' },
];

const priorityFilters: Array<{ id: '' | StockTransferPriority; label: string }> = [
  { id: '', label: 'Any priority' },
  { id: 'low', label: 'Low' },
  { id: 'normal', label: 'Normal' },
  { id: 'high', label: 'High' },
  { id: 'urgent', label: 'Urgent' },
];

type TransitionAction =
  | 'submit'
  | 'approve'
  | 'reject'
  | 'picking'
  | 'in_transit'
  | 'received'
  | 'cancel';

const resolveStoreName = (
  store: StockTransfer['fromStore']
): string => {
  if (!store) return '—';
  if (typeof store === 'string') return store;
  return store.name || store.code || store.storeCode || store._id || '—';
};

export default function StockTransfersPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<{
    status: '' | StockTransferStatus;
    priority: '' | StockTransferPriority;
    search: string;
  }>({
    status: '',
    priority: '',
    search: '',
  });
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const transfersQuery = useQuery({
    queryKey: ['stock-transfers', filters],
    queryFn: () =>
      stockTransfersService.list({
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        search: filters.search || undefined,
        limit: 50,
      }),
  });

  const transitionMutation = useMutation({
    mutationFn: async (params: { action: TransitionAction; id: string; note?: string }) => {
      const { action, id, note } = params;
      switch (action) {
        case 'submit':
          return stockTransfersService.submit(id, note);
        case 'approve':
          return stockTransfersService.approve(id, note);
        case 'reject':
          return stockTransfersService.reject(id, note);
        case 'picking':
          return stockTransfersService.startPicking(id, note);
        case 'in_transit':
          return stockTransfersService.markInTransit(id, note);
        case 'received':
          return stockTransfersService.markReceived(id, note);
        case 'cancel':
          return stockTransfersService.cancel(id, note);
        default:
          throw new Error('Unsupported action');
      }
    },
    onSuccess: () => {
      toast.success('Transfer updated');
      queryClient.invalidateQueries({ queryKey: ['stock-transfers'] });
    },
    onError: () => {
      toast.error('Unable to update transfer');
    },
  });

  const handleTransition = (action: TransitionAction, transfer: StockTransfer) => {
    const note =
      action === 'reject' || action === 'cancel'
        ? prompt('Add an optional note for this action') || undefined
        : undefined;
    transitionMutation.mutate({ action, id: transfer._id, note });
  };

  const transfers = transfersQuery.data?.records ?? [];

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
            Advanced Inventory
          </p>
          <h1 className="text-3xl font-bold text-gray-900">Stock Transfer Requests</h1>
          <p className="text-gray-600 mt-1">
            Coordinate inter-store movement with approvals, picking, and fulfillment tracking.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => transfersQuery.refetch()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {transfersQuery.isFetching ? (
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
            New Transfer
          </button>
        </div>
      </header>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, search: event.target.value }))
              }
              placeholder="Search by reference, notes, store..."
              className="w-full rounded-xl border border-gray-200 pl-9 pr-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                status: event.target.value as StockTransferStatus | '',
              }))
            }
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {statusFilters.map((option) => (
              <option key={option.id || 'all'} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={filters.priority}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                priority: event.target.value as StockTransferPriority | '',
              }))
            }
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {priorityFilters.map((option) => (
              <option key={option.id || 'any'} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          {transfersQuery.isLoading ? (
            <div className="py-16 flex flex-col items-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mb-3" />
              Loading transfers...
            </div>
          ) : transfers.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-gray-500">
              <Truck className="w-10 h-10 text-gray-300 mb-3" />
              No transfers found. Create your first STR to get started.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transfers.map((transfer) => (
                  <tr key={transfer._id} className="hover:bg-gray-50/60">
                    <td className="py-4 px-4">
                      <p className="font-semibold text-gray-900">{transfer.reference}</p>
                      <p className="text-xs text-gray-500">
                        Requested {new Date(transfer.createdAt).toLocaleString()}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span>{resolveStoreName(transfer.fromStore)}</span>
                        <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                        <span>{resolveStoreName(transfer.toStore)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-900">
                        {transfer.items.length} line{transfer.items.length === 1 ? '' : 's'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {transfer.items
                          .slice(0, 2)
                          .map((item) => item.name || item.sku || item.productId)
                          .join(', ')}
                        {transfer.items.length > 2 && '…'}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${priorityMeta[transfer.priority].className}`}
                      >
                        {priorityMeta[transfer.priority].label}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusMeta[transfer.status].className}`}
                      >
                        {statusMeta[transfer.status].label}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {new Date(transfer.updatedAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-end gap-2">
                        {transfer.status === 'draft' && (
                          <>
                            <ActionButton
                              label="Submit"
                              variant="primary"
                              onClick={() => handleTransition('submit', transfer)}
                              loading={transitionMutation.isPending}
                            />
                            <ActionButton
                              label="Cancel"
                              variant="ghost"
                              onClick={() => handleTransition('cancel', transfer)}
                              loading={transitionMutation.isPending}
                            />
                          </>
                        )}
                        {transfer.status === 'pending_approval' && (
                          <>
                            <ActionButton
                              label="Approve"
                              variant="primary"
                              onClick={() => handleTransition('approve', transfer)}
                              loading={transitionMutation.isPending}
                            />
                            <ActionButton
                              label="Reject"
                              variant="danger"
                              onClick={() => handleTransition('reject', transfer)}
                              loading={transitionMutation.isPending}
                            />
                          </>
                        )}
                        {transfer.status === 'approved' && (
                          <>
                            <ActionButton
                              label="Start picking"
                              variant="primary"
                              onClick={() => handleTransition('picking', transfer)}
                              loading={transitionMutation.isPending}
                            />
                            <ActionButton
                              label="Cancel"
                              variant="ghost"
                              onClick={() => handleTransition('cancel', transfer)}
                              loading={transitionMutation.isPending}
                            />
                          </>
                        )}
                        {transfer.status === 'picking' && (
                          <ActionButton
                            label="Mark in transit"
                            variant="primary"
                            onClick={() => handleTransition('in_transit', transfer)}
                            loading={transitionMutation.isPending}
                          />
                        )}
                        {transfer.status === 'in_transit' && (
                          <ActionButton
                            label="Mark received"
                            variant="primary"
                            onClick={() => handleTransition('received', transfer)}
                            loading={transitionMutation.isPending}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <CreateTransferDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  loading?: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
}

function ActionButton({ label, onClick, loading, variant = 'ghost' }: ActionButtonProps) {
  const base =
    'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors';
  const classes =
    variant === 'primary'
      ? 'bg-blue-600 text-white hover:bg-blue-700'
      : variant === 'danger'
      ? 'bg-rose-600/10 text-rose-600 hover:bg-rose-600/20'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200';

  return (
    <button onClick={onClick} disabled={loading} className={`${base} ${classes}`}>
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
      {label}
    </button>
  );
}

interface CreateTransferDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function CreateTransferDrawer({ isOpen, onClose }: CreateTransferDrawerProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateStockTransferRequest>({
    fromStoreId: '',
    toStoreId: '',
    priority: 'normal',
    items: [],
    watcherEmails: [],
    reason: '',
    notes: '',
  });
  const [watcherInput, setWatcherInput] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState<
    Array<{ _id: string; name: string; sku?: string; unit?: string }>
  >([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setForm({
        fromStoreId: '',
        toStoreId: '',
        priority: 'normal',
        items: [],
        watcherEmails: [],
        reason: '',
        notes: '',
      });
      setWatcherInput('');
      setProductQuery('');
      setProductResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!productQuery || productQuery.length < 2) {
      setProductResults([]);
      return;
    }
    setIsSearchingProducts(true);
    const timeout = setTimeout(() => {
      productsService
        .search(productQuery)
        .then((results) => {
          setProductResults(results.slice(0, 6));
        })
        .catch(() => {
          setProductResults([]);
        })
        .finally(() => setIsSearchingProducts(false));
    }, 350);
    return () => clearTimeout(timeout);
  }, [productQuery]);

  const storesQuery = useQuery({
    queryKey: ['stores', 'select'],
    queryFn: () => settingsService.getStores(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateStockTransferRequest) =>
      stockTransfersService.create(payload),
    onSuccess: () => {
      toast.success('Stock transfer created');
      queryClient.invalidateQueries({ queryKey: ['stock-transfers'] });
      onClose();
    },
    onError: () => {
      toast.error('Unable to create stock transfer');
    },
  });

  const addWatcher = () => {
    if (!watcherInput.trim()) return;
    setForm((prev) => ({
      ...prev,
      watcherEmails: Array.from(
        new Set([...(prev.watcherEmails || []), watcherInput.trim().toLowerCase()])
      ),
    }));
    setWatcherInput('');
  };

  const removeWatcher = (email: string) => {
    setForm((prev) => ({
      ...prev,
      watcherEmails: prev.watcherEmails?.filter((item) => item !== email) || [],
    }));
  };

  const addItem = (product: { _id: string; name: string; sku?: string; unit?: string }) => {
    setForm((prev) => {
      if (prev.items.some((item) => item.productId === product._id)) {
        return prev;
      }
      return {
        ...prev,
        items: [
          ...prev.items,
          {
            productId: product._id,
            name: product.name,
            sku: product.sku,
            requestedQty: 1,
            uom: product.unit,
          },
        ],
      };
    });
    setProductQuery('');
    setProductResults([]);
  };

  const updateItemQty = (productId: string, qty: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.productId === productId ? { ...item, requestedQty: Math.max(1, qty) } : item
      ),
    }));
  };

  const removeItem = (productId: string) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.productId !== productId),
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.fromStoreId || !form.toStoreId) {
      toast.error('Please select both source and destination stores');
      return;
    }
    if (form.fromStoreId === form.toStoreId) {
      toast.error('Source and destination stores must be different');
      return;
    }
    if (!form.items.length) {
      toast.error('Add at least one product to transfer');
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
                Create transfer
              </p>
              <h2 className="text-xl font-semibold text-gray-900">New STR workflow</h2>
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
              <label className="text-sm font-medium text-gray-700">Source store</label>
              <select
                value={form.fromStoreId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, fromStoreId: event.target.value }))
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

            <div>
              <label className="text-sm font-medium text-gray-700">Destination store</label>
              <select
                value={form.toStoreId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, toStoreId: event.target.value }))
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Priority</label>
                <select
                  value={form.priority}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      priority: event.target.value as StockTransferPriority,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {priorityFilters
                    .filter((option) => option.id)
                    .map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Reason / campaign</label>
                <input
                  type="text"
                  value={form.reason}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, reason: event.target.value }))
                  }
                  placeholder="Restock, promotion, urgent coverage..."
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Watcher emails</label>
              <div className="flex gap-2 mt-2">
                <input
                  type="email"
                  value={watcherInput}
                  onChange={(event) => setWatcherInput(event.target.value)}
                  placeholder="ops@company.com"
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={addWatcher}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {form.watcherEmails?.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                  >
                    {email}
                    <button type="button" onClick={() => removeWatcher(email)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Transfer items</label>
                <span className="text-xs text-gray-500">
                  {form.items.length} selected
                </span>
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
                <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3 space-y-2 max-h-48 overflow-y-auto">
                  {isSearchingProducts ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Searching products...
                    </div>
                  ) : productResults.length === 0 ? (
                    <p className="text-sm text-gray-500">No products match that search.</p>
                  ) : (
                    productResults.map((product) => (
                      <button
                        type="button"
                        key={product._id}
                        onClick={() => addItem(product)}
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
                {form.items.map((item) => (
                  <div
                    key={item.productId}
                    className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.name || 'Product'}</p>
                      <p className="text-xs text-gray-500">{item.sku}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={item.requestedQty}
                        onChange={(event) =>
                          updateItemQty(item.productId, Number(event.target.value))
                        }
                        className="w-24 rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="rounded-full border border-gray-200 p-1 text-gray-500 hover:text-gray-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {!form.items.length && (
                  <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                    Search for products to add them to this transfer
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Notes to fulfillment</label>
              <textarea
                value={form.notes}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, notes: event.target.value }))
                }
                rows={3}
                placeholder="Special instructions, carrier preferences, etc."
                className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              STRs route through approvals before fulfillment begins.
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
                  <ShieldCheck className="w-4 h-4" />
                )}
                Create transfer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

