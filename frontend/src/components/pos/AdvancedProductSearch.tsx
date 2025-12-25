import { useState, useEffect } from 'react';
import { Search, Filter, X, SlidersHorizontal, DollarSign, Package, Tag, Star } from 'lucide-react';
import { productsService } from '@/services/products.service';
import type { Product as CatalogProduct } from '@/types/products.types';

interface AdvancedProductSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onProductSelect: (product: CatalogProduct) => void;
}

interface SearchFilters {
  category: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  supplier: string;
  brand: string;
  sortBy: 'name' | 'price' | 'stock' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

export default function AdvancedProductSearch({
  isOpen,
  onClose,
  onProductSelect
}: AdvancedProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    category: '',
    minPrice: '',
    maxPrice: '',
    inStock: false,
    supplier: '',
    brand: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // Mock data for filters - in real app, this would come from APIs
  const categories = [
    'Electronics', 'Clothing', 'Food', 'Books', 'Home & Garden',
    'Sports', 'Beauty', 'Automotive', 'Health', 'Toys'
  ];

  const suppliers = [
    'ABC Distributors', 'Global Supply Co', 'Premium Vendors Inc',
    'Quality Imports Ltd', 'Local Suppliers'
  ];

  const brands = [
    'Apple', 'Samsung', 'Nike', 'Adidas', 'Sony', 'LG', 'Dell',
    'HP', 'Lenovo', 'Microsoft', 'Google', 'Amazon Basics'
  ];

  useEffect(() => {
    if (isOpen) {
      performSearch();
    }
  }, [searchTerm, filters, isOpen]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const params: any = {
        limit: 50,
        search: searchTerm || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      if (filters.category) params.category = filters.category;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.inStock) params.inStock = 'true';
      if (filters.supplier) params.supplier = filters.supplier;
      if (filters.brand) params.brand = filters.brand;

      const response = await productsService.getAll(params);
      setProducts(response.products);
    } catch (error) {
      console.error('Search error:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      inStock: false,
      supplier: '',
      brand: '',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  const getStockStatus = (product: CatalogProduct) => {
    if (!product.trackInventory) return { status: 'untracked', color: 'text-gray-500' };
    if ((product.stock || 0) <= 0) return { status: 'out', color: 'text-red-600' };
    if ((product.stock || 0) <= (product.minStock || 0)) return { status: 'low', color: 'text-yellow-600' };
    return { status: 'in-stock', color: 'text-green-600' };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Advanced Product Search</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products by name, SKU, or barcode..."
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 border rounded-lg flex items-center gap-2 transition ${
                showFilters ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => updateFilter('category', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => updateFilter('minPrice', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => updateFilter('maxPrice', e.target.value)}
                    placeholder="1000"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <select
                    value={filters.supplier}
                    onChange={(e) => updateFilter('supplier', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">All Suppliers</option>
                    {suppliers.map(sup => (
                      <option key={sup} value={sup}>{sup}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <select
                    value={filters.brand}
                    onChange={(e) => updateFilter('brand', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">All Brands</option>
                    {brands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => updateFilter('sortBy', e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="name">Name</option>
                    <option value="price">Price</option>
                    <option value="stock">Stock</option>
                    <option value="createdAt">Date Added</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => updateFilter('sortOrder', e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.inStock}
                      onChange={(e) => updateFilter('inStock', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">In Stock Only</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Searching products...</p>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No products found</p>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => {
                const stockStatus = getStockStatus(product);
                return (
                  <div
                    key={product._id}
                    className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onProductSelect(product)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                        <p className="text-sm text-gray-500">{product.sku || 'No SKU'}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        stockStatus.status === 'out' ? 'bg-red-100 text-red-700' :
                        stockStatus.status === 'low' ? 'bg-yellow-100 text-yellow-700' :
                        stockStatus.status === 'in-stock' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {stockStatus.status === 'out' ? 'Out' :
                         stockStatus.status === 'low' ? 'Low' :
                         stockStatus.status === 'in-stock' ? 'In Stock' : 'No Track'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center text-lg font-bold text-gray-900">
                        <DollarSign className="w-4 h-4" />
                        {product.price.toFixed(2)}
                      </div>
                      {product.trackInventory && (
                        <div className="text-sm text-gray-600">
                          Stock: {product.stock || 0}
                        </div>
                      )}
                    </div>

                    {product.category && (
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Tag className="w-3 h-3 mr-1" />
                        {typeof product.category === 'string' ? product.category : product.category.name}
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onProductSelect(product);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {products.length} product{products.length !== 1 ? 's' : ''} found
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}