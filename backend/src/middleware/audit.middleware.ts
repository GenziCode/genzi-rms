import { Response, NextFunction } from 'express';
import { TenantRequest } from '../types';
import { auditService } from '../services/audit.service';
import { AuditAction } from '../models/auditLog.model';
import { logger } from '../utils/logger';
import { getTenantConnection } from '../config/database';
import type { Connection } from 'mongoose';

interface EntityConfig {
  modelName: string;
  displayField?: string;
  fallbackDisplay?: (doc: any) => string | undefined;
  findBy?: (args: { req: TenantRequest; res: Response; responseBody?: any }) => Record<string, any> | null | undefined;
}

const ENTITY_CONFIG: Record<string, EntityConfig> = {
  product: { modelName: 'Product', displayField: 'name' },
  customer: { modelName: 'Customer', displayField: 'name' },
  invoice: { modelName: 'Invoice', displayField: 'invoiceNumber' },
  category: { modelName: 'Category', displayField: 'name' },
  store: { modelName: 'Store', displayField: 'name' },
  user: {
    modelName: 'User',
    fallbackDisplay: (doc) =>
      doc ? `${doc.firstName ?? ''} ${doc.lastName ?? ''}`.trim() || doc.email : undefined,
  },
  vendor: { modelName: 'Vendor', displayField: 'name' },
  payment: {
    modelName: 'Payment',
    fallbackDisplay: (doc) =>
      doc?.reference || doc?.transactionId || doc?.stripePaymentIntentId || doc?._id?.toString(),
    findBy: ({ req, responseBody }) => {
      const body = responseBody?.data ?? responseBody;
      if (body?.payment?._id) return { _id: body.payment._id };
      if (body?.paymentId) return { _id: body.paymentId };
      if (req.params.id) return { _id: req.params.id };
      if (req.body?.paymentId) return { _id: req.body.paymentId };
      if (req.body?.paymentIntentId) return { stripePaymentIntentId: req.body.paymentIntentId };
      return null;
    },
  },
  settings: {
    modelName: 'Settings',
    fallbackDisplay: () => 'Tenant Settings',
    findBy: ({ req }) => ({ tenantId: req.user?.tenantId }),
  },
  webhook: {
    modelName: 'Webhook',
    fallbackDisplay: (doc) => doc?.url,
  },
};

interface AuditMiddlewareOptions {
  action: AuditAction;
  entityType: string;
  resolveEntityId?: (args: {
    req: TenantRequest;
    res: Response;
    responseBody?: any;
  }) => string | undefined;
  metadataBuilder?: (req: TenantRequest, res: Response) => Record<string, any>;
}

export const auditMiddleware = (options: AuditMiddlewareOptions) => {
  return async (req: TenantRequest, res: Response, next: NextFunction) => {
    const { action, entityType } = options;
    const config = ENTITY_CONFIG[entityType];
    const tenantId = req.user?.tenantId;

    if (!tenantId || !config) {
      return next();
    }

    let connection: Connection | null = null;
    let entityId: string | undefined =
      options.resolveEntityId?.({ req, res }) ?? req.params.id ?? req.body?.id;
    let beforeSnapshot: any = null;

    try {
      connection = await getTenantConnection(tenantId);
      if (connection && (action === 'update' || action === 'delete')) {
        const Model = connection.model(config.modelName);
        const query =
          config.findBy?.({ req, res }) ??
          (entityId ? { _id: entityId } : undefined);

        if (query) {
          const doc = await Model.findOne(query).lean();
          beforeSnapshot = doc;
          if (!entityId && doc?._id) {
            entityId = doc._id.toString();
          }
        }
      }
    } catch (error) {
      logger.error('Failed to prepare audit logging context:', error);
    }

    let responseBody: any;

    const originalJson = res.json;
    res.json = function (body: any) {
      responseBody = body;
      return originalJson.call(this, body);
    };

    const originalSend = res.send;
    res.send = function (body: any) {
      try {
        responseBody = typeof body === 'string' ? JSON.parse(body) : body;
      } catch {
        responseBody = body;
      }
      return originalSend.call(this, body);
    };

    res.on('finish', async () => {
      try {
        if (!connection || res.statusCode >= 400) {
          return;
        }

        if (!entityId && responseBody) {
          const data = responseBody?.data ?? responseBody;
          entityId =
            options.resolveEntityId?.({ req, res, responseBody }) ??
            data?._id ??
            data?.id ??
            entityId;
        }

        const Model = connection.model(config.modelName);

        let afterSnapshot: any = null;
        if (action === 'delete') {
          afterSnapshot = null;
        } else {
          const query =
            config.findBy?.({ req, res, responseBody }) ??
            (entityId ? { _id: entityId } : undefined);

          if (query) {
            const doc = await Model.findOne(query).lean();
            afterSnapshot = doc;
            if (!entityId && doc?._id) {
              entityId = doc._id.toString();
            }
          } else if (responseBody?.data) {
            afterSnapshot = responseBody.data;
          }
        }

        const displaySource = afterSnapshot ?? beforeSnapshot;
        const entityName =
          (config.displayField && displaySource?.[config.displayField]) ||
          config.fallbackDisplay?.(displaySource) ||
          undefined;

        const metadata = {
          method: req.method,
          path: req.originalUrl || req.path,
          ...options.metadataBuilder?.(req, res),
        };

        await auditService.logMutation({
          tenantId,
          userId: req.user?.id,
          action,
          entityType,
          entityId,
          entityName,
          before: action === 'create' ? null : beforeSnapshot,
          after: action === 'delete' ? null : afterSnapshot,
          metadata,
          ipAddress: req.ip,
          userAgent: req.get('user-agent') || undefined,
        });
      } catch (error) {
        logger.error('Failed to record audit log:', error);
      }
    });

    next();
  };
};
