import { X, User, Clock, MapPin, Monitor, FileDiff } from 'lucide-react';
import type { AuditLog } from '@/services/audit.service';

interface AuditDetailModalProps {
  log: AuditLog;
  onClose: () => void;
}

const renderValue = (value: any): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

const formatField = (field: string) => field.replace(/\./g, ' ').replace(/\[(\d+)\]/g, ' [$1]');

export default function AuditDetailModal({ log, onClose }: AuditDetailModalProps) {
  const userLabel = log.user
    ? `${log.user.firstName ?? ''} ${log.user.lastName ?? ''}`.trim() ||
      log.user.email ||
      log.user.id
    : log.userId;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Audit Log Details</h2>
            <p className="text-sm text-gray-500">
              {log.entityName || log.entityType} ·{' '}
              {new Date(log.timestamp).toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Action
              </label>
              <p className="text-lg font-semibold text-gray-900 capitalize">{log.action}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Entity
              </label>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {log.entityName || log.entityType}
              </p>
              {log.entityId && (
                <p className="text-xs font-mono text-gray-500 mt-1">{String(log.entityId)}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                User
              </label>
              <p className="text-sm text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                {userLabel ?? 'System'}
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Timestamp
              </label>
              <p className="text-sm text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                {new Date(log.timestamp).toLocaleString()}
              </p>
            </div>
          </div>

          {/* System Info */}
          {(log.ipAddress || log.userAgent) && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Metadata</h3>
              <div className="space-y-3 text-sm">
                {log.ipAddress && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">IP Address:</span>
                    <span className="font-mono text-gray-900">{log.ipAddress}</span>
                  </div>
                )}
                {log.userAgent && (
                  <div className="flex items-start gap-2">
                    <Monitor className="w-4 h-4 text-gray-400 mt-1" />
                    <span className="text-gray-600 min-w-[88px]">User Agent:</span>
                    <span className="text-gray-900 flex-1">{log.userAgent}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Changes */}
          {Array.isArray(log.changes) && log.changes.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileDiff className="w-5 h-5 text-blue-600" />
                Field Changes
              </h3>
              <div className="space-y-4">
                {log.changes.map((change) => (
                  <div key={change.field} className="border border-gray-200 rounded-lg p-4">
                    <div className="font-medium text-gray-900 mb-3 capitalize">
                      {formatField(change.field)}
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-xs uppercase text-gray-500 mb-1">Before</div>
                        <pre className="bg-red-50 text-red-900 p-3 rounded font-mono text-xs whitespace-pre-wrap">
                          {renderValue(change.oldValue)}
                        </pre>
                      </div>
                      <div>
                        <div className="text-xs uppercase text-gray-500 mb-1">After</div>
                        <pre className="bg-green-50 text-green-900 p-3 rounded font-mono text-xs whitespace-pre-wrap">
                          {renderValue(change.newValue)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Snapshots */}
          {(log.snapshotBefore || log.snapshotAfter) && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Snapshots</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {log.snapshotBefore && (
                  <div>
                    <div className="text-xs uppercase text-gray-500 mb-1">Snapshot Before</div>
                    <pre className="bg-gray-50 p-4 rounded-lg font-mono overflow-x-auto max-h-64">
                      {JSON.stringify(log.snapshotBefore, null, 2)}
                    </pre>
                  </div>
                )}
                {log.snapshotAfter && (
                  <div>
                    <div className="text-xs uppercase text-gray-500 mb-1">Snapshot After</div>
                    <pre className="bg-gray-50 p-4 rounded-lg font-mono overflow-x-auto max-h-64">
                      {JSON.stringify(log.snapshotAfter, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Additional Metadata
              </h3>
              <pre className="bg-gray-50 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
