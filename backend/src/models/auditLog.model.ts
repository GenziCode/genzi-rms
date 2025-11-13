import { Schema, Document } from 'mongoose';

export type AuditAction = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'password_change'
  | 'password_reset'
  | 'permission_change'
  | 'status_change'
  | 'export'
  | 'import'
  | 'payment'
  | 'refund';

export interface IAuditLog extends Document {
  tenantId: Schema.Types.ObjectId;
  userId?: Schema.Types.ObjectId;
  action: AuditAction;
  entityType: string; // User, Product, Sale, etc.
  entityId?: Schema.Types.ObjectId;
  entityName?: string; // Friendly name for display
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  snapshotBefore?: Record<string, any>;
  snapshotAfter?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export const AuditLogSchema = new Schema<IAuditLog>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    action: {
      type: String,
      enum: [
        'create',
        'read',
        'update',
        'delete',
        'login',
        'logout',
        'password_change',
        'password_reset',
        'permission_change',
        'status_change',
        'export',
        'import',
        'payment',
        'refund',
      ],
      required: true,
    },
    entityType: {
      type: String,
      required: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      refPath: 'entityType',
    },
    entityName: String,
    changes: [
      {
        field: String,
        oldValue: Schema.Types.Mixed,
        newValue: Schema.Types.Mixed,
        _id: false,
      },
    ],
    snapshotBefore: Schema.Types.Mixed,
    snapshotAfter: Schema.Types.Mixed,
    metadata: {
      type: Schema.Types.Mixed,
    },
    ipAddress: String,
    userAgent: String,
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: false, // Use custom timestamp field
  }
);

// Indexes for efficient querying
AuditLogSchema.index({ tenantId: 1, timestamp: -1 });
AuditLogSchema.index({ tenantId: 1, userId: 1, timestamp: -1 });
AuditLogSchema.index({ tenantId: 1, entityType: 1, entityId: 1 });
AuditLogSchema.index({ tenantId: 1, action: 1, timestamp: -1 });

// TTL index - Auto-delete logs older than 1 year (optional, configure based on compliance needs)
// AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 }); // 1 year

