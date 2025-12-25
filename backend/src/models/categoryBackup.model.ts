import { Schema, Document } from 'mongoose';

export interface ICategoryBackup extends Document {
  tenantId: Schema.Types.ObjectId;
  description?: string;
  categoryData: any[]; // A snapshot of the categories collection
  createdAt: Date;
}

export const CategoryBackupSchema = new Schema<ICategoryBackup>({
  tenantId: { type: Schema.Types.ObjectId, required: true },
  description: String,
  categoryData: [Schema.Types.Mixed],
  createdAt: { type: Date, default: Date.now },
});

CategoryBackupSchema.index({ tenantId: 1, createdAt: -1 });