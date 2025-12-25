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
      message: string;
      meta?: {
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };
    }>('/categories', {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      }
    });
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
    return response.data.data;
  },

  /**
   * Update sort order
   * PUT /api/categories/sort-order
   */
  async updateSortOrder(categories: Array<{ id: string; sortOrder: number }>) {
    const response = await api.put('/categories/sort-order', { categories });
    return response.data.data;
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

  /**
   * Get categories in tree structure
   * GET /api/categories/tree
   */
 async getTree(includeInactive = false) {
   const response = await api.get<{ data: Category[]; success: boolean; message: string }>(`/categories/tree${includeInactive ? '?includeInactive=true' : ''}`);
   return response.data.data;
 },

  /**
   * Search categories
   * GET /api/categories?search=searchTerm
   */
  async search(searchTerm: string) {
    const response = await api.get<{
      success: boolean;
      data: {
        categories: Category[];
        total: number;
        page: number;
        totalPages: number;
      };
      message: string;
      meta?: {
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };
    }>(`/categories?search=${encodeURIComponent(searchTerm)}`);
    return response.data.data.categories;
  },

  /**
   * Get category templates
   * GET /api/categories/templates
   */
  async getTemplates() {
    const response = await api.get<{ data: any[] }>('/categories/templates');
    return response.data.data;
  },

  /**
   * Create category from template
   * POST /api/categories/from-template
   */
  async createFromTemplate(templateId: string, data: { name: string; parent?: string }) {
    const response = await api.post<{ data: Category }>('/categories/from-template', {
      templateId,
      ...data
    });
    return response.data.data;
 },

  /**
   * Save category as template
   * POST /api/categories/save-template
   */
  async saveAsTemplate(categoryId: string, templateName: string) {
    const response = await api.post<{ data: any }>('/categories/save-template', {
      categoryId,
      templateName
    });
    return response.data.data;
  },
  
  /**
   * Get category versions
   * GET /api/categories/:id/versions
   */
  async getCategoryVersions(categoryId: string) {
    const response = await api.get<{ data: any[] }>(
      `/categories/${categoryId}/versions`
    );
    return response.data.data;
  },

  /**
   * Save current category as version
   * POST /api/categories/:id/versions
   */
  async saveCategoryVersion(categoryId: string, notes?: string) {
    const response = await api.post<{ data: any }>(
      `/categories/${categoryId}/versions`,
      { notes }
    );
    return response.data.data;
  },

  /**
   * Restore category from version
   * PUT /api/categories/:id/versions/:versionId/restore
   */
  async restoreCategoryVersion(categoryId: string, versionId: string) {
    const response = await api.put<{ data: Category }>(
      `/categories/${categoryId}/versions/${versionId}/restore`
    );
    return response.data.data;
  },
};

