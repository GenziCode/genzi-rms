import { useState } from 'react';
import {
  Plus,
  Trash2,
  Save,
  Eye,
  Settings,
  Layout,
  FileText,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart,
  Table,
  Image,
  Type,
  Calendar,
  Filter,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

interface ReportElement {
  id: string;
  type: 'text' | 'chart' | 'table' | 'image' | 'kpi';
  config: Record<string, any>;
  position: { x: number; y: number; w: number; h: number };
}

export default function ReportBuilder() {
  const [reportName, setReportName] = useState('');
  const [elements, setElements] = useState<ReportElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const addElement = (type: ReportElement['type']) => {
    const newElement: ReportElement = {
      id: `element-${Date.now()}`,
      type,
      config: getDefaultConfig(type),
      position: { x: 0, y: elements.length * 100, w: 400, h: 300 },
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} element added`);
  };

  const getDefaultConfig = (type: ReportElement['type']): Record<string, any> => {
    switch (type) {
      case 'text':
        return { content: 'New Text Element', fontSize: 16, fontWeight: 'normal' };
      case 'chart':
        return { chartType: 'bar', dataSource: '', title: 'New Chart' };
      case 'table':
        return { dataSource: '', columns: [] };
      case 'image':
        return { url: '', alt: 'Image' };
      case 'kpi':
        return { title: 'New KPI', value: '0', metric: '' };
      default:
        return {};
    }
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter((el) => el.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
    toast.success('Element deleted');
  };

  const updateElement = (id: string, updates: Partial<ReportElement>) => {
    setElements(
      elements.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const saveReport = () => {
    if (!reportName.trim()) {
      toast.error('Please enter a report name');
      return;
    }
    // Save logic here
    toast.success('Report saved successfully');
  };

  const getElementIcon = (type: ReportElement['type']) => {
    switch (type) {
      case 'text':
        return <Type className="w-5 h-5" />;
      case 'chart':
        return <BarChart3 className="w-5 h-5" />;
      case 'table':
        return <Table className="w-5 h-5" />;
      case 'image':
        return <Image className="w-5 h-5" />;
      case 'kpi':
        return <BarChart3 className="w-5 h-5" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Layout className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <input
                type="text"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Enter report name..."
                className="text-2xl font-bold text-gray-900 border-none outline-none bg-transparent"
              />
              <p className="text-sm text-gray-500">Report Builder</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {previewMode ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={saveReport}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Report
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Element Palette */}
        {!previewMode && (
          <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Add Elements</h3>
            <div className="space-y-2">
              {[
                { type: 'text' as const, label: 'Text', icon: Type },
                { type: 'chart' as const, label: 'Chart', icon: BarChart3 },
                { type: 'table' as const, label: 'Table', icon: Table },
                { type: 'kpi' as const, label: 'KPI Widget', icon: BarChart3 },
                { type: 'image' as const, label: 'Image', icon: Image },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    onClick={() => addElement(item.type)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Element List */}
            {elements.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Elements</h3>
                <div className="space-y-2">
                  {elements.map((element) => (
                    <div
                      key={element.id}
                      onClick={() => setSelectedElement(element.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        selectedElement === element.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {getElementIcon(element.type)}
                        <span className="text-sm font-medium capitalize">{element.type}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteElement(element.id);
                        }}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-gray-100 p-6">
          <div className="bg-white rounded-xl shadow-lg min-h-full p-8" style={{ width: '210mm', margin: '0 auto' }}>
            {elements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[600px] text-gray-400">
                <Layout className="w-16 h-16 mb-4" />
                <p className="text-lg font-medium mb-2">Start Building Your Report</p>
                <p className="text-sm">Add elements from the sidebar to begin</p>
              </div>
            ) : (
              <div className="relative">
                {elements.map((element) => (
                  <div
                    key={element.id}
                    onClick={() => setSelectedElement(element.id)}
                    className={`absolute border-2 rounded-lg p-4 ${
                      selectedElement === element.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-white'
                    }`}
                    style={{
                      left: element.position.x,
                      top: element.position.y,
                      width: element.position.w,
                      height: element.position.h,
                    }}
                  >
                    {element.type === 'text' && (
                      <div className="text-gray-900">{element.config.content}</div>
                    )}
                    {element.type === 'chart' && (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <BarChart3 className="w-12 h-12" />
                        <span className="ml-2">{element.config.title}</span>
                      </div>
                    )}
                    {element.type === 'table' && (
                      <div className="text-gray-500">Table Preview</div>
                    )}
                    {element.type === 'kpi' && (
                      <div>
                        <div className="text-sm text-gray-600">{element.config.title}</div>
                        <div className="text-2xl font-bold text-gray-900">{element.config.value}</div>
                      </div>
                    )}
                    {element.type === 'image' && (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <Image className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Properties Panel */}
        {!previewMode && selectedElement && (
          <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Properties</h3>
            <div className="space-y-4">
              {(() => {
                const element = elements.find((el) => el.id === selectedElement);
                if (!element) return null;

                return (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Position X
                      </label>
                      <input
                        type="number"
                        value={element.position.x}
                        onChange={(e) =>
                          updateElement(element.id, {
                            position: { ...element.position, x: parseInt(e.target.value) || 0 },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Position Y
                      </label>
                      <input
                        type="number"
                        value={element.position.y}
                        onChange={(e) =>
                          updateElement(element.id, {
                            position: { ...element.position, y: parseInt(e.target.value) || 0 },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Width
                      </label>
                      <input
                        type="number"
                        value={element.position.w}
                        onChange={(e) =>
                          updateElement(element.id, {
                            position: { ...element.position, w: parseInt(e.target.value) || 100 },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Height
                      </label>
                      <input
                        type="number"
                        value={element.position.h}
                        onChange={(e) =>
                          updateElement(element.id, {
                            position: { ...element.position, h: parseInt(e.target.value) || 100 },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    {/* Type-specific config */}
                    {element.type === 'text' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Content
                        </label>
                        <textarea
                          value={element.config.content}
                          onChange={(e) =>
                            updateElement(element.id, {
                              config: { ...element.config, content: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          rows={3}
                        />
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

