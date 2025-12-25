import { getTenantConnection } from '../config/database';
import { CategoryAuditLogSchema, ICategoryAuditLog } from '../models/categoryAuditLog.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export class CategoryAuditService {
  private async getAuditLogModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<ICategoryAuditLog>('CategoryAuditLog', CategoryAuditLogSchema);
  }

  async logChange(
    tenantId: string,
    categoryId: string,
    userId: string,
    action: 'create' | 'update' | 'delete',
    changes: { field: string; oldValue: any; newValue: any }[]
  ): Promise<void> {
    try {
      const AuditLog = await this.getAuditLogModel(tenantId);
      const log = new AuditLog({
        category: categoryId,
        user: userId,
        action,
        changes,
      });
      await log.save();
    } catch (error) {
      logger.error('Failed to log category change:', error);
      // We don't throw an error here because logging should not fail the main operation
    }
  }

  async getAuditTrail(tenantId: string, categoryId: string): Promise<ICategoryAuditLog[]> {
    try {
      const AuditLog = await this.getAuditLogModel(tenantId);
      return await AuditLog.find({ category: categoryId }).sort({ timestamp: -1 }).populate('user', 'name email');
    } catch (error) {
      logger.error(`Failed to get audit trail for category ${categoryId}:`, error);
      throw new AppError('Failed to retrieve audit trail', 500);
    }
  }
}