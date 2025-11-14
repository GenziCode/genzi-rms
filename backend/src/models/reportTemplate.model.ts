import mongoose, { Schema, Document } from 'mongoose';

/**
 * Report Template Model
 * Defines reusable report templates with dynamic query building capabilities
 */
export interface IReportTemplate extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string; // Template name (e.g., "Daily Sales Summary")
  description?: string;
  category: 'sales' | 'inventory' | 'financial' | 'customer' | 'operational' | 'custom';
  module: string; // e.g., 'sales', 'inventory', 'products'
  
  // Query configuration
  query: {
    collection: string; // MongoDB collection name
    baseMatch?: any; // Base filter conditions
    pipeline?: any[]; // Aggregation pipeline stages
  };
  
  // Column configuration
  columns: Array<{
    field: string; // Field path (e.g., 'total', 'product.name')
    label: string; // Display label
    type: 'string' | 'number' | 'date' | 'currency' | 'percentage' | 'boolean';
    format?: string; // Format string (e.g., 'YYYY-MM-DD', '0.00')
    aggregate?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'first' | 'last';
    visible: boolean;
    order: number; // Display order
  }>;
  
  // Filter configuration
  filters: Array<{
    field: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'dateRange' | 'select' | 'multiselect' | 'boolean';
    options?: Array<{ value: string; label: string }>; // For select/multiselect
    defaultValue?: any;
    required: boolean;
  }>;
  
  // Grouping configuration
  grouping?: {
    enabled: boolean;
    fields: Array<{
      field: string;
      label: string;
      order: number;
    }>;
  };
  
  // Sorting configuration
  sorting?: {
    defaultField: string;
    defaultOrder: 'asc' | 'desc';
    allowedFields: string[];
  };
  
  // Formatting options
  format: {
    showHeader: boolean;
    showFooter: boolean;
    showTotals: boolean;
    pageSize?: number;
    orientation?: 'portrait' | 'landscape';
  };
  
  // Metadata
  isSystemTemplate: boolean; // True for built-in templates
  isActive: boolean;
  version: number; // For versioning
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReportTemplateSchema = new Schema<IReportTemplate>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
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
      collection: {
        type: String,
        required: true,
        trim: true,
      },
      baseMatch: {
        type: Schema.Types.Mixed,
        default: {},
      },
      pipeline: {
        type: [Schema.Types.Mixed],
        default: [],
      },
    },
    columns: [
      {
        field: {
          type: String,
          required: true,
        },
        label: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ['string', 'number', 'date', 'currency', 'percentage', 'boolean'],
          required: true,
        },
        format: String,
        aggregate: {
          type: String,
          enum: ['sum', 'avg', 'count', 'min', 'max', 'first', 'last'],
        },
        visible: {
          type: Boolean,
          default: true,
        },
        order: {
          type: Number,
          required: true,
        },
      },
    ],
    filters: [
      {
        field: {
          type: String,
          required: true,
        },
        label: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ['text', 'number', 'date', 'dateRange', 'select', 'multiselect', 'boolean'],
          required: true,
        },
        options: [
          {
            value: String,
            label: String,
          },
        ],
        defaultValue: Schema.Types.Mixed,
        required: {
          type: Boolean,
          default: false,
        },
      },
    ],
    grouping: {
      enabled: {
        type: Boolean,
        default: false,
      },
      fields: [
        {
          field: {
            type: String,
            required: true,
          },
          label: {
            type: String,
            required: true,
          },
          order: {
            type: Number,
            required: true,
          },
        },
      ],
    },
    sorting: {
      defaultField: {
        type: String,
      },
      defaultOrder: {
        type: String,
        enum: ['asc', 'desc'],
        default: 'desc',
      },
      allowedFields: {
        type: [String],
        default: [],
      },
    },
    format: {
      showHeader: {
        type: Boolean,
        default: true,
      },
      showFooter: {
        type: Boolean,
        default: true,
      },
      showTotals: {
        type: Boolean,
        default: true,
      },
      pageSize: {
        type: Number,
        default: 50,
      },
      orientation: {
        type: String,
        enum: ['portrait', 'landscape'],
        default: 'portrait',
      },
    },
    isSystemTemplate: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    version: {
      type: Number,
      default: 1,
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
ReportTemplateSchema.index({ tenantId: 1, category: 1 });
ReportTemplateSchema.index({ tenantId: 1, module: 1 });
ReportTemplateSchema.index({ tenantId: 1, isActive: 1 });
ReportTemplateSchema.index({ tenantId: 1, name: 1 }, { unique: true });
ReportTemplateSchema.index({ tenantId: 1, isSystemTemplate: 1 });

export { ReportTemplateSchema };

