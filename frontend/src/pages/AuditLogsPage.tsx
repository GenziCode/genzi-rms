import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Shield, Download } from 'lucide-react';
import { auditService, type AuditLog } from '@/services/audit.service';
import AuditDetailModal from '@/components/audit/AuditDetailModal';
import toast from 'react-hot-toast';

export default function AuditLogsPage() {
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    userId: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 50,
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Fetch audit logs
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '')
      );
      return auditService.getAll(cleanFilters);
    },
  });

  const logs = data?.logs || [];
  const pagination = data?.pagination;

  const { data: statistics } = useQuery({
    queryKey: ['audit-logs-stats', filters.startDate, filters.endDate],
    queryFn: () =>
      auditService.getStatistics({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      }),
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: () => {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(
          ([key, v]) =>
            v !== '' &&
            ['startDate', 'endDate', 'userId', 'action', 'entityType'].includes(
              key
            )
        )
      );
      return auditService.exportLogs(cleanFilters);
    },
    onSuccess: () => {
      toast.success('Audit logs exported successfully!');
    },
    onError: () => {
      toast.error('Failed to export audit logs');
    },
  });

  const getActionBadge = (action: string) => {
    const styles: Record<string, string> = {
      create: 'bg-green-100 text-green-700',
      update: 'bg-blue-100 text-blue-700',
      delete: 'bg-red-100 text-red-700',
      login: 'bg-purple-100 text-purple-700',
      logout: 'bg-gray-100 text-gray-700',
      view: 'bg-teal-100 text-teal-700',
    };

    const style = styles[action.toLowerCase()] || 'bg-gray-100 text-gray-700';

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${style}`}>
        {action.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">Track all system activities</p>
        </div>
        <button
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          <Download className="w-5 h-5 mr-2" />
          {exportMutation.isPending ? 'Exporting...' : 'Export Logs'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <select
              value={filters.action}
              onChange={(e) =>
                setFilters({ ...filters, action: e.target.value, page: 1 })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
            </select>
          </div>
          <div>
            <select
              value={filters.entityType}
              onChange={(e) =>
                setFilters({ ...filters, entityType: e.target.value, page: 1 })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Entities</option>
              <option value="product">Products</option>
              <option value="sale">Sales</option>
              <option value="customer">Customers</option>
              <option value="user">Users</option>
              <option value="category">Categories</option>
            </select>
          </div>
          <div>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value, page: 1 })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Start Date"
            />
          </div>
          <div>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value, page: 1 })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="End Date"
            />
          </div>
          <div>
            <input
              type="text"
              value={filters.userId}
              onChange={(e) =>
                setFilters({ ...filters, userId: e.target.value, page: 1 })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="User ID"
            />
          </div>
          <div>
            <button
              onClick={() =>
                setFilters({
                  action: '',
                  entityType: '',
                  userId: '',
                  startDate: '',
                  endDate: '',
                  page: 1,
                  limit: 50,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Logs</p>
          <p className="text-2xl font-bold text-gray-900">
            {statistics?.totalLogs ?? logs.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Top Action</p>
          <p className="text-lg font-semibold text-blue-600">
            {statistics?.byAction?.[0]?.action?.toUpperCase() ?? '—'}
          </p>
          <p className="text-xs text-gray-500">
            {statistics?.byAction?.[0]?.count
              ? `${statistics.byAction[0].count} occurrence(s)`
              : 'No data yet'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Most Active Entity</p>
          <p className="text-lg font-semibold text-purple-600 capitalize">
            {statistics?.byEntityType?.[0]?.entityType ?? '—'}
          </p>
          <p className="text-xs text-gray-500">
            {statistics?.byEntityType?.[0]?.count
              ? `${statistics.byEntityType[0].count} record(s)`
              : 'No data yet'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Top User</p>
          <p className="text-lg font-semibold text-emerald-600">
            {statistics?.byUser?.[0]
              ? statistics.byUser[0].userName || statistics.byUser[0].userId
              : '—'}
          </p>
          <p className="text-xs text-gray-500">
            {statistics?.byUser?.[0]?.count
              ? `${statistics.byUser[0].count} action(s)`
              : 'No data yet'}
          </p>
        </div>
      </div>

      {/* Logs List */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading audit logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No audit logs found
          </h3>
          <p className="text-gray-600">
            Activities will appear here once users start interacting with the
            system
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getActionBadge(log.action)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {log.entityName || log.entityType}
                      </div>
                      <div className="text-gray-500 text-xs font-mono">
                        {log.entityId ? String(log.entityId).slice(-8) : '—'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {log.user
                      ? `${log.user.firstName ?? ''} ${log.user.lastName ?? ''}`.trim() ||
                        log.user.email ||
                        (log.user.id ? log.user.id.slice(-6) : 'System')
                      : log.userId
                        ? log.userId.slice(-6)
                        : 'System'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                    {log.ipAddress ?? '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Audit Detail Modal */}
      {selectedLog && (
        <AuditDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}
