import { Schema, Document, Types } from 'mongoose';

export interface IForecastOverride extends Document {
  tenantId: Types.ObjectId;
  product: Types.ObjectId;
  leadTimeDays?: number;
  safetyStockDays?: number;
  notes?: string;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
}

export const ForecastOverrideSchema = new Schema<IForecastOverride>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    leadTimeDays: Number,
    safetyStockDays: Number,
    notes: String,
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  }
);

ForecastOverrideSchema.index({ tenantId: 1, product: 1 }, { unique: true });

