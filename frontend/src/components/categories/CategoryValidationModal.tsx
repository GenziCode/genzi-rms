import { useEffect, useState } from 'react';
import { CheckCircle, Plus, Trash2, X } from 'lucide-react';
import type {
  CategoryValidationConfig,
  CategoryCustomRule,
  CategoryValidationRule,
} from '@/types/categoryAdvanced.types';

interface CategoryValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: CategoryValidationConfig;
  onSave: (value: CategoryValidationConfig) => void;
}

export default function CategoryValidationModal({
  isOpen,
  onClose,
  value,
  onSave,
}: CategoryValidationModalProps) {
  const [draft, setDraft] = useState<CategoryValidationConfig>(value);
  const [customRuleDraft, setCustomRuleDraft] = useState({
    name: '',
    pattern: '',
    message: '',
  });

  useEffect(() => {
    if (isOpen) {
      setDraft(value);
      setCustomRuleDraft({ name: '', pattern: '', message: '' });
    }
  }, [isOpen, value]);

  if (!isOpen) return null;

  const updateRule = (
    ruleId: string,
    updates: Partial<CategoryValidationRule>
  ) => {
    setDraft((prev) => ({
      ...prev,
      rules: prev.rules.map((rule) =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      ),
    }));
  };

  const updateCustomRule = (
    ruleId: string,
    updates: Partial<CategoryCustomRule>
  ) => {
    setDraft((prev) => ({
      ...prev,
      customRules: prev.customRules.map((rule) =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      ),
    }));
  };

  const handleAddCustomRule = () => {
    if (!customRuleDraft.name.trim() || !customRuleDraft.pattern.trim()) {
      return;
    }
    const newRule: CategoryCustomRule = {
      id: `custom-${Date.now()}`,
      name: customRuleDraft.name.trim(),
      pattern: customRuleDraft.pattern.trim(),
      message: customRuleDraft.message.trim() || 'Validation failed.',
      enabled: true,
    };
    setDraft((prev) => ({
      ...prev,
      customRules: [...prev.customRules, newRule],
    }));
    setCustomRuleDraft({ name: '', pattern: '', message: '' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Category Validation Rules</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-6">
          <p className="text-gray-600">Set up validation rules for category data quality.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="text-sm text-gray-700">
              <span className="font-medium text-gray-900">Maximum depth</span>
              <input
                type="number"
                min={1}
                value={draft.maxDepth}
                onChange={(event) =>
                  setDraft({ ...draft, maxDepth: Number(event.target.value) || 1 })
                }
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </label>
            <label className="text-sm text-gray-700">
              <span className="font-medium text-gray-900">Max name length</span>
              <input
                type="number"
                min={10}
                value={draft.maxNameLength}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    maxNameLength: Number(event.target.value) || 10,
                  })
                }
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={draft.requireIcon}
                onChange={(event) =>
                  setDraft({ ...draft, requireIcon: event.target.checked })
                }
              />
              Require icon for top-level categories
            </label>
          </div>

          <div className="border rounded-lg">
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Standard rules</h3>
            </div>
            <div className="divide-y">
              {draft.rules.map((rule) => (
                <div key={rule.id} className="p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{rule.label}</p>
                      <p className="text-xs text-gray-500">{rule.description}</p>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={(event) =>
                          updateRule(rule.id, { enabled: event.target.checked })
                        }
                      />
                      Enabled
                    </label>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Severity</span>
                    <select
                      value={rule.severity}
                      onChange={(event) =>
                        updateRule(rule.id, {
                          severity: event.target.value as 'warning' | 'blocking',
                        })
                      }
                      className="px-2 py-1 border border-gray-200 rounded"
                    >
                      <option value="warning">Warning</option>
                      <option value="blocking">Blocking</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-900">Custom rules</h3>
              <span className="text-xs text-gray-500">
                {draft.customRules.length} rules
              </span>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={customRuleDraft.name}
                  onChange={(event) =>
                    setCustomRuleDraft({ ...customRuleDraft, name: event.target.value })
                  }
                  placeholder="Rule name"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="text"
                  value={customRuleDraft.pattern}
                  onChange={(event) =>
                    setCustomRuleDraft({
                      ...customRuleDraft,
                      pattern: event.target.value,
                    })
                  }
                  placeholder="Regex pattern"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="text"
                  value={customRuleDraft.message}
                  onChange={(event) =>
                    setCustomRuleDraft({
                      ...customRuleDraft,
                      message: event.target.value,
                    })
                  }
                  placeholder="Error message"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <button
                onClick={handleAddCustomRule}
                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm"
              >
                <Plus className="w-4 h-4" />
                Add custom rule
              </button>

              <div className="divide-y">
                {draft.customRules.map((rule) => (
                  <div key={rule.id} className="py-3 flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{rule.name}</p>
                        <p className="text-xs text-gray-500">{rule.pattern}</p>
                        <p className="text-xs text-gray-400">{rule.message}</p>
                      </div>
                      <button
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            customRules: prev.customRules.filter(
                              (item) => item.id !== rule.id
                            ),
                          }))
                        }
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={(event) =>
                          updateCustomRule(rule.id, { enabled: event.target.checked })
                        }
                      />
                      Enabled
                    </label>
                  </div>
                ))}
              </div>
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
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
