import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  useSortable,
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Eye,
  EyeOff,
  Filter,
  ArrowUpDown,
  Download,
  Settings,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Column {
  id: string;
  label: string;
  accessor: string | ((row: any) => any);
  visible: boolean;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  format?: (value: any) => string;
}

interface CustomizableTableProps {
  data: Array<Record<string, any>>;
  columns: Column[];
  onColumnsChange?: (columns: Column[]) => void;
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void;
  loading?: boolean;
  title?: string;
}

function SortableColumnHeader({
  column,
  onToggleVisibility,
  onSort,
}: {
  column: Column;
  onToggleVisibility: (id: string) => void;
  onSort?: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200"
    >
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="flex-1">{column.label}</span>
        <div className="flex items-center gap-1">
          {column.sortable && (
            <button
              onClick={() => onSort?.(column.id)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Sort"
            >
              <ArrowUpDown className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => onToggleVisibility(column.id)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title={column.visible ? 'Hide column' : 'Show column'}
          >
            {column.visible ? (
              <Eye className="w-3 h-3" />
            ) : (
              <EyeOff className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>
    </th>
  );
}

export default function CustomizableTable({
  data,
  columns: initialColumns,
  onColumnsChange,
  onExport,
  loading = false,
  title,
}: CustomizableTableProps) {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [filterConfig, setFilterConfig] = useState<Record<string, string>>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const visibleColumns = useMemo(
    () => columns.filter((col) => col.visible),
    [columns]
  );

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
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
  }, [data, sortConfig, columns]);

  const filteredData = useMemo(() => {
    if (Object.keys(filterConfig).length === 0) return sortedData;

    return sortedData.filter((row) => {
      return Object.entries(filterConfig).every(([key, value]) => {
        if (!value) return true;
        const column = columns.find((col) => col.id === key);
        if (!column) return true;

        const rowValue =
          typeof column.accessor === 'function'
            ? column.accessor(row)
            : row[column.accessor];

        return String(rowValue)
          .toLowerCase()
          .includes(value.toLowerCase());
      });
    });
  }, [sortedData, filterConfig, columns]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = columns.findIndex((col) => col.id === active.id);
      const newIndex = columns.findIndex((col) => col.id === over.id);

      const newColumns = arrayMove(columns, oldIndex, newIndex);
      setColumns(newColumns);
      onColumnsChange?.(newColumns);
    }
  };

  const handleToggleVisibility = (columnId: string) => {
    const newColumns = columns.map((col) =>
      col.id === columnId ? { ...col, visible: !col.visible } : col
    );
    setColumns(newColumns);
    onColumnsChange?.(newColumns);
  };

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      {(title || onExport) && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            )}
            {onExport && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onExport('csv')}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  CSV
                </button>
                <button
                  onClick={() => onExport('excel')}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Excel
                </button>
                <button
                  onClick={() => onExport('pdf')}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  PDF
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <SortableContext
                  items={columns.map((col) => col.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  {columns.map((column) => (
                    <SortableColumnHeader
                      key={column.id}
                      column={column}
                      onToggleVisibility={handleToggleVisibility}
                      onSort={column.sortable ? handleSort : undefined}
                    />
                  ))}
                </SortableContext>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No data available
                  </td>
                </tr>
              ) : (
                filteredData.map((row, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        style={{ width: column.width }}
                      >
                        {getCellValue(row, column)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DndContext>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredData.length} of {data.length} rows
          </span>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
              <Settings className="w-4 h-4" />
              Column Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

