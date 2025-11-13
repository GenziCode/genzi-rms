import { getTenantConnection } from '../config/database';
import { AuditLogSchema, IAuditLog, AuditAction } from '../models/auditLog.model';
import { logger } from '../utils/logger';
import { buildAuditDiff } from '../utils/auditDiff';
import { monitoringService } from '../utils/monitoring';

export class AuditService {
  /**
   * Log an action
   */
  async log(data: {
    tenantId: string;
    userId?: string;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    entityName?: string;
    changes?: Array<{ field: string; oldValue: any; newValue: any }>;
    snapshotBefore?: Record<string, any> | null;
    snapshotAfter?: Record<string, any> | null;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      const tenantConn = await getTenantConnection(data.tenantId);
      const AuditLog = tenantConn.model<IAuditLog>('AuditLog', AuditLogSchema);

      const auditLog = new AuditLog({
        tenantId: data.tenantId,
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        entityName: data.entityName,
        changes: data.changes,
        snapshotBefore: data.snapshotBefore,
        snapshotAfter: data.snapshotAfter,
        metadata: data.metadata,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        timestamp: new Date(),
      });

      await auditLog.save();

      logger.debug(`Audit log created: ${data.action} on ${data.entityType}`);
    } catch (error) {
      // Don't fail the main operation if audit logging fails
      logger.error('Failed to create audit log:', error);
    }
  }

  /**
   * Convenience helper to log create/update/delete mutations
   */
  async logMutation(data: {
    tenantId: string;
    userId?: string;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    entityName?: string;
    before?: any;
    after?: any;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const { changes, snapshotBefore, snapshotAfter } = buildAuditDiff(data.before, data.after);

    if (data.action === 'update' && changes.length === 0) {
      return;
    }

    await this.log({
      tenantId: data.tenantId,
      userId: data.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      entityName: data.entityName,
      changes: changes.length ? changes : undefined,
      snapshotBefore: snapshotBefore ?? undefined,
      snapshotAfter: snapshotAfter ?? undefined,
      metadata: data.metadata,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });

    if (changes.length > 0) {
      monitoringService.trackAuditAnomaly({
        tenantId: data.tenantId,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        details: {
          changeCount: changes.length,
          fields: changes.slice(0, 10).map((change) => change.field),
        },
      });
    }
  }

  /**
   * Get all audit logs with filters
   */
  async getAll(
    tenantId: string,
    filters: {
      userId?: string;
      action?: AuditAction;
      entityType?: string;
      entityId?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const tenantConn = await getTenantConnection(tenantId);
    const AuditLog = tenantConn.model<IAuditLog>('AuditLog', AuditLogSchema);

    const query: any = { tenantId };

    if (filters.userId) query.userId = filters.userId;
    if (filters.action) query.action = filters.action;
    if (filters.entityType) query.entityType = filters.entityType;
    if (filters.entityId) query.entityId = filters.entityId;

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = filters.startDate;
      if (filters.endDate) query.timestamp.$lte = filters.endDate;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const [rawLogs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'firstName lastName email')
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    const logs = rawLogs.map((log: any) => ({
      ...log,
      user:
        log.userId && typeof log.userId === 'object' && !Array.isArray(log.userId)
          ? {
              id: log.userId._id?.toString?.() ?? log.userId._id ?? undefined,
              firstName: log.userId.firstName,
              lastName: log.userId.lastName,
              email: log.userId.email,
            }
          : undefined,
      userId:
        log.userId && typeof log.userId === 'object' && !Array.isArray(log.userId)
          ? log.userId._id?.toString?.()
          : log.userId,
    }));

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get audit logs for specific entity
   */
  async getEntityLogs(
    tenantId: string,
    entityType: string,
    entityId: string,
    page: number = 1,
    limit: number = 50
  ) {
    return this.getAll(tenantId, {
      entityType,
      entityId,
      page,
      limit,
    });
  }

  /**
   * Get user activity
   */
  async getUserActivity(
    tenantId: string,
    userId: string,
    page: number = 1,
    limit: number = 50
  ) {
    return this.getAll(tenantId, {
      userId,
      page,
      limit,
    });
  }

  /**
   * Export audit logs (CSV format)
   */
  async export(
    tenantId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      userId?: string;
      entityType?: string;
    } = {}
  ): Promise<string> {
    const result = await this.getAll(tenantId, { ...filters, limit: 10000 });
    
    // Generate CSV
    const headers = [
      'Timestamp',
      'User',
      'Action',
      'Entity Type',
      'Entity ID',
      'Entity Name',
      'Changes',
      'IP Address',
    ];
    const rows = result.logs.map((log: any) => [
      new Date(log.timestamp).toISOString(),
      log.user
        ? `${log.user.firstName ?? ''} ${log.user.lastName ?? ''}`.trim() || log.user.email || 'System'
        : 'System',
      log.action,
      log.entityType,
      log.entityId || '',
      log.entityName || '',
      Array.isArray(log.changes)
        ? log.changes.map((change: any) => `${change.field}: ${JSON.stringify(change.oldValue)} -> ${JSON.stringify(change.newValue)}`).join('; ')
        : '',
      log.ipAddress || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Get statistics
   */
  async getStatistics(
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalLogs: number;
    byAction: Array<{ action: string; count: number }>;
    byUser: Array<{ userId: string; userName: string; count: number }>;
    byEntityType: Array<{ entityType: string; count: number }>;
  }> {
    const tenantConn = await getTenantConnection(tenantId);
    const AuditLog = tenantConn.model<IAuditLog>('AuditLog', AuditLogSchema);

    const dateFilter: any = { tenantId };
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp.$gte = startDate;
      if (endDate) dateFilter.timestamp.$lte = endDate;
    }

    const [total, byAction, byUser, byEntityType] = await Promise.all([
      AuditLog.countDocuments(dateFilter),
      
      AuditLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { action: '$_id', count: 1, _id: 0 } },
      ]),
      
      AuditLog.aggregate([
        { $match: { ...dateFilter, userId: { $exists: true } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            userId: '$_id',
            userName: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
            count: 1,
            _id: 0,
          },
        },
      ]),
      
      AuditLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$entityType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { entityType: '$_id', count: 1, _id: 0 } },
      ]),
    ]);

    return {
      totalLogs: total,
      byAction,
      byUser,
      byEntityType,
    };
  }
}

export const auditService = new AuditService();

