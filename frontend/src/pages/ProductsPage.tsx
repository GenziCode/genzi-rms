import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Package,
  Grid3x3,
  List,
  Filter,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { productsService } from '@/services/products.service';
import { categoriesService } from '@/services/categories.service';
import { formatCurrency } from '@/lib/utils';
import type {
  Product,
  CreateProductRequest,
  ProductFilters,
} from '@/types/products.types';

function ProductsPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 20,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'inventory' | 'media'>(
    'basic'
  );
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: '',
    category: '',
    price: 0,
    cost: 0,
    stock: 0,
    minStock: 5,
    description: '',
    barcode: '',
    unit: 'pcs',
    taxRate: 0,
    trackInventory: true,
    isActive: true,
    allowNegativeStock: false,
  });

  // Fetch products with error logging
  const { data: productsData, isLoading, error } = useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      console.log('Fetching products with filters:', filters);
      const result = await productsService.getAll(filters);
      console.log('Products result:', result);
      return result;
    },
  });

  // Fetch categories for dropdown
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getAll,
  });

  useEffect(() => {
    if (error) {
      console.error('Products fetch error:', error);
      toast.error('Failed to load products');
    }
  }, [error]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateProductRequest) => {
      console.log('Creating product:', data);
      const result = await productsService.create(data);
      console.log('Create response:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully!');
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Create error:', error);
      toast.error(error.response?.data?.message || 'Failed to create product');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateProductRequest }) =>
      productsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully!');
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update product');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: productsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    },
  });

  const resetForm = () => {
    setActiveTab('basic');
    setFormData({
      name: '',
      category: '',
      price: 0,
      cost: 0,
      stock: 0,
      minStock: 5,
      description: '',
      barcode: '',
      unit: 'pcs',
      taxRate: 0,
      trackInventory: true,
      isActive: true,
      allowNegativeStock: false,
      maxStock: undefined,
      reorderPoint: undefined,
      reorderQuantity: undefined,
      tags: undefined,
      images: undefined,
      sku: undefined,
    });
    setEditingProduct(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: typeof product.category === 'string' ? product.category : product.category._id,
      price: product.price,
      cost: product.cost || 0,
      stock: product.stock || 0,
      minStock: product.minStock || 5,
      description: product.description || '',
      barcode: product.barcode || '',
      unit: product.unit || 'pcs',
      taxRate: product.taxRate || 0,
      trackInventory: product.trackInventory,
      isActive: product.isActive,
      allowNegativeStock: product.allowNegativeStock ?? false,
      maxStock: product.maxStock,
      reorderPoint: product.reorderPoint,
      reorderQuantity: product.reorderQuantity,
      tags: product.tags,
      images: product.images,
      sku: product.sku,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: searchQuery, page: 1 });
  };

  const products = productsData?.products || [];
  const pagination = productsData?.pagination;

  console.log('Rendering products page. Products:', products);
  console.log('Products count:', products.length);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
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
            <Package className="w-16 h-16 mx-auto mb-2" />
          </div>
          <p className="text-gray-900 font-semibold mb-2">Failed to load products</p>
          <p className="text-gray-600 text-sm mb-4">Check browser console for details</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['products'] })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">
            {pagination?.total || 0} products in catalog
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Product
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, SKU, or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Search
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Filter */}
        {categories && categories.length > 0 && (
          <div className="mt-4 flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filters.category || ''}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value, page: 1 })
              }
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Products List/Grid */}
      {products.length > 0 ? (
        viewMode === 'list' ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.images && product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center mr-3">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {product.name}
                          </p>
                          {product.barcode && (
                            <p className="text-xs text-gray-500">
                              {product.barcode}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                        {product.sku}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {typeof product.category === 'object'
                          ? product.category.name
                          : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(product.price)}
                      </p>
                      {product.cost && product.cost > 0 && (
                        <p className="text-xs text-gray-500">
                          Cost: {formatCurrency(product.cost)}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-sm font-medium rounded ${
                          (product.stock || 0) <= (product.minStock || 0)
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {product.stock || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product._id, product.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition"
              >
                {product.images && product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                    <Package className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <h3 className="font-semibold text-gray-900 mb-2">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-500 mb-2">{product.sku}</p>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(product.price)}
                  </p>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      (product.stock || 0) <= (product.minStock || 0)
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    Stock: {product.stock || 0}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product._id, product.name)}
                    className="flex-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No products yet
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || filters.category
              ? 'No products match your search criteria'
              : 'Get started by adding your first product'}
          </p>
          {!searchQuery && !filters.category && (
            <button
              onClick={() => {
                if (!categories || categories.length === 0) {
                  toast.error('Please create a category first');
                  return;
                }
                setIsModalOpen(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Product
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-6">
          <button
            onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
            disabled={filters.page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-700">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
            disabled={filters.page === pagination.totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Product Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add Product'}
                </h2>
                <p className="text-sm text-gray-500">
                  Organize product details across focused sections.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700 transition"
                aria-label="Close product modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { id: 'basic', label: 'Basic Info' },
                { id: 'pricing', label: 'Pricing & Tax' },
                { id: 'inventory', label: 'Inventory & Status' },
                { id: 'media', label: 'Media & Tags' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name <span className="text-red-500">*</span>
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
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories?.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.icon} {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SKU
                      </label>
                      <input
                        type="text"
                        value={formData.sku || ''}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="Auto-generated if left blank"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Barcode
                      </label>
                      <input
                        type="text"
                        value={formData.barcode || ''}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit
                      </label>
                      <select
                        value={formData.unit || 'pcs'}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="pcs">Pieces</option>
                        <option value="kg">Kilograms</option>
                        <option value="liter">Liters</option>
                        <option value="box">Box</option>
                        <option value="pack">Pack</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="What makes this product special?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={formData.tags?.join(', ') || ''}
                      onChange={(e) => {
                        const tags = e.target.value
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean);
                        setFormData({ ...formData, tags: tags.length ? tags : undefined });
                      }}
                      placeholder="e.g., featured, organic, clearance"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">Separate multiple tags with commas.</p>
                  </div>
                </div>
              )}

              {activeTab === 'pricing' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cost || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cost: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Helps calculate profit margins and valuation.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.taxRate || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          taxRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reorder Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.reorderQuantity || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reorderQuantity: parseInt(e.target.value) || undefined,
                        })
                      }
                      placeholder="Default quantity when reordering"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'inventory' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Initial Stock
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.stock || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            stock: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Min Stock Alert
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.minStock || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minStock: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Stock Level
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.maxStock || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxStock: parseInt(e.target.value) || undefined,
                          })
                        }
                        placeholder="Optional"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reorder Point
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.reorderPoint || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            reorderPoint: parseInt(e.target.value) || undefined,
                          })
                        }
                        placeholder="Trigger alerts when stock drops below this level"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                      <input
                        type="checkbox"
                        checked={formData.trackInventory ?? true}
                        onChange={(e) => setFormData({ ...formData, trackInventory: e.target.checked })}
                        className="h-4 w-4 text-blue-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Track Inventory</p>
                        <p className="text-xs text-gray-500">
                          Maintain stock levels and alerts automatically.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                      <input
                        type="checkbox"
                        checked={formData.allowNegativeStock ?? false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            allowNegativeStock: e.target.checked,
                          })
                        }
                        className="h-4 w-4 text-blue-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Allow Negative Stock</p>
                        <p className="text-xs text-gray-500">
                          Useful for backorders or consignment scenarios.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 md:col-span-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive ?? true}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="h-4 w-4 text-blue-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Active Product</p>
                        <p className="text-xs text-gray-500">
                          Inactive products stay in the catalog but are hidden from sales.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'media' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image URLs
                    </label>
                    <input
                      type="text"
                      value={formData.images?.join(', ') || ''}
                      onChange={(e) => {
                        const images = e.target.value
                          .split(',')
                          .map((url) => url.trim())
                          .filter(Boolean);
                        setFormData({ ...formData, images: images.length ? images : undefined });
                      }}
                      placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Paste one or more image URLs separated by commas.
                    </p>
                  </div>

                  {formData.images && formData.images.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {formData.images.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={url}
                            alt={`Product ${idx + 1}`}
                            className="w-24 h-24 object-cover rounded-lg border shadow-sm"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://via.placeholder.com/96?text=Image';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const nextImages = formData.images?.filter((_, i) => i !== idx);
                              setFormData({
                                ...formData,
                                images: nextImages && nextImages.length ? nextImages : undefined,
                              });
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
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
                    : editingProduct
                    ? 'Update Product'
                    : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductsPage;
