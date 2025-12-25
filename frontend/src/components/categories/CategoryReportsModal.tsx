import { useState, useEffect } from 'react';
import { X, BarChart3, TrendingUp, FileText, Download, PieChart, Table } from 'lucide-react';
import type { Category } from '@/types/products.types';

interface CategoryReport {
  totalCategories: number;
  activeCategories: number;
  inactiveCategories: number;
  categoriesByStatus: {
    active: number;
    inactive: number;
  };
  categoriesByColor: Array<{
    color: string;
    count: number;
  }>;
  categoriesByParent: Array<{
    parentName: string;
    parentId: string;
    childCount: number;
  }>;
  categoryGrowth: Array<{
    month: string;
    year: number;
    newCategories: number;
  }>;
  topLevelCategories: number;
  categoriesWithProducts: number;
 categoriesWithoutProducts: number;
}

interface CategoryUsageReport {
  categoryId: string;
  categoryName: string;
 productCount: number;
  totalSales: number;
  totalQuantitySold: number;
  averageOrderValue: number;
  lastUsed: Date;
}

interface CategoryPerformanceReport {
  categoryId: string;
  categoryName: string;
 color: string;
  icon: string;
  productCount: number;
  revenue: number;
  revenuePercentage: number;
  quantitySold: number;
  profit: number;
  profitMargin: number;
  growthRate: number;
}

interface CategoryReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CategoryReportsModal: React.FC<CategoryReportsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'performance' | 'hierarchy'>('overview');
  const [reportType, setReportType] = useState<'comprehensive' | 'usage' | 'performance' | 'hierarchy'>('comprehensive');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data - in a real app, this would come from API calls
  useEffect(() => {
    if (isOpen && !reportData) {
      generateMockReport();
    }
  }, [isOpen, reportData]);

  const generateMockReport = () => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const mockReport: CategoryReport = {
        totalCategories: 24,
        activeCategories: 20,
        inactiveCategories: 4,
        categoriesByStatus: {
          active: 20,
          inactive: 4
        },
        categoriesByColor: [
          { color: '#3B82F6', count: 8 },
          { color: '#EF4444', count: 5 },
          { color: '#10B981', count: 4 },
          { color: '#F59E0B', count: 3 },
          { color: '#8B5CF6', count: 4 }
        ],
        categoriesByParent: [
          { parentName: 'Electronics', parentId: '1', childCount: 5 },
          { parentName: 'Clothing', parentId: '2', childCount: 3 },
          { parentName: 'Home & Garden', parentId: '3', childCount: 4 }
        ],
        categoryGrowth: [
          { month: 'Jan', year: 2023, newCategories: 2 },
          { month: 'Feb', year: 2023, newCategories: 1 },
          { month: 'Mar', year: 2023, newCategories: 3 },
          { month: 'Apr', year: 2023, newCategories: 2 },
          { month: 'May', year: 2023, newCategories: 4 },
          { month: 'Jun', year: 2023, newCategories: 3 }
        ],
        topLevelCategories: 8,
        categoriesWithProducts: 18,
        categoriesWithoutProducts: 6
      };
      
      setReportData(mockReport);
      setLoading(false);
    }, 500);
  };

  const handleExport = (format: 'csv' | 'pdf' | 'json') => {
    // In a real app, this would trigger an API call to export the report
    console.log(`Exporting report in ${format} format`);
    alert(`Exporting report in ${format.toUpperCase()} format...`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="w-6 h-6 mr-2" />
              Category Reports
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-70"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Report Type Selector */}
          <div className="mb-6">
            <div className="flex space-x-4">
              <button
                className={`px-4 py-2 rounded-lg flex items-center ${
                  reportType === 'comprehensive'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => {
                  setReportType('comprehensive');
                  setReportData(null);
                  generateMockReport();
                }}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Comprehensive
              </button>
              <button
                className={`px-4 py-2 rounded-lg flex items-center ${
                  reportType === 'usage'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => {
                  setReportType('usage');
                  setReportData(null);
                  generateMockReport();
                }}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Usage
              </button>
              <button
                className={`px-4 py-2 rounded-lg flex items-center ${
                  reportType === 'performance'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => {
                  setReportType('performance');
                  setReportData(null);
                  generateMockReport();
                }}
              >
                <PieChart className="w-4 h-4 mr-2" />
                Performance
              </button>
              <button
                className={`px-4 py-2 rounded-lg flex items-center ${
                  reportType === 'hierarchy'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => {
                  setReportType('hierarchy');
                  setReportData(null);
                  generateMockReport();
                }}
              >
                <Table className="w-4 h-4 mr-2" />
                Hierarchy
              </button>
            </div>
          </div>

          {/* Export Controls */}
          <div className="flex justify-end mb-4 space-x-2">
            <button
              onClick={() => handleExport('csv')}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center text-sm"
            >
              <Download className="w-4 h-4 mr-1" />
              CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="px-3 py-1 bg-red-60 text-white rounded hover:bg-red-700 flex items-center text-sm"
            >
              <Download className="w-4 h-4 mr-1" />
              PDF
            </button>
            <button
              onClick={() => handleExport('json')}
              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center text-sm"
            >
              <Download className="w-4 h-4 mr-1" />
              JSON
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Report Content */}
          {!loading && !error && reportData && (
            <div className="space-y-6">
              {/* Overview Tab */}
              {reportType === 'comprehensive' && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-80">{reportData.totalCategories}</div>
                      <div className="text-sm text-blue-600">Total Categories</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-800">{reportData.activeCategories}</div>
                      <div className="text-sm text-green-60">Active Categories</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-800">{reportData.categoriesWithProducts}</div>
                      <div className="text-sm text-yellow-600">With Products</div>
                    </div>
                  </div>

                  {/* Categories by Status */}
                  <div className="bg-white p-4 rounded-lg border">
                    <h3 className="font-medium text-gray-900 mb-3">Categories by Status</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-green-600 h-2.5 rounded-full" 
                            style={{ width: `${(reportData.categoriesByStatus.active / reportData.totalCategories) * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-sm">
                          Active: {reportData.categoriesByStatus.active} | Inactive: {reportData.categoriesByStatus.inactive}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Categories by Color */}
                  <div className="bg-white p-4 rounded-lg border">
                    <h3 className="font-medium text-gray-900 mb-3">Categories by Color</h3>
                    <div className="flex flex-wrap gap-2">
                      {reportData.categoriesByColor.map((item: any, index: number) => (
                        <div key={index} className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded mr-2" 
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className="text-sm">{item.color}: {item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category Growth */}
                  <div className="bg-white p-4 rounded-lg border">
                    <h3 className="font-medium text-gray-900 mb-3">Category Growth</h3>
                    <div className="h-64">
                      <div className="flex items-end h-56 space-x-1">
                        {reportData.categoryGrowth.map((month: any, index: number) => (
                          <div key={index} className="flex flex-col items-center flex-1">
                            <div 
                              className="w-full bg-blue-500 rounded-t hover:bg-blue-60 transition"
                              style={{ height: `${(month.newCategories / 5) * 100}%` }}
                            ></div>
                            <div className="text-xs mt-1">{month.month}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Usage Tab */}
              {reportType === 'usage' && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Category Usage Report</h3>
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Order Value</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">Electronics</td>
                          <td className="px-6 py-4 whitespace-nowrap">12</td>
                          <td className="px-6 py-4 whitespace-nowrap">$24,500</td>
                          <td className="px-6 py-4 whitespace-nowrap">150</td>
                          <td className="px-6 py-4 whitespace-nowrap">$163.33</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">Clothing</td>
                          <td className="px-6 py-4 whitespace-nowrap">8</td>
                          <td className="px-6 py-4 whitespace-nowrap">$18,200</td>
                          <td className="px-6 py-4 whitespace-nowrap">95</td>
                          <td className="px-6 py-4 whitespace-nowrap">$191.58</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">Home & Garden</td>
                          <td className="px-6 py-4 whitespace-nowrap">6</td>
                          <td className="px-6 py-4 whitespace-nowrap">$12,800</td>
                          <td className="px-6 py-4 whitespace-nowrap">78</td>
                          <td className="px-6 py-4 whitespace-nowrap">$164.10</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Performance Tab */}
              {reportType === 'performance' && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Category Performance Report</h3>
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit Margin</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap font-medium">Electronics</td>
                          <td className="px-6 py-4 whitespace-nowrap">$24,500</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                              </div>
                              <span>45%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">12</td>
                          <td className="px-6 py-4 whitespace-nowrap">22.5%</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap font-medium">Clothing</td>
                          <td className="px-6 py-4 whitespace-nowrap">$18,200</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div className="bg-green-600 h-2 rounded-full" style={{ width: '32%' }}></div>
                              </div>
                              <span>32%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">8</td>
                          <td className="px-6 py-4 whitespace-nowrap">18.7%</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap font-medium">Home & Garden</td>
                          <td className="px-6 py-4 whitespace-nowrap">$12,800</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '23%' }}></div>
                              </div>
                              <span>23%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">6</td>
                          <td className="px-6 py-4 whitespace-nowrap">15.2%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Hierarchy Tab */}
              {reportType === 'hierarchy' && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Category Hierarchy</h3>
                  <div className="bg-white border rounded-lg p-4">
                    <div className="space-y-4">
                      <div className="pl-4 border-l-2 border-blue-500">
                        <div className="font-medium">Electronics</div>
                          <div className="pl-4 mt-2 space-y-2">
                          <div>Smartphones</div>
                          <div>Laptops</div>
                          <div>Accessories</div>
                          <div>Audio</div>
                          <div>TV & Home Theater</div>
                        </div>
                      </div>
                      
                      <div className="pl-4 border-l-2 border-green-500">
                        <div className="font-medium">Clothing</div>
                        <div className="pl-4 mt-2 space-y-2">
                          <div>Men's Wear</div>
                          <div>Women's Wear</div>
                          <div>Kids' Wear</div>
                        </div>
                      </div>
                      
                      <div className="pl-4 border-l-2 border-yellow-500">
                        <div className="font-medium">Home & Garden</div>
                        <div className="pl-4 mt-2 space-y-2">
                          <div>Furniture</div>
                          <div>Decor</div>
                          <div>Garden</div>
                          <div>Kitchen</div>
                        </div>
                      </div>
                      
                      <div className="pl-4 border-l-2 border-purple-500">
                        <div className="font-medium">Books</div>
                      </div>
                      
                      <div className="pl-4 border-l-2 border-red-500">
                        <div className="font-medium">Sports</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryReportsModal;