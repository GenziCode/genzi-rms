import { useEffect, useState } from 'react';
import { Plus, ShieldCheck, X } from 'lucide-react';
import type {
  CategoryPermissionsConfig,
  CategoryPermission,
} from '@/types/categoryAdvanced.types';

interface CategoryPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: CategoryPermissionsConfig;
  onSave: (value: CategoryPermissionsConfig) => void;
}

const defaultRoleOptions = ['Owner', 'Admin', 'Manager', 'Staff', 'Viewer'];

export default function CategoryPermissionsModal({
  isOpen,
  onClose,
  value,
  onSave,
}: CategoryPermissionsModalProps) {
  const [draft, setDraft] = useState<CategoryPermissionsConfig>(value);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDraft(value);
      setNewRole('');
    }
  }, [isOpen, value]);

  if (!isOpen) return null;

  const updateRole = (
    index: number,
    key: keyof CategoryPermission,
    checked: boolean
  ) => {
    setDraft((prev) => ({
      ...prev,
      roles: prev.roles.map((role, roleIndex) =>
        roleIndex === index ? { ...role, [key]: checked } : role
      ),
    }));
  };

  const handleAddRole = () => {
    const trimmed = newRole.trim();
    if (!trimmed) return;
    if (draft.roles.some((role) => role.role.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }
    setDraft((prev) => ({
      ...prev,
      roles: [
        ...prev.roles,
        { role: trimmed, view: true, edit: false, delete: false, manage: false },
      ],
    }));
    setNewRole('');
  };

  const handleRemoveRole = (roleName: string) => {
    setDraft((prev) => ({
      ...prev,
      roles: prev.roles.filter((role) => role.role !== roleName),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Category Permissions</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={draft.inheritParent}
                onChange={(event) =>
                  setDraft({ ...draft, inheritParent: event.target.checked })
                }
              />
              Inherit parent category permissions
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={draft.requireApprovalForDelete}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    requireApprovalForDelete: event.target.checked,
                  })
                }
              />
              Require approval for deletions
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={draft.allowBulkEdit}
                onChange={(event) =>
                  setDraft({ ...draft, allowBulkEdit: event.target.checked })
                }
              />
              Allow bulk edits
            </label>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Role</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-600">View</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-600">Edit</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-600">Delete</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-600">Manage</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {draft.roles.map((role, index) => (
                  <tr key={role.role}>
                    <td className="px-4 py-2 font-medium text-gray-900">{role.role}</td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={role.view}
                        onChange={(event) => updateRole(index, 'view', event.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={role.edit}
                        onChange={(event) => updateRole(index, 'edit', event.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={role.delete}
                        onChange={(event) => updateRole(index, 'delete', event.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={role.manage}
                        onChange={(event) => updateRole(index, 'manage', event.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      {defaultRoleOptions.includes(role.role) ? null : (
                        <button
                          onClick={() => handleRemoveRole(role.role)}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {defaultRoleOptions.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    if (draft.roles.some((item) => item.role === role)) return;
                    setDraft((prev) => ({
                      ...prev,
                      roles: [
                        ...prev.roles,
                        { role, view: true, edit: false, delete: false, manage: false },
                      ],
                    }));
                  }}
                  className="px-3 py-1.5 text-xs rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  + {role}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newRole}
                onChange={(event) => setNewRole(event.target.value)}
                placeholder="Custom role name"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={handleAddRole}
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Role
              </button>
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
