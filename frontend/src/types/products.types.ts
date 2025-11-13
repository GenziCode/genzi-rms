// Category Types
export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  parent?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parent?: string;  // Parent category ID for sub-categories
  sortOrder?: number;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}

// Product Variant Types
export interface ProductVariant {
  _id?: string;
  name: string;
  sku: string;
  price: number;
  cost?: number;
  stock?: number;
  barcode?: string;
}

// Product Types
export interface Product {
  _id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string | Category;
  description?: string;
  price: number; // Retail price
  wholesalePrice?: number; // Wholesale price
  cost?: number;
  taxRate?: number;
  stock?: number;
  stockLocations?: Array<{
    warehouseId: string;
    warehouseName: string;
    location: string;
    quantity: number;
  }>;
  unit?: string;
  qrCode?: string;
  variants?: ProductVariant[];
  images?: string[];
  tags?: string[];
  isActive: boolean;
  trackInventory: boolean;
  allowNegativeStock: boolean;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  salesMetrics?: {
    thisMonthSold: number;
    lastMonthSold: number;
    totalSold: number;
    revenue: number;
  };
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  sku?: string;  // Backend auto-generates if not provided
  barcode?: string;
  category: string;  // Category ID
  description?: string;
  price: number;
  cost?: number;
  taxRate?: number;
  stock?: number;
  unit?: string;
  variants?: ProductVariant[];
  images?: string[];
  tags?: string[];
  isActive?: boolean;
  trackInventory?: boolean;
  allowNegativeStock?: boolean;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

// Query/Filter Types
export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProductListResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Product Stats
export interface ProductStats {
  total: number;
  active: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}

// Category Stats
export interface CategoryStats {
  total: number;
  active: number;
  withProducts: number;
  totalProducts: number;
}

