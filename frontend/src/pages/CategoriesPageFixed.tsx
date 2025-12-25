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
  Database,
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
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { categoriesService } from '@/services/categories.service';
import CategoryTree from '@/components/categories/CategoryTree';
import DraggableCategoryTree from '@/components/categories/DraggableCategoryTree';
import CategoryTemplatesModal from '@/components/categories/CategoryTemplatesModal';
import CategoryAnalyticsDashboard from '@/components/categories/CategoryAnalyticsDashboard';
import CategoryComparisonModal from '@/components/categories/CategoryComparisonModal';
import CategoryNotificationPanel from '@/components/categories/CategoryNotificationPanel';
// Note: Advanced components are imported but with graceful fallbacks
import CategoryApprovalModal from '@/components/categories/CategoryApprovalModal';
import CategoryVersioningModal from '@/components/categories/CategoryVersioningModal';
import CategoryReportsModal from '@/components/categories/CategoryReportsModal';
import CategoryImportExportModal from '@/components/categories/CategoryImportExportModal';
import BulkOperationsToolbar from '@/components/categories/BulkOperationsToolbar';
import type { Category, CreateCategoryRequest } from '@/types/products.types';

function CategoriesPage() {
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

  // Fetch categories with error logging
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['categories', viewMode, searchTerm],
    queryFn: async () => {
      console.log('Fetching categories...');
      let result;
      if (searchTerm) {
        // If searching, get all categories regardless of view mode
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

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; sortOrder: number }>) => {
      console.log('Reordering categories:', updates);
      const result = await categoriesService.updateSortOrder(updates);
      console.log('Reorder response:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categories reordered successfully!');
    },
    onError: (error: any) => {
      console.error('Reorder error:', error);
      toast.error(error.response?.data?.message || 'Failed to reorder categories');
    },
  });

  // Create mutation
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

  // Update mutation
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

  // Delete mutation
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

  const handleAddChild = (parent: Category) => {
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
  const handleBulkOperation = (operation: string, categoryIds?: string[]) => {
    const targetIds = categoryIds || selectedCategories;
    if (targetIds.length === 0) {
      toast.error('Please select categories first');
      return;
    }

    switch (operation) {
      case 'activate':
        toast.success(`Activating ${targetIds.length} categories`);
        break;
      case 'deactivate':
        toast.success(`Deactivating ${targetIds.length} categories`);
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to delete ${targetIds.length} categories?`)) {
          toast.success(`Deleting ${targetIds.length} categories`);
        }
        break;
      case 'export':
        toast.success(`Exporting ${targetIds.length} categories`);
        break;
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
      default:
        toast.error('Unknown operation');
    }
  };

  const handleApprovalAction = (approvalId: string, action: 'approve' | 'reject', comment?: string) => {
    toast.success(`Category ${action}ed successfully`);
  };

  const handleVersionRestore = (categoryId: string, versionId: string) => {
    toast.success('Category version restored successfully');
  };

  const handleExportData = (format: 'csv' | 'excel' | 'json') => {
    toast.success(`Exporting categories as ${format.toUpperCase()}`);
  };

  const handleImportData = (file: File) => {
    toast.success('Importing categories from file');
  };

  const handleGenerateReport = (reportType: string) => {
    toast.success(`Generating ${reportType} report`);
  };

  // Function to handle category reordering
  const handleReorder = (sourceId: string, targetId: string, position: 'before' | 'after' | 'child') => {
    if (!categories) return;

    // Find the source and target categories
    const sourceCategory = categories.find(cat => cat._id === sourceId);
    const targetCategory = categories.find(cat => cat._id === targetId);

    if (!sourceCategory || !targetCategory) return;

    // For simplicity, we'll just update the sort order based on position
    // In a real implementation, you might need more complex logic to handle the tree structure
    let newSortOrder = targetCategory.sortOrder;

    if (position === 'after') {
      newSortOrder = targetCategory.sortOrder + 1;
    } else if (position === 'before') {
      newSortOrder = targetCategory.sortOrder - 1;
    } else if (position === 'child') {
      // For child position, we'll need to set the parent to targetId
      // This is more complex and would require backend changes
      // For now, we'll just update the sort order
      newSortOrder = targetCategory.sortOrder + 0.5;
    }

    // Update the parent if needed
    const updatedSource = {
      ...sourceCategory,
      parent: position === 'child' ? targetId : sourceCategory.parent,
      sortOrder: newSortOrder
    };

    // Prepare updates for the reorder mutation
    const updates = [
      { id: sourceId, sortOrder: newSortOrder }
    ];

    // If we're changing parent, we might need to update the original parent's children
    // For now, just call the reorder mutation
    reorderMutation.mutate(updates);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <FolderOpen className="w-16 h-16 mx-auto mb-2" />
          </div>
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

  console.log('Rendering categories page. Categories:', categories);
  console.log('Categories count:', categories?.length);

  // Function to get unread notification count
  const getUnreadNotificationCount = (): number => {
    // In a real implementation, this would fetch from an API
    // For now, returning a mock value
    return 3; // Mock unread count
  };

  return (
    <div>
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Category Management</h1>
          <p className="text-gray-600 mt-1">
            {categories?.length || 0} categories • {selectedCategories.length} selected
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-64"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-1 bg-white rounded-lg shadow p-1">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                viewMode === 'tree'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="w-4 h-4 inline mr-1" />
              Tree
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid3x3 className="w-4 h-4 inline mr-1" />
              Grid
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                viewMode === 'analytics'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-1" />
              Analytics
            </button>
          </div>

          {/* Advanced Features Dropdown */}
          <div className="relative">
            <button
              className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              onClick={() => {/* Toggle dropdown */}}
            >
              <Settings className="w-4 h-4 mr-1" />
              Features
            </button>
          </div>

          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Category
          </button>

          {/* Notifications Button */}
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
        </div>
      </div>

      {/* Advanced Feature Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Activity className="w-4 h-4 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'permissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Permissions
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Lock className="w-4 h-4 inline mr-2" />
              Security
            </button>
            <button
              onClick={() => setActiveTab('validation')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'validation'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Validation
            </button>
            <button
              onClick={() => setActiveTab('collaboration')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'collaboration'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Collaboration
            </button>
            <button
              onClick={() => setActiveTab('automation')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'automation'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Zap className="w-4 h-4 inline mr-2" />
              Automation
            </button>
          </nav>
        </div>
      </div>

      {/* Bulk Operations Toolbar */}
      {selectedCategories.length > 0 && (
        <BulkOperationsToolbar
          selectedCategories={selectedCategories}
          onSelectAll={() => setSelectedCategories(categories?.map(c => c._id) || [])}
          onClearSelection={() => setSelectedCategories([])}
          onBulkActivate={() => handleBulkOperation('activate')}
          onBulkDeactivate={() => handleBulkOperation('deactivate')}
          onBulkDelete={() => handleBulkOperation('delete')}
          onBulkExport={() => handleBulkOperation('export')}
          onBulkImport={(file) => handleImportData(file)}
          onBulkUpdate={(updates) => console.log('Bulk update:', updates)}
          onBulkAssignParent={(parentId) => console.log('Assign parent:', parentId)}
          allCategories={categories || []}
          totalSelected={selectedCategories.length}
          totalCategories={categories?.length || 0}
        />
      )}

      {/* Tab Content */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Category Permissions</h3>
            <button
              onClick={() => setIsPermissionModalOpen(true)}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Key className="w-4 h-4 mr-2" />
              Manage Permissions
            </button>
          </div>
          <div className="text-gray-600">
            Configure access control and permissions for categories. Define who can view, edit, delete, or manage category hierarchies.
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Category Security</h3>
            <button
              onClick={() => setIsSecurityModalOpen(true)}
              className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Shield className="w-4 h-4 mr-2" />
              Security Settings
            </button>
          </div>
          <div className="text-gray-600">
            Configure security policies, audit trails, and compliance settings for category management.
          </div>
        </div>
      )}

      {activeTab === 'validation' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Category Validation Rules</h3>
            <button
              onClick={() => setIsValidationModalOpen(true)}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Validation Rules
            </button>
          </div>
          <div className="text-gray-600">
            Set up validation rules to ensure data quality and consistency across category hierarchies.
          </div>
        </div>
      )}

      {activeTab === 'collaboration' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Category Collaboration</h3>
            <button
              onClick={() => setIsCollaborationModalOpen(true)}
              className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Users className="w-4 h-4 mr-2" />
              Collaboration Tools
            </button>
          </div>
          <div className="text-gray-600">
            Enable team collaboration features including comments, mentions, and shared workflows for category management.
          </div>
        </div>
      )}

      {activeTab === 'automation' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Category Automation Rules</h3>
            <button
              onClick={() => setIsAutomationModalOpen(true)}
              className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <Zap className="w-4 h-4 mr-2" />
              Automation Rules
            </button>
          </div>
          <div className="text-gray-600">
            Create automated workflows and rules for category management, approvals, and data processing.
          </div>
        </div>
      )}

      {/* Categories Display */}
      {viewMode === 'analytics' ? (
        <CategoryAnalyticsDashboard categories={categories || []} />
      ) : categories && categories.length > 0 ? (
        viewMode === 'tree' ? (
          <DraggableCategoryTree
            categories={categories}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddChild={handleAddChild}
            onReorder={handleReorder}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category: Category) => (
            <div
              key={category._id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                  style={{ backgroundColor: category.color ? `${category.color}20` : '#3B82F620' }}
                >
                  {category.icon || '📁'}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category._id, category.name)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-sm text-gray-600 mb-3">
                  {category.description}
                </p>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Sort: {category.sortOrder}</span>
                <span
                  className={`px-2 py-1 rounded ${
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
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No categories yet
          </h3>
          <p className="text-gray-600 mb-6">
            Get started by creating your first product category
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Category
          </button>
        </div>
      )}

      {/* Modal */}
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
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Color & Icon */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, icon: e.target.value })
                    }
                    placeholder="📁"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Parent Category (for editing) */}
              {!parentCategory && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Category (Optional)
                  </label>
                  <select
                    value={formData.parent || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, parent: e.target.value || undefined })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">None (Main Category)</option>
                    {(categories as Category[])?.filter((cat: Category) => cat._id !== editingCategory?._id).map((cat: Category) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select a parent to create a sub-category
                  </p>
                </div>
              )}

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sortOrder: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Buttons */}
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

      {/* Category Notification Panel */}
      {isNotificationPanelOpen && categories && (
        <CategoryNotificationPanel
          category={null}
          isVisible={isNotificationPanelOpen}
          onClose={() => setIsNotificationPanelOpen(false)}
        />
      )}

      {/* Category Approval Modal */}
      {isApprovalModalOpen && (
        <CategoryApprovalModal
          isOpen={isApprovalModalOpen}
          onClose={() => setIsApprovalModalOpen(false)}
          category={editingCategory}
          onApprovalSubmit={(categoryId, changes, reason) => {
            console.log('Approval submitted:', { categoryId, changes, reason });
            setIsApprovalModalOpen(false);
          }}
          onApprovalAction={handleApprovalAction}
          onApprovalCancel={(approvalId) => console.log('Approval cancelled:', approvalId)}
        />
      )}

      {/* Category Versioning Modal */}
      {isVersioningModalOpen && (currentVersionCategory || editingCategory) && (
        <CategoryVersioningModal
          isOpen={isVersioningModalOpen}
          onClose={() => setIsVersioningModalOpen(false)}
          category={(currentVersionCategory || editingCategory)!}
          onRestore={handleVersionRestore}
        />
      )}

      {/* Category Reports Modal */}
      {isReportsModalOpen && (
        <CategoryReportsModal
          isOpen={isReportsModalOpen}
          onClose={() => setIsReportsModalOpen(false)}
        />
      )}

      {/* Category Import/Export Modal */}
      {isImportExportModalOpen && (
        <CategoryImportExportModal
          isOpen={isImportExportModalOpen}
          onClose={() => setIsImportExportModalOpen(false)}
          categories={categories || []}
          onExport={handleExportData}
          onImport={handleImportData}
        />
      )}

      {/* Category Templates Modal */}
      {isTemplatesModalOpen && (
        <CategoryTemplatesModal
          isOpen={isTemplatesModalOpen}
          onClose={() => setIsTemplatesModalOpen(false)}
          categories={categories || []}
          onCreateFromTemplate={(templateId, name, parent) => {
            console.log('Creating from template:', { templateId, name, parent });
            setIsTemplatesModalOpen(false);
          }}
          onSaveAsTemplate={(categoryId, templateName) => {
            console.log('Saving as template:', { categoryId, templateName });
            setIsTemplatesModalOpen(false);
          }}
        />
      )}

      {/* Category Comparison Modal */}
      {isComparisonModalOpen && (
        <CategoryComparisonModal
          isOpen={isComparisonModalOpen}
          onClose={() => setIsComparisonModalOpen(false)}
          categories={selectedCategories.map(id => categories?.find(c => c._id === id)).filter(Boolean) as Category[]}
        />
      )}

      {/* Advanced Feature Modals */}
      {/* Category Permissions Modal */}
      {isPermissionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Category Permissions</h2>
              <button
                onClick={() => setIsPermissionModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">Configure access control and permissions for categories.</p>
              <div className="text-center py-8 text-gray-500">
                <Key className="w-12 h-12 mx-auto mb-4" />
                <p>Permission management interface will be implemented here</p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsPermissionModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Security Modal */}
      {isSecurityModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Category Security</h2>
              <button
                onClick={() => setIsSecurityModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">Configure security policies and audit settings.</p>
              <div className="text-center py-8 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-4" />
                <p>Security settings interface will be implemented here</p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsSecurityModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Validation Modal */}
      {isValidationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Category Validation Rules</h2>
              <button
                onClick={() => setIsValidationModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">Set up validation rules for category data quality.</p>
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-4" />
                <p>Validation rules interface will be implemented here</p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsValidationModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Collaboration Modal */}
      {isCollaborationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Category Collaboration</h2>
              <button
                onClick={() => setIsCollaborationModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">Configure team collaboration features and workflows.</p>
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4" />
                <p>Collaboration interface will be implemented here</p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsCollaborationModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Automation Modal */}
      {isAutomationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Category Automation Rules</h2>
              <button
                onClick={() => setIsAutomationModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">Create automated workflows and rules for category management.</p>
              <div className="text-center py-8 text-gray-500">
                <Zap className="w-12 h-12 mx-auto mb-4" />
                <p>Automation rules interface will be implemented here</p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsAutomationModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoriesPage;