import { useEffect, useState } from 'react';
import { Lock, ShieldAlert, X } from 'lucide-react';
import type { CategorySecurityConfig } from '@/types/categoryAdvanced.types';

interface CategorySecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: CategorySecurityConfig;
  onSave: (value: CategorySecurityConfig) => void;
}

export default function CategorySecurityModal({
  isOpen,
  onClose,
  value,
  onSave,
}: CategorySecurityModalProps) {
  const [draft, setDraft] = useState<CategorySecurityConfig>(value);

  useEffect(() => {
    if (isOpen) {
      setDraft(value);
    }
  }, [isOpen, value]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900">Category Security</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4">
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={draft.auditLogging}
                onChange={(event) =>
                  setDraft({ ...draft, auditLogging: event.target.checked })
                }
              />
              <span>
                <span className="font-medium text-gray-900">Audit logging</span>
                <p className="text-xs text-gray-500">Track all category changes and access.</p>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={draft.requireMfaForDelete}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    requireMfaForDelete: event.target.checked,
                  })
                }
              />
              <span>
                <span className="font-medium text-gray-900">Require MFA for deletes</span>
                <p className="text-xs text-gray-500">Extra verification for destructive actions.</p>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={draft.lockHierarchy}
                onChange={(event) =>
                  setDraft({ ...draft, lockHierarchy: event.target.checked })
                }
              />
              <span>
                <span className="font-medium text-gray-900">Lock hierarchy changes</span>
                <p className="text-xs text-gray-500">Prevent moving categories without approval.</p>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={draft.preventDeleteWithProducts}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    preventDeleteWithProducts: event.target.checked,
                  })
                }
              />
              <span>
                <span className="font-medium text-gray-900">Prevent delete with products</span>
                <p className="text-xs text-gray-500">Require reassignment before deletion.</p>
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm text-gray-700">
              <span className="font-medium text-gray-900">Audit retention (days)</span>
              <input
                type="number"
                min={30}
                value={draft.retentionDays}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    retentionDays: Number(event.target.value) || 0,
                  })
                }
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </label>
            <label className="text-sm text-gray-700">
              <span className="font-medium text-gray-900">Change approval window (hours)</span>
              <input
                type="number"
                min={1}
                value={draft.changeWindowHours}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    changeWindowHours: Number(event.target.value) || 0,
                  })
                }
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </label>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <ShieldAlert className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-medium">High impact settings</p>
              <p className="text-xs text-red-600">
                Updates apply immediately to all category operations and audit events.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(draft)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
