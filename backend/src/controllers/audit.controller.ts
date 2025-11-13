import { Response, NextFunction } from 'express';
import { TenantRequest } from '../types';
import { auditService } from '../services/audit.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export class AuditController {
  /**
   * Get all audit logs
   * GET /api/audit-logs
   */
  getAll = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const {
      userId,
      action,
      entityType,
      entityId,
      startDate,
      endDate,
      page,
      limit,
    } = req.query;

    const filters = {
      userId: userId as string,
      action: action as any,
      entityType: entityType as string,
      entityId: entityId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    };

    const result = await auditService.getAll(tenantId, filters);

    sendSuccess(res, result, 'Audit logs retrieved successfully');
  });

  /**
   * Get logs for specific entity
   * GET /api/audit-logs/entity/:type/:id
   */
  getEntityLogs = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const { type, id } = req.params;
    const { page, limit } = req.query;

    const result = await auditService.getEntityLogs(
      tenantId,
      type,
      id,
      page ? parseInt(page as string) : undefined,
      limit ? parseInt(limit as string) : undefined
    );

    sendSuccess(res, result, 'Entity audit logs retrieved successfully');
  });

  /**
   * Get user activity
   * GET /api/audit-logs/user/:userId
   */
  getUserActivity = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const { userId } = req.params;
    const { page, limit } = req.query;

    const result = await auditService.getUserActivity(
      tenantId,
      userId,
      page ? parseInt(page as string) : undefined,
      limit ? parseInt(limit as string) : undefined
    );

    sendSuccess(res, result, 'User activity retrieved successfully');
  });

  /**
   * Export audit logs
   * GET /api/audit-logs/export
   */
  export = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const { startDate, endDate, userId, entityType } = req.query;

    const csv = await auditService.export(tenantId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      userId: userId as string,
      entityType: entityType as string,
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
    res.send(csv);
  });

  /**
   * Get audit statistics
   * GET /api/audit-logs/statistics
   */
  getStatistics = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const { startDate, endDate } = req.query;

    const stats = await auditService.getStatistics(
      tenantId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    sendSuccess(res, stats, 'Audit statistics retrieved successfully');
  });
}

export const auditController = new AuditController();

