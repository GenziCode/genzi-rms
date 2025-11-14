import mongoose, { Schema, Document } from 'mongoose';

/**
 * Report Template Version History Model
 * Stores historical versions of report templates for version tracking and rollback
 */
export interface IReportTemplateVersion extends Document {
  tenantId: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId; // Reference to current template
  version: number; // Version number
  
  // Snapshot of template data at this version
  name: string;
  description?: string;
  category: 'sales' | 'inventory' | 'financial' | 'customer' | 'operational' | 'custom';
  module: string;
  query: any;
  columns: any[];
  filters: any[];
  grouping?: any;
  sorting?: any;
  format: any;
  
  // Version metadata
  changeDescription?: string; // What changed in this version
  changedBy: mongoose.Types.ObjectId; // User who made the change
  changedAt: Date;
  isCurrentVersion: boolean; // True for the latest version
}

const ReportTemplateVersionSchema = new Schema<IReportTemplateVersion>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
      index: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'ReportTemplate',
      index: true,
    },
    version: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['sales', 'inventory', 'financial', 'customer', 'operational', 'custom'],
      required: true,
    },
    module: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    query: {
      type: Schema.Types.Mixed,
      required: true,
    },
    columns: {
      type: [Schema.Types.Mixed],
      required: true,
    },
    filters: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    grouping: {
      type: Schema.Types.Mixed,
    },
    sorting: {
      type: Schema.Types.Mixed,
    },
    format: {
      type: Schema.Types.Mixed,
      required: true,
    },
    changeDescription: {
      type: String,
      trim: true,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    changedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isCurrentVersion: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: false, // We use changedAt instead
  }
);

// Indexes for performance
ReportTemplateVersionSchema.index({ tenantId: 1, templateId: 1, version: 1 }, { unique: true });
ReportTemplateVersionSchema.index({ tenantId: 1, templateId: 1, isCurrentVersion: 1 });
ReportTemplateVersionSchema.index({ changedAt: -1 }); // For sorting by date

export { ReportTemplateVersionSchema };

