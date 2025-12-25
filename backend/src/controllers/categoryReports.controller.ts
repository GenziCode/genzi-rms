import { Response, NextFunction } from 'express';
import { TenantRequest } from '../types';
import { CategoryReportsService } from '../services/categoryReports.service';
import { successResponse } from '../utils/response';

export class CategoryReportsController {
  private categoryReportsService: CategoryReportsService;

  constructor() {
    this.categoryReportsService = new CategoryReportsService();
  }

  /**
   * Generate comprehensive category report
   * GET /api/reports/categories/comprehensive
   */
  generateComprehensiveReport = async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;

      const report = await this.categoryReportsService.generateCategoryReport(tenantId);

      res.json(
        successResponse(report, 'Comprehensive category report generated successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generate category usage report
   * GET /api/reports/categories/usage
   */
  generateUsageReport = async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;

      const report = await this.categoryReportsService.generateCategoryUsageReport(tenantId);

      res.json(
        successResponse(report, 'Category usage report generated successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generate category performance report
   * GET /api/reports/categories/performance
   */
  generatePerformanceReport = async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;

      const report = await this.categoryReportsService.generateCategoryPerformanceReport(tenantId);

      res.json(
        successResponse(report, 'Category performance report generated successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generate category hierarchy report
   * GET /api/reports/categories/hierarchy
   */
  generateHierarchyReport = async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;

      const report = await this.categoryReportsService.generateCategoryHierarchyReport(tenantId);

      res.json(
        successResponse(report, 'Category hierarchy report generated successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Export category report in various formats
   * GET /api/reports/categories/export
   */
  exportReport = async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const { format = 'json', type = 'comprehensive' } = req.query as {
        format?: 'json' | 'csv' | 'pdf';
        type?: 'comprehensive' | 'usage' | 'performance' | 'hierarchy';
      };

      let report: any;

      switch (type) {
        case 'usage':
          report = await this.categoryReportsService.generateCategoryUsageReport(tenantId);
          break;
        case 'performance':
          report = await this.categoryReportsService.generateCategoryPerformanceReport(tenantId);
          break;
        case 'hierarchy':
          report = await this.categoryReportsService.generateCategoryHierarchyReport(tenantId);
          break;
        case 'comprehensive':
        default:
          report = await this.categoryReportsService.generateCategoryReport(tenantId);
          break;
      }

      // Set appropriate headers based on format
      switch (format) {
        case 'csv':
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename=category-${type}-report.csv`);
          // Convert report to CSV format (simplified)
          res.send(this.convertToCSV(report));
          break;
        case 'pdf':
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename=category-${type}-report.pdf`);
          // Generate PDF (would require additional implementation)
          res.send('PDF export not yet implemented');
          break;
        case 'json':
        default:
          res.json(
            successResponse(report, `Category ${type} report exported successfully`)
          );
          break;
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Helper to convert report data to CSV format
   */
 private convertToCSV(report: any): string {
    // This is a simplified CSV conversion - a full implementation would need to handle
    // nested objects and arrays appropriately
    if (Array.isArray(report)) {
      if (report.length === 0) return '';
      
      const headers = Object.keys(report[0]);
      const csvRows = [
        headers.join(','),
        ...report.map(row => headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in values
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        }).join(','))
      ];
      
      return csvRows.join('\n');
    } else {
      // For non-array reports, convert to a simple key-value format
      const rows = Object.entries(report).map(([key, value]) => 
        `${key},${typeof value === 'object' ? JSON.stringify(value) : value}`
      );
      return ['Key,Value', ...rows].join('\n');
    }
 }
}