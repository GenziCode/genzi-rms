import api from '@/lib/api';
import type { ExportRequest } from '@/types/export.types';

export const exportService = {
  /**
   * Export data
   * POST /api/export/:entity
   */
  async exportData(request: ExportRequest) {
    const response = await api.post(
      `/export/${request.entity}`,
      {
        format: request.format,
        startDate: request.startDate,
        endDate: request.endDate,
        filters: request.filters,
      },
      {
        responseType: 'blob',
      }
    );
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${request.entity}-export.${request.format === 'excel' ? 'xlsx' : request.format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Import data
   * POST /api/import/:entity
   */
  async importData(entity: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/import/${entity}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  },
};

