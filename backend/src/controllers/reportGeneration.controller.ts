import { Request, Response, NextFunction } from 'express';
import { TenantRequest } from '../types';
import { reportGenerationService } from '../services/reportGeneration.service';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

/**
 * Report Generation Controller
 * Handles report generation and execution history
 */
export class ReportGenerationController {
  /**
   * Generate report from template
   * POST /api/reports/generate/:templateId
   */
  generateReport = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { templateId } = req.params;
    const { id: userId } = req.user!;
    const parameters = req.body.parameters || {};

    const result = await reportGenerationService.generateReport(
      tenantId,
      templateId,
      parameters,
      userId
    );

    res.json(successResponse(result, 'Report generated successfully'));
  });

  /**
   * Get execution history
   * GET /api/reports/executions
   */
  getExecutionHistory = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const {
      templateId,
      scheduleId,
      status,
      startDate,
      endDate,
      limit,
    } = req.query;

    const filters: any = {};
    if (templateId) filters.templateId = templateId;
    if (scheduleId) filters.scheduleId = scheduleId;
    if (status) filters.status = status;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (limit) filters.limit = parseInt(limit as string);

    const executions = await reportGenerationService.getExecutionHistory(tenantId, filters);
    res.json(successResponse(executions, 'Execution history retrieved successfully'));
  });
}

export const reportGenerationController = new ReportGenerationController();

