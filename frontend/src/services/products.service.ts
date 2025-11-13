import api from '@/lib/api';
import type {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductFilters,
  ProductListResponse,
  ProductStats,
} from '@/types/products.types';

export const productsService = {
  /**
   * Get all products with filters
   * GET /api/products
   */
  async getAll(filters?: ProductFilters) {
    const response = await api.get<{
      success: boolean;
      data: {
        products: Product[];
        total: number;
        page: number;
        totalPages: number;
      };
      meta?: {
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };
    }>('/products', {
      params: filters,
    });
    // Backend returns { data: { products: [...], total, page, totalPages }, meta: { pagination } }
    return {
      products: response.data.data.products,
      pagination: response.data.meta?.pagination || {
        page: response.data.data.page,
        limit: filters?.limit || 20,
        total: response.data.data.total,
        totalPages: response.data.data.totalPages,
      },
    } as ProductListResponse;
  },

  /**
   * Get product by ID
   * GET /api/products/:id
   */
  async getById(id: string) {
    const response = await api.get<{ data: Product }>(`/products/${id}`);
    return response.data.data;
  },

  /**
   * Search products
   * GET /api/products/search
   */
  async search(query: string) {
    const response = await api.get<{ data: Product[] }>('/products/search', {
      params: { q: query },
    });
    return response.data.data;
  },

  /**
   * Get product by barcode
   * GET /api/products/barcode/:code
   */
  async getByBarcode(barcode: string) {
    const response = await api.get<{ data: Product }>(
      `/products/barcode/${barcode}`
    );
    return response.data.data;
  },

  /**
   * Get product by QR code
   * GET /api/products/qr/:data
   */
  async getByQR(qrData: string) {
    const response = await api.get<{ data: Product }>(`/products/qr/${qrData}`);
    return response.data.data;
  },

  /**
   * Create product
   * POST /api/products
   */
  async create(data: CreateProductRequest) {
    const response = await api.post<{ data: Product }>('/products', data);
    return response.data.data;
  },

  /**
   * Update product
   * PUT /api/products/:id
   */
  async update(id: string, data: UpdateProductRequest) {
    const response = await api.put<{ data: Product }>(`/products/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete product
   * DELETE /api/products/:id
   */
  async delete(id: string) {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  /**
   * Upload product image
   * POST /api/products/:id/image
   */
  async uploadImage(id: string, file: File) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post<{ data: Product }>(
      `/products/${id}/image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  /**
   * Bulk import products
   * POST /api/products/bulk
   */
  async bulkImport(products: CreateProductRequest[]) {
    const response = await api.post<{ data: { created: number; failed: number } }>(
      '/products/bulk',
      { products }
    );
    return response.data.data;
  },

  /**
   * Get low stock products
   * GET /api/products/low-stock
   */
  async getLowStock() {
    const response = await api.get<{ data: Product[] }>('/products/low-stock');
    return response.data.data;
  },

  /**
   * Get product stats
   * GET /api/products/stats
   */
  async getStats() {
    const response = await api.get<{ data: ProductStats }>('/products/stats');
    return response.data.data;
  },
};

