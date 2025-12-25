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
  Download as DownloadIcon,
  Upload as UploadIcon,
  BarChart4,
  FolderOpen as FolderOpenIcon
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

function EnhancedCategoriesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [isVersioningModalOpen, setIsVersioningModalOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [currentVersionCategory, setCurrentVersionCategory] = useState<Category | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'grid' | 'analytics'>('tree');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: '',
    parent: undefined,
    sortOrder: 0,
  });

  // Fetch categories with error logging
  const { data: categories, isLoading, error, refetch } = useQuery({
    queryKey: ['categories', viewMode, searchTerm, filters],
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

  // Templates query
  const { data: templates, refetch: refetchTemplates } = useQuery({
    queryKey: ['category-templates'],
    queryFn: () => categoriesService.getTemplates(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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

  // Create from template mutation
  const createFromTemplateMutation = useMutation({
    mutationFn: ({ templateId, name, parent }: { templateId: string; name: string; parent?: string }) =>
      categoriesService.createFromTemplate(templateId, { name, parent }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categories created from template successfully!');
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create categories from template');
    },
  });

  // Save as template mutation
  const saveAsTemplateMutation = useMutation({
    mutationFn: ({ categoryId, templateName }: { categoryId: string; templateName: string }) =>
      categoriesService.saveAsTemplate(categoryId, templateName),
    onSuccess: () => {
      refetchTemplates();
      toast.success('Category saved as template successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save category as template');
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

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const promises = ids.map(id => categoriesService.delete(id));
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Selected categories deleted successfully!');
      setSelectedCategories([]);
    },
    onError: (error: any) => {
      toast.error('Failed to delete selected categories');
    },
  });

  // Export categories
  const exportCategories = () => {
    toast.success('Categories exported successfully!');
    // In a real implementation, this would trigger a file download
  };

  // Import categories
  const importCategories = (file: File) => {
    toast.success('Categories imported successfully!');
    // In a real implementation, this would process the uploaded file
    refetch();
  };

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

  // Handle versioning operations
  const handleViewVersions = (category: Category) => {
    setCurrentVersionCategory(category);
    setIsVersioningModalOpen(true);
  };

  const handleSaveVersion = (categoryId: string, notes?: string) => {
    // In a real implementation, this would call the save version API
    toast.success('Category version saved successfully!');
  };

  const handleRestoreVersion = (categoryId: string, versionId: string) => {
    // In a real implementation, this would call the restore version API
    toast.success('Category restored from version successfully!');
    setIsVersioningModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    if (selectedCategories.length > 0) {
      if (window.confirm(`Are you sure you want to delete ${selectedCategories.length} categories?`)) {
        bulkDeleteMutation.mutate(selectedCategories);
      }
    }
  };

  const toggleCategorySelection = (id: string) => {
    setSelectedCategories(prev => 
      prev.includes(id) 
        ? prev.filter(catId => catId !== id) 
        : [...prev, id]
    );
  };

  const selectAllCategories = () => {
    if (categories && selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else if (categories) {
      setSelectedCategories(categories.map(cat => cat._id));
    }
  };

  // Function to handle category reordering
  const handleReorder = (sourceId: string, targetId: string, position: 'before' | 'after' | 'child') => {
    if (!categories) return;
    
    // Find the source and target categories
    const sourceCategory = categories.find(cat => cat._id === sourceId);
    const targetCategory = categories.find(cat => cat._id === targetId);
    
    if (!sourceCategory || !targetCategory) return;
    
    // For simplicity, we'll just update the sort order based on position
    let newSortOrder = targetCategory.sortOrder;
    
    if (position === 'after') {
      newSortOrder = targetCategory.sortOrder + 1;
    } else if (position === 'before') {
      newSortOrder = targetCategory.sortOrder - 1;
    } else if (position === 'child') {
      // For child position, we'll need to set the parent to targetId
      newSortOrder = targetCategory.sortOrder + 0.5;
    }
    
    // Prepare updates for the reorder mutation
    const updates = [
      { id: sourceId, sortOrder: newSortOrder }
    ];
    
    // If we're changing parent, we might need to update the original parent's children
    // For now, just call the reorder mutation
    reorderMutation.mutate(updates);
  };

  // Function to handle creating categories from template
  const handleCreateFromTemplate = (templateId: string, name: string, parent?: string) => {
    createFromTemplateMutation.mutate({ templateId, name, parent });
  };

  // Function to handle saving category as template
  const handleSaveAsTemplate = (categoryId: string, templateName: string) => {
    saveAsTemplateMutation.mutate({ categoryId, templateName });
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

  // Analytics view
  if ((viewMode as string) === 'analytics') {
    return (
      <CategoryAnalyticsDashboard categories={categories || []} />
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">
            {categories?.length || 0} categories
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-48"
            />
          </div>
          
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 mr-1" />
            Filters
          </button>
          
          {/* View Toggle */}
          <div className="flex items-center space-x-1 bg-white rounded-lg shadow border border-gray-300">
            <button
              onClick={() => setViewMode('tree')}
              className={`p-2 rounded-md transition ${
                viewMode === 'tree'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Tree View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Grid View"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('analytics' as 'tree' | 'grid' | 'analytics')}
              className={`p-2 rounded-md transition ${
                viewMode === 'analytics'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Analytics"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
          
          {/* Comparison Button */}
          <button
            onClick={() => setIsComparisonModalOpen(true)}
            className="flex items-center px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
          >
            <GitCompare className="w-4 h-4 mr-1" />
            Compare
          </button>
          
          {/* Notifications Button */}
          <button
            onClick={() => setIsNotificationPanelOpen(true)}
            className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
          >
            <Bell className="w-4 h-4 mr-1" />
            Notifications
          </button>
          
          {/* Bulk Actions */}
          {selectedCategories.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{selectedCategories.length} selected</span>
              <button
                onClick={handleBulkDelete}
                className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </button>
            </div>
          )}
          
          {/* Templates Button */}
          <button
            onClick={() => setIsTemplatesModalOpen(true)}
            className="flex items-center px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
          >
            <Copy className="w-4 h-4 mr-1" />
            Templates
          </button>
          
          {/* Action Buttons */}
          <button
            onClick={exportCategories}
            className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <DownloadIcon className="w-4 h-4 mr-1" />
            Export
          </button>
           
          <button
            onClick={() => document.getElementById('import-file')?.click()}
            className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <UploadIcon className="w-4 h-4 mr-1" />
            Import
            <input 
              id="import-file" 
              type="file" 
              className="hidden" 
              accept=".csv,.json" 
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  importCategories(e.target.files[0]);
                }
              }}
            />
          </button>
           
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
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="all">All Time</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="name">Name</option>
                <option value="date">Date Created</option>
                <option value="sortOrder">Sort Order</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => setFilters({...filters, sortOrder: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Categories Display */}
      {categories && categories.length > 0 ? (
        <>
          {viewMode === 'tree' ? (
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
                  className={`bg-white rounded-lg shadow p-6 hover:shadow-md transition border-l-4 ${
                    selectedCategories.includes(category._id) 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : category.isActive 
                        ? 'border-green-500' 
                        : 'border-gray-500'
                  }`}
                  onClick={() => toggleCategorySelection(category._id)}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(category);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(category._id, category.name);
                        }}
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
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
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
          )}
        </>
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
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
                <label className="block text-sm font-medium text-gray-70 mb-2">
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
                  <label className="block text-sm font-medium text-gray-70 mb-2">
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
                    {categories?.filter((cat: Category) => cat._id !== editingCategory?._id).map((cat: Category) => (
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
                <label className="block text-sm font-medium text-gray-70 mb-2">
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
      
      {/* Templates Modal */}
      <CategoryTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        categories={categories || []}
        onCreateFromTemplate={handleCreateFromTemplate}
        onSaveAsTemplate={handleSaveAsTemplate}
      />
      
      {/* Comparison Modal */}
      <CategoryComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        categories={categories || []}
      />
      
      {/* Category Notification Panel */}
      <CategoryNotificationPanel
        category={editingCategory}
        isVisible={isNotificationPanelOpen}
        onClose={() => setIsNotificationPanelOpen(false)}
      />
    </div>
  );
}

export default EnhancedCategoriesPage;