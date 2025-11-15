import mongoose, { Schema, Document } from 'mongoose';

/**
 * Report Execution History Model
 * Tracks report execution history for audit and debugging
 */
export interface IReportExecution extends Document {
  tenantId: mongoose.Types.ObjectId;
  templateId?: mongoose.Types.ObjectId; // Optional: if executed from template
  scheduleId?: mongoose.Types.ObjectId; // Optional: if executed from schedule
  
  // Execution details
  reportName: string;
  reportType: 'template' | 'custom' | 'scheduled';
  parameters: Record<string, unknown>; // Filters and parameters used
  
  // Execution status
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // Duration in milliseconds
  
  // Results
  recordCount?: number; // Number of records returned
  fileSize?: number; // File size in bytes (if exported)
  fileUrl?: string; // URL to generated file (if exported)
  fileFormat?: 'pdf' | 'excel' | 'csv' | 'json';
  
  // Error tracking
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  
  // Metadata
  executedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ReportExecutionSchema = new Schema<IReportExecution>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
      index: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'ReportTemplate',
      index: true,
    },
    scheduleId: {
      type: Schema.Types.ObjectId,
      ref: 'ReportSchedule',
      index: true,
    },
    reportName: {
      type: String,
      required: true,
      trim: true,
    },
    reportType: {
      type: String,
      enum: ['template', 'custom', 'scheduled'],
      required: true,
    },
    parameters: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
      required: true,
      default: 'pending',
      index: true,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    completedAt: Date,
    duration: Number,
    recordCount: Number,
    fileSize: Number,
    fileUrl: String,
    fileFormat: {
      type: String,
      enum: ['pdf', 'excel', 'csv', 'json'],
    },
    error: {
      message: {
        type: String,
        required: true,
      },
      stack: String,
      code: String,
    },
    executedBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
ReportExecutionSchema.index({ tenantId: 1, status: 1 });
ReportExecutionSchema.index({ tenantId: 1, startedAt: -1 }); // For recent executions
ReportExecutionSchema.index({ tenantId: 1, templateId: 1, startedAt: -1 });
ReportExecutionSchema.index({ tenantId: 1, scheduleId: 1, startedAt: -1 });
ReportExecutionSchema.index({ executedBy: 1, startedAt: -1 });

// TTL index to auto-delete old executions after 90 days
ReportExecutionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

export { ReportExecutionSchema };

