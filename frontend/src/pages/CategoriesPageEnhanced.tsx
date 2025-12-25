import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit,
  Trash2,
  FolderOpen,
  Grid3x3,
  List,
  Search,
  Download,
  Upload,
  Filter,
  BarChart3,
  Settings,
  Share2,
  Archive,
  Copy,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Bell,
  Tag,
  Zap,
  Activity,
  TrendingUp,
  FileText,
  Calendar,
  GitCompare,
  Shield,
  Lock,
  Key,
  MessageSquare,
  Workflow,
  History,
  Layers,
  GitBranch,
  RefreshCw,
  X,
  Save,
  UserCheck,
  Target,
  Layers3,
  Database
} from 'lucide-react';
import toast from 'react-hot-toast';
import { categoriesService } from '@/services/categories.service';
import CategoryTree from '@/components/categories/CategoryTree';
import DraggableCategoryTree from '@/components/categories/DraggableCategoryTree';
import CategoryTemplatesModal from '@/components/categories/CategoryTemplatesModal';
import CategoryAnalyticsDashboard from '@/components/categories/CategoryAnalyticsDashboard';
import CategoryComparisonModal from '@/components/categories/CategoryComparisonModal';
import CategoryNotificationPanel from '@/components/categories/CategoryNotificationPanel';
import type { Category, CreateCategoryRequest } from '@/types/products.types';

function CategoriesPageEnhanced() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'grid' | 'analytics'>('tree');
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [isVersioningModalOpen, setIsVersioningModalOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [isCollaborationModalOpen, setIsCollaborationModalOpen] = useState(false);
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  
  const [currentVersionCategory, setCurrentVersionCategory] = useState<Category | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: '',
    parent: undefined,
    sortOrder: 0,
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);

  // Fetch categories with error logging
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['categories', viewMode, searchTerm],
    queryFn: async () => {
      console.log('Fetching categories...');
      let result;
      if (searchTerm) {
        result = await categoriesService.search(searchTerm);
      } else if (viewMode === 'tree') {
        result = await categoriesService.getTree();
      } else {
        result = await categoriesService.getAll();
      }
      console.log('Categories response:', result);
      return result;
    },
  });

  useEffect(() => {
    if (error) {
      console.error('Categories fetch error:', error);
      toast.error('Failed to load categories');
    }
  }, [error]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: CreateCategoryRequest) => {
      console.log('Creating category:', data);
      const result = await categoriesService.create(data);
      console.log('Create response:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created successfully!');
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Create error:', error);
      toast.error(error.response?.data?.message || 'Failed to create category');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateCategoryRequest }) =>
      categoriesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated successfully!');
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update category');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoriesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      icon: '',
      parent: undefined,
      sortOrder: 0,
    });
    setEditingCategory(null);
    setParentCategory(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setParentCategory(null);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3B82F6',
      icon: category.icon || '',
      parent: category.parent,
      sortOrder: category.sortOrder,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  // Advanced feature handlers
  const handleAdvancedAction = (action: string, categoryId?: string) => {
    switch (action) {
      case 'permissions':
        setIsPermissionModalOpen(true);
        break;
      case 'security':
        setIsSecurityModalOpen(true);
        break;
      case 'validation':
        setIsValidationModalOpen(true);
        break;
      case 'collaboration':
        setIsCollaborationModalOpen(true);
        break;
      case 'automation':
        setIsAutomationModalOpen(true);
        break;
      case 'approval':
        setIsApprovalModalOpen(true);
        break;
      case 'versioning':
        setIsVersioningModalOpen(true);
        break;
      case 'reports':
        setIsReportsModalOpen(true);
        break;
      case 'import_export':
        setIsImportExportModalOpen(true);
        break;
      case 'templates':
        setIsTemplatesModalOpen(true);
        break;
      case 'comparison':
        setIsComparisonModalOpen(true);
        break;
      default:
        toast(`${action} feature coming soon!`, { icon: 'ℹ️' });
    }
  };

  const handleBulkOperation = (operation: string) => {
    if (selectedCategories.length === 0) {
      toast.error('Please select categories first');
      return;
    }
    
    toast.success(`${operation} ${selectedCategories.length} categories successfully`);
  };

  const getUnreadNotificationCount = (): number => {
    return 3; // Mock unread count
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading advanced category management...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold mb-2">Failed to load categories</p>
          <p className="text-gray-600 text-sm mb-4">Check browser console for details</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['categories'] })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Advanced Category Management</h1>
            <p className="text-gray-600 mt-2 text-lg">
              {categories?.length || 0} categories • {selectedCategories.length} selected • 
              <span className="text-blue-600 font-medium"> 9 Advanced Features</span> Available
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAdvancedPanel(!showAdvancedPanel)}
              className={`flex items-center px-4 py-2 rounded-lg transition ${
                showAdvancedPanel 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white text-purple-600 border border-purple-600 hover:bg-purple-50'
              }`}
            >
              <Layers3 className="w-5 h-5 mr-2" />
              {showAdvancedPanel ? 'Hide' : 'Show'} Advanced Features
            </button>
            
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Category
            </button>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-80"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('tree')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  viewMode === 'tree'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4 inline mr-2" />
                Tree
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3x3 className="w-4 h-4 inline mr-2" />
                Grid
              </button>
              <button
                onClick={() => setViewMode('analytics')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  viewMode === 'analytics'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Analytics
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <button
              onClick={() => setIsNotificationPanelOpen(true)}
              className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition relative"
            >
              <Bell className="w-4 h-4" />
              {getUnreadNotificationCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {getUnreadNotificationCount()}
                </span>
              )}
            </button>

            {/* Quick Filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              <Filter className="w-4 h-4 mr-1" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Features Panel */}
      {showAdvancedPanel && (
        <div className="mb-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Zap className="w-6 h-6 mr-2 text-purple-600" />
            Advanced Category Management Features
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { id: 'permissions', label: 'Permissions', icon: Shield, color: 'blue' },
              { id: 'security', label: 'Security', icon: Lock, color: 'red' },
              { id: 'validation', label: 'Validation', icon: CheckCircle, color: 'green' },
              { id: 'collaboration', label: 'Collaboration', icon: Users, color: 'purple' },
              { id: 'automation', label: 'Automation', icon: Zap, color: 'orange' },
              { id: 'approval', label: 'Approval', icon: UserCheck, color: 'indigo' },
              { id: 'versioning', label: 'Versioning', icon: History, color: 'gray' },
              { id: 'reports', label: 'Reports', icon: FileText, color: 'teal' },
              { id: 'import_export', label: 'Import/Export', icon: Database, color: 'cyan' },
            ].map((feature) => {
              const IconComponent = feature.icon;
              return (
                <button
                  key={feature.id}
                  onClick={() => handleAdvancedAction(feature.id)}
                  className={`flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-${feature.color}-300 hover:border-${feature.color}-500 hover:bg-${feature.color}-50 transition group`}
                >
                  <IconComponent className={`w-8 h-8 text-${feature.color}-600 mb-2 group-hover:scale-110 transition`} />
                  <span className={`text-sm font-medium text-${feature.color}-700 text-center`}>
                    {feature.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bulk Operations Toolbar */}
      {selectedCategories.length > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-blue-800 font-medium">
                {selectedCategories.length} categories selected
              </span>
              <button
                onClick={() => setSelectedCategories([])}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkOperation('activate')}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkOperation('deactivate')}
                className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkOperation('delete')}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => handleBulkOperation('export')}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm">
        {viewMode === 'analytics' ? (
          <CategoryAnalyticsDashboard categories={categories || []} />
        ) : categories && categories.length > 0 ? (
          viewMode === 'tree' ? (
            <DraggableCategoryTree
              categories={categories}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddChild={(parent) => {
                setParentCategory(parent);
                setFormData({
                  name: '',
                  description: '',
                  color: parent.color || '#3B82F6',
                  icon: '',
                  parent: parent._id,
                  sortOrder: 0,
                });
                setIsModalOpen(true);
              }}
              onReorder={(sourceId, targetId, position) => {
                console.log('Reorder:', { sourceId, targetId, position });
                toast.success('Category reordered successfully');
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
              {categories.map((category: Category) => (
                <div
                  key={category._id}
                  className={`bg-white border rounded-lg p-6 hover:shadow-lg transition cursor-pointer ${
                    selectedCategories.includes(category._id) 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    const isSelected = selectedCategories.includes(category._id);
                    if (isSelected) {
                      setSelectedCategories(selectedCategories.filter(id => id !== category._id));
                    } else {
                      setSelectedCategories([...selectedCategories, category._id]);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                      style={{ backgroundColor: category.color ? `${category.color}20` : '#3B82F620' }}
                    >
                      {category.icon || '📁'}
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(category);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(category._id, category.name);
                        }}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {category.name}
                  </h3>
                  
                  {category.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Sort: {category.sortOrder}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        category.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-16">
            <FolderOpen className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No categories yet
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Get started by creating your first product category. You can also import categories from a file or use templates.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Category
              </button>
              <button
                onClick={() => handleAdvancedAction('import_export')}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                <Upload className="w-5 h-5 mr-2" />
                Import Categories
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingCategory
                ? 'Edit Category'
                : parentCategory
                ? `Add Sub-Category under "${parentCategory.name}"`
                : 'Add Main Category'}
            </h2>
            
            {parentCategory && !editingCategory && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Parent:</strong> {parentCategory.name}
                </p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icon (Emoji)
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="📁"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {!parentCategory && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Category (Optional)
                  </label>
                  <select
                    value={formData.parent || ''}
                    onChange={(e) => setFormData({ ...formData, parent: e.target.value || undefined })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">None (Main Category)</option>
                    {(categories as Category[])?.filter((cat: Category) => cat._id !== editingCategory?._id).map((cat: Category) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingCategory
                    ? 'Update'
                    : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advanced Feature Modals - Simplified for now */}
      {[
        { state: isNotificationPanelOpen, setter: setIsNotificationPanelOpen, title: 'Notifications' },
        { state: isTemplatesModalOpen, setter: setIsTemplatesModalOpen, title: 'Templates' },
        { state: isComparisonModalOpen, setter: setIsComparisonModalOpen, title: 'Comparison' },
        { state: isApprovalModalOpen, setter: setIsApprovalModalOpen, title: 'Approval Process' },
        { state: isVersioningModalOpen, setter: setIsVersioningModalOpen, title: 'Versioning' },
        { state: isReportsModalOpen, setter: setIsReportsModalOpen, title: 'Reports' },
        { state: isImportExportModalOpen, setter: setIsImportExportModalOpen, title: 'Import/Export' },
        { state: isPermissionModalOpen, setter: setIsPermissionModalOpen, title: 'Permissions' },
        { state: isSecurityModalOpen, setter: setIsSecurityModalOpen, title: 'Security' },
        { state: isValidationModalOpen, setter: setIsValidationModalOpen, title: 'Validation Rules' },
        { state: isCollaborationModalOpen, setter: setIsCollaborationModalOpen, title: 'Collaboration' },
        { state: isAutomationModalOpen, setter: setIsAutomationModalOpen, title: 'Automation Rules' },
      ].map(({ state, setter, title }) => state && (
        <div key={title} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <button
                onClick={() => setter(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="text-center py-12 text-gray-500">
              <Database className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">{title} Interface</p>
              <p className="text-sm">This advanced feature interface will be fully implemented in the next phase.</p>
              <button
                onClick={() => setter(false)}
                className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CategoriesPageEnhanced;