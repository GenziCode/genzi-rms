import { Request, Response, NextFunction } from 'express';
import { CategoryAuditService } from '../services/categoryAudit.service';
import { AppError } from '../utils/appError';

export class CategoryAuditController {
  private auditService: CategoryAuditService;

  constructor() {
    this.auditService = new CategoryAuditService();
  }

  getAuditTrail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        throw new AppError('Tenant ID not found', 400);
      }
      const { categoryId } = req.params;

      const auditTrail = await this.auditService.getAuditTrail(tenantId, categoryId);
      res.status(200).json({ success: true, data: auditTrail });
    } catch (error) {
      next(error);
    }
  };
}