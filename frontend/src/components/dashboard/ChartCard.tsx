import { ReactNode } from 'react';
import { MoreVertical, Download, Maximize2 } from 'lucide-react';
import { useState } from 'react';

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  onExport?: () => void;
  onFullscreen?: () => void;
  className?: string;
  loading?: boolean;
}

export default function ChartCard({
  title,
  description,
  children,
  actions,
  onExport,
  onFullscreen,
  className = '',
  loading = false,
}: ChartCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            {onFullscreen && (
              <button
                onClick={onFullscreen}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
            {(onExport || onFullscreen) && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                      {onExport && (
                        <button
                          onClick={() => {
                            onExport();
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Export Chart
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

