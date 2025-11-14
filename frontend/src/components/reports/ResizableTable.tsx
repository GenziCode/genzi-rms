import { useState, useRef, useEffect, useCallback } from 'react';
import { GripVertical, Maximize2, Minimize2, Settings2, Filter, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Column {
  id: string;
  label: string;
  accessor: string | ((row: any) => any);
  visible: boolean;
  sortable?: boolean;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  format?: (value: any) => string;
  align?: 'left' | 'center' | 'right';
}

interface ResizableTableProps {
  data: Array<Record<string, any>>;
  columns: Column[];
  onColumnsChange?: (columns: Column[]) => void;
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void;
  loading?: boolean;
  title?: string;
  height?: number;
  stickyHeader?: boolean;
}

export default function ResizableTable({
  data,
  columns: initialColumns,
  onColumnsChange,
  onExport,
  loading = false,
  title,
  height = 600,
  stickyHeader = true,
}: ResizableTableProps) {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [resizingColumnId, setResizingColumnId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const handleMouseDown = (e: React.MouseEvent, columnId: string) => {
    e.preventDefault();
    setResizingColumnId(columnId);
    startXRef.current = e.clientX;
    const column = columns.find((col) => col.id === columnId);
    if (column) {
      startWidthRef.current = column.width;
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!resizingColumnId) return;

      const diff = e.clientX - startXRef.current;
      const newWidth = Math.max(
        columns.find((col) => col.id === resizingColumnId)?.minWidth || 50,
        Math.min(
          columns.find((col) => col.id === resizingColumnId)?.maxWidth || 1000,
          startWidthRef.current + diff
        )
      );

      const newColumns = columns.map((col) =>
        col.id === resizingColumnId ? { ...col, width: newWidth } : col
      );

      setColumns(newColumns);
      onColumnsChange?.(newColumns);
    },
    [resizingColumnId, columns, onColumnsChange]
  );

  const handleMouseUp = useCallback(() => {
    setResizingColumnId(null);
  }, []);

  useEffect(() => {
    if (resizingColumnId) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [resizingColumnId, handleMouseMove, handleMouseUp]);

  const handleSort = (columnId: string) => {
    setSortConfig((current) => {
      if (current?.key === columnId) {
        return {
          key: columnId,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key: columnId, direction: 'asc' };
    });
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig) return 0;

    const column = columns.find((col) => col.id === sortConfig.key);
    if (!column) return 0;

    const getValue = (row: any) => {
      if (typeof column.accessor === 'function') {
        return column.accessor(row);
      }
      return row[column.accessor];
    };

    const aVal = getValue(a);
    const bVal = getValue(b);

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const visibleColumns = columns.filter((col) => col.visible);
  const totalWidth = visibleColumns.reduce((sum, col) => sum + col.width, 0);

  const getCellValue = (row: any, column: Column) => {
    let value: any;
    if (typeof column.accessor === 'function') {
      value = column.accessor(row);
    } else {
      value = row[column.accessor];
    }

    if (column.format) {
      return column.format(value);
    }

    if (typeof value === 'number' && column.id.toLowerCase().includes('price')) {
      return formatCurrency(value);
    }

    return value ?? '-';
  };

  return (
    <div
      ref={tableRef}
      className={`
        bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden
        ${isFullscreen ? 'fixed inset-4 z-50' : 'relative'}
        transition-all duration-300
      `}
    >
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700">
        <div className="flex items-center justify-between">
          {title && (
            <h3 className="text-xl font-bold text-white">{title}</h3>
          )}
          <div className="flex items-center gap-2">
            {onExport && (
              <>
                <button
                  onClick={() => onExport('csv')}
                  className="px-3 py-1.5 text-sm text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
                <button
                  onClick={() => onExport('excel')}
                  className="px-3 py-1.5 text-sm text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </button>
                <button
                  onClick={() => onExport('pdf')}
                  className="px-3 py-1.5 text-sm text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
              </>
            )}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div
        className="overflow-auto bg-white"
        style={{ height: isFullscreen ? 'calc(100vh - 120px)' : `${height}px` }}
      >
        <table
          className="w-full border-collapse"
          style={{ minWidth: totalWidth }}
        >
          <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300">
              {visibleColumns.map((column, index) => (
                <th
                  key={column.id}
                  className="relative px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                  style={{
                    width: column.width,
                    minWidth: column.minWidth || 50,
                    maxWidth: column.maxWidth || 1000,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex-1 ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''}`}
                    >
                      {column.label}
                    </div>
                    {column.sortable && (
                      <button
                        onClick={() => handleSort(column.id)}
                        className="ml-2 p-1 hover:bg-gray-200 rounded"
                      >
                        <GripVertical className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                  {index < visibleColumns.length - 1 && (
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent transition-colors"
                      onMouseDown={(e) => handleMouseDown(e, column.id)}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                  </div>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No data available
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-blue-50 transition-colors border-b border-gray-100"
                >
                  {visibleColumns.map((column) => (
                    <td
                      key={column.id}
                      className={`px-4 py-3 text-sm text-gray-900 border-r border-gray-100 last:border-r-0 ${
                        column.align === 'right'
                          ? 'text-right'
                          : column.align === 'center'
                            ? 'text-center'
                            : ''
                      }`}
                      style={{
                        width: column.width,
                        minWidth: column.minWidth || 50,
                        maxWidth: column.maxWidth || 1000,
                      }}
                    >
                      {getCellValue(row, column)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {sortedData.length} of {data.length} rows
          </span>
          <div className="flex items-center gap-4">
            <span>Total Width: {Math.round(totalWidth)}px</span>
          </div>
        </div>
      </div>
    </div>
  );
}

