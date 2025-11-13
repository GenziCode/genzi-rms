import { X, Keyboard } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function KeyboardShortcutsHelp() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShow(true);
      }
      if (e.key === 'Escape') {
        setShow(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="fixed bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 z-40"
        title="Keyboard Shortcuts (Press ?)"
      >
        <Keyboard className="w-6 h-6" />
      </button>
    );
  }

  const shortcuts = [
    { key: 'F2', action: 'Focus search' },
    { key: 'F3', action: 'Select customer' },
    { key: 'F4', action: 'Apply discount' },
    { key: 'F8', action: 'Hold transaction' },
    { key: 'F9', action: 'Process payment' },
    { key: 'Ctrl+N', action: 'New sale' },
    { key: 'Ctrl+H', action: 'View held sales' },
    { key: 'Ctrl+R', action: 'Sale return' },
    { key: 'Esc', action: 'Clear cart' },
    { key: '?', action: 'Show this help' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Keyboard className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setShow(false)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm text-gray-700">{shortcut.action}</span>
                <kbd className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm font-mono font-semibold text-gray-900 shadow-sm">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Tip:</strong> Press <kbd className="px-2 py-1 bg-white rounded text-xs">?</kbd> anytime to view this help
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

