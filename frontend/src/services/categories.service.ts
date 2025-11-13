import api from '@/lib/api';
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryStats,
} from '@/types/products.types';

export const categoriesService = {
  /**
   * Get all categories
   * GET /api/categories
   */
  async getAll() {
    const response = await api.get<{ 
      success: boolean;
      data: {
        categories: Category[];
        total: number;
        page: number;
        totalPages: number;
      };
    }>('/categories');
    return response.data.data.categories;
  },

  /**
   * Get category by ID
   * GET /api/categories/:id
   */
  async getById(id: string) {
    const response = await api.get<{ data: Category }>(`/categories/${id}`);
    return response.data.data;
  },

  /**
   * Create category
   * POST /api/categories
   */
  async create(data: CreateCategoryRequest) {
    const response = await api.post<{ data: Category }>('/categories', data);
    return response.data.data;
  },

  /**
   * Update category
   * PUT /api/categories/:id
   */
  async update(id: string, data: UpdateCategoryRequest) {
    const response = await api.put<{ data: Category }>(
      `/categories/${id}`,
      data
    );
    return response.data.data;
  },

  /**
   * Delete category
   * DELETE /api/categories/:id
   */
  async delete(id: string) {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },

  /**
   * Update sort order
   * PUT /api/categories/sort-order
   */
  async updateSortOrder(categories: Array<{ id: string; sortOrder: number }>) {
    const response = await api.put('/categories/sort-order', { categories });
    return response.data;
  },

  /**
   * Get category stats
   * GET /api/categories/stats
   */
  async getStats() {
    const response = await api.get<{ data: CategoryStats }>(
      '/categories/stats'
    );
    return response.data.data;
  },
};

