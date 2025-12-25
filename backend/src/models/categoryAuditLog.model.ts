import { Schema, Document } from 'mongoose';

export interface ICategoryAuditLog extends Document {
  category: Schema.Types.ObjectId;
  user: Schema.Types.ObjectId;
  action: 'create' | 'update' | 'delete';
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  timestamp: Date;
}

export const CategoryAuditLogSchema = new Schema<ICategoryAuditLog>({
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['create', 'update', 'delete'], required: true },
  changes: [{
    field: String,
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
  }],
  timestamp: { type: Date, default: Date.now },
});

CategoryAuditLogSchema.index({ category: 1, timestamp: -1 });