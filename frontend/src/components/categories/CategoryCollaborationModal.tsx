import { useEffect, useState } from 'react';
import { Bell, Plus, Trash2, Users, X } from 'lucide-react';
import type { CategoryCollaborationConfig } from '@/types/categoryAdvanced.types';

interface CategoryCollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: CategoryCollaborationConfig;
  onSave: (value: CategoryCollaborationConfig) => void;
}

export default function CategoryCollaborationModal({
  isOpen,
  onClose,
  value,
  onSave,
}: CategoryCollaborationModalProps) {
  const [draft, setDraft] = useState<CategoryCollaborationConfig>(value);
  const [newWatcher, setNewWatcher] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDraft(value);
      setNewWatcher('');
    }
  }, [isOpen, value]);

  if (!isOpen) return null;

  const handleAddWatcher = () => {
    const trimmed = newWatcher.trim();
    if (!trimmed) return;
    if (draft.defaultWatchers.includes(trimmed)) return;
    setDraft((prev) => ({
      ...prev,
      defaultWatchers: [...prev.defaultWatchers, trimmed],
    }));
    setNewWatcher('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Category Collaboration</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-6">
          <p className="text-gray-600">Configure team collaboration features and workflows.</p>

          <div className="grid gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={draft.requireReviewForChanges}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    requireReviewForChanges: event.target.checked,
                  })
                }
              />
              Require peer review before publishing changes
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={draft.autoNotifyWatchers}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    autoNotifyWatchers: event.target.checked,
                  })
                }
              />
              Notify watchers on every update
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={draft.commentRequiredOnDelete}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    commentRequiredOnDelete: event.target.checked,
                  })
                }
              />
              Require a comment when deleting categories
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={draft.mentionsEnabled}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    mentionsEnabled: event.target.checked,
                  })
                }
              />
              Enable @mentions in category comments
            </label>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <Bell className="w-4 h-4 text-purple-600" />
              Default watchers
            </div>
            <div className="flex flex-col md:flex-row gap-2">
              <input
                type="email"
                value={newWatcher}
                onChange={(event) => setNewWatcher(event.target.value)}
                placeholder="Add teammate email"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={handleAddWatcher}
                className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm"
              >
                <Plus className="w-4 h-4" />
                Add watcher
              </button>
            </div>
            <div className="space-y-2">
              {draft.defaultWatchers.length === 0 ? (
                <p className="text-xs text-gray-500">No watchers added yet.</p>
              ) : (
                draft.defaultWatchers.map((watcher) => (
                  <div
                    key={watcher}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm text-gray-700">{watcher}</span>
                    <button
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          defaultWatchers: prev.defaultWatchers.filter(
                            (item) => item !== watcher
                          ),
                        }))
                      }
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
