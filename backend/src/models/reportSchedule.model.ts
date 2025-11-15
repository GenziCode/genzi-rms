import mongoose, { Schema, Document } from 'mongoose';

/**
 * Report Schedule Model
 * Defines scheduled report executions
 */
export type ReportDeliveryChannel = 'email' | 'webhook' | 'inbox';

export interface IReportSchedule extends Document {
  tenantId: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId; // Reference to ReportTemplate
  name: string; // Schedule name
  description?: string;
  reportKey?: string;
  
  // Schedule configuration
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  schedule: {
    // For daily: { time: '09:00' }
    // For weekly: { dayOfWeek: 1, time: '09:00' } // 0 = Sunday
    // For monthly: { dayOfMonth: 1, time: '09:00' }
    // For custom: { cron: '0 9 * * *' }
    time?: string; // HH:mm format
    dayOfWeek?: number; // 0-6 (Sunday-Saturday)
    dayOfMonth?: number; // 1-31
    daysOfWeek?: number[]; // Multiple weekly selections
    cron?: string; // Cron expression for custom schedules
  };
  
  // Recipients
  recipients: Array<{
    email: string;
    name?: string;
    format: 'pdf' | 'excel' | 'csv' | 'json';
  }>;
  
  // Filter overrides (optional filters to apply to template)
  filterOverrides?: Record<string, unknown>;

  // Delivery preferences
  deliveryChannels: ReportDeliveryChannel[];
  deliveryPreferences?: {
    webhookUrl?: string;
  };
  format: 'pdf' | 'excel' | 'csv';
  timezone: string;
  startDate?: Date;
  endDate?: Date;
  
  // Execution tracking
  lastRun?: Date;
  nextRun: Date; // Calculated next execution time
  lastRunStatus?: 'success' | 'failed' | 'partial';
  lastRunError?: string;
  runCount: number;
  successCount?: number;
  failureCount?: number;
  
  // Status
  isActive: boolean;
  
  // Metadata
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReportScheduleSchema = new Schema<IReportSchedule>(
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    reportKey: {
      type: String,
      trim: true,
      lowercase: true,
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom'],
      required: true,
    },
    schedule: {
      time: {
        type: String,
        match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, // HH:mm format
      },
      dayOfWeek: {
        type: Number,
        min: 0,
        max: 6,
      },
      daysOfWeek: [
        {
          type: Number,
          min: 0,
          max: 6,
        },
      ],
      dayOfMonth: {
        type: Number,
        min: 1,
        max: 31,
      },
      cron: {
        type: String,
        trim: true,
      },
    },
    recipients: [
      {
        email: {
          type: String,
          required: true,
          lowercase: true,
          trim: true,
        },
        name: String,
        format: {
          type: String,
          enum: ['pdf', 'excel', 'csv', 'json'],
          default: 'pdf',
        },
      },
    ],
    filterOverrides: {
      type: Schema.Types.Mixed,
      default: {},
    },
    deliveryChannels: [
      {
        type: String,
        enum: ['email', 'webhook', 'inbox'],
      },
    ],
    deliveryPreferences: {
      webhookUrl: {
        type: String,
        trim: true,
      },
    },
    format: {
      type: String,
      enum: ['pdf', 'excel', 'csv'],
      default: 'pdf',
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    startDate: Date,
    endDate: Date,
    lastRun: Date,
    nextRun: {
      type: Date,
      required: true,
      index: true,
    },
    lastRunStatus: {
      type: String,
      enum: ['success', 'failed', 'partial'],
    },
    lastRunError: String,
    runCount: {
      type: Number,
      default: 0,
    },
    successCount: {
      type: Number,
      default: 0,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
ReportScheduleSchema.index({ tenantId: 1, isActive: 1 });
ReportScheduleSchema.index({ tenantId: 1, templateId: 1 });
ReportScheduleSchema.index({ nextRun: 1, isActive: 1 }); // For scheduler queries
ReportScheduleSchema.index({ tenantId: 1, nextRun: 1 }); // For tenant-specific scheduling

export { ReportScheduleSchema };

