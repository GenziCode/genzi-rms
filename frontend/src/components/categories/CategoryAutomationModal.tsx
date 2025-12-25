import { useEffect, useState } from 'react';
import { Plus, Settings, Trash2, X, Zap } from 'lucide-react';
import type {
  CategoryAutomationAction,
  CategoryAutomationConfig,
  CategoryAutomationRule,
  CategoryAutomationTrigger,
} from '@/types/categoryAdvanced.types';

interface CategoryAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: CategoryAutomationConfig;
  onSave: (value: CategoryAutomationConfig) => void;
}

const triggerOptions: Array<{ value: CategoryAutomationTrigger; label: string }> = [
  { value: 'on_create', label: 'On category created' },
  { value: 'on_update', label: 'On category updated' },
  { value: 'on_delete', label: 'On category deleted' },
  { value: 'on_inactive', label: 'On category inactive' },
  { value: 'on_low_stock', label: 'On low stock' },
];

const actionOptions: Array<{ value: CategoryAutomationAction; label: string }> = [
  { value: 'notify', label: 'Send notification' },
  { value: 'assign', label: 'Assign review' },
  { value: 'archive', label: 'Archive category' },
  { value: 'tag', label: 'Apply tag' },
  { value: 'approve', label: 'Auto approve' },
];

export default function CategoryAutomationModal({
  isOpen,
  onClose,
  value,
  onSave,
}: CategoryAutomationModalProps) {
  const [draft, setDraft] = useState<CategoryAutomationConfig>(value);
  const [newRule, setNewRule] = useState<{
    name: string;
    trigger: CategoryAutomationTrigger;
    action: CategoryAutomationAction;
  }>({
    name: '',
    trigger: 'on_create',
    action: 'notify',
  });

  useEffect(() => {
    if (isOpen) {
      setDraft(value);
      setNewRule({ name: '', trigger: 'on_create', action: 'notify' });
    }
  }, [isOpen, value]);

  if (!isOpen) return null;

  const handleAddRule = () => {
    if (!newRule.name.trim()) return;
    const rule: CategoryAutomationRule = {
      id: `auto-${Date.now()}`,
      name: newRule.name.trim(),
      trigger: newRule.trigger,
      action: newRule.action,
      enabled: true,
    };
    setDraft((prev) => ({ ...prev, rules: [...prev.rules, rule] }));
    setNewRule({ name: '', trigger: 'on_create', action: 'notify' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Category Automation Rules</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-6">
          <p className="text-gray-600">Create automated workflows and rules for category management.</p>

          <div className="border rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                value={newRule.name}
                onChange={(event) =>
                  setNewRule((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Rule name"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <select
                value={newRule.trigger}
                onChange={(event) =>
                  setNewRule((prev) => ({
                    ...prev,
                    trigger: event.target.value as CategoryAutomationTrigger,
                  }))
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {triggerOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={newRule.action}
                onChange={(event) =>
                  setNewRule((prev) => ({
                    ...prev,
                    action: event.target.value as CategoryAutomationAction,
                  }))
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {actionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddRule}
              className="inline-flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg text-sm"
            >
              <Plus className="w-4 h-4" />
              Add rule
            </button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50">
              <Settings className="w-4 h-4 text-orange-600" />
              <h3 className="font-semibold text-gray-900">Active automation rules</h3>
            </div>
            <div className="divide-y">
              {draft.rules.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">
                  No automation rules configured yet.
                </div>
              ) : (
                draft.rules.map((rule) => (
                  <div key={rule.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{rule.name}</p>
                      <p className="text-xs text-gray-500">
                        {triggerOptions.find((option) => option.value === rule.trigger)?.label}
                        {' '} • {' '}
                        {actionOptions.find((option) => option.value === rule.action)?.label}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={(event) =>
                            setDraft((prev) => ({
                              ...prev,
                              rules: prev.rules.map((item) =>
                                item.id === rule.id
                                  ? { ...item, enabled: event.target.checked }
                                  : item
                              ),
                            }))
                          }
                        />
                        Enabled
                      </label>
                      <button
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            rules: prev.rules.filter((item) => item.id !== rule.id),
                          }))
                        }
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
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
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
