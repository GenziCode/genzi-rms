import mongoose, { Schema, Document } from 'mongoose';

export interface IFieldPermission extends Document {
  tenantId: mongoose.Types.ObjectId;
  formName: string; // Form this control belongs to
  controlName: string; // Control/field name (e.g., 'productPrice', 'customerEmail')
  controlType: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea' | 'file' | 'other';
  fieldPath?: string; // JSON path to field (e.g., 'product.price', 'customer.contact.email')
  label: string; // Display label
  isVisible: boolean; // Can user see this field?
  isEditable: boolean; // Can user edit this field?
  isRequired: boolean; // Is field required?
  defaultValue?: any; // Default value if not editable
  validationRules?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const FieldPermissionSchema = new Schema<IFieldPermission>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
    },
    formName: {
      type: String,
      required: true,
      trim: true,
    },
    controlName: {
      type: String,
      required: true,
      trim: true,
    },
    controlType: {
      type: String,
      enum: ['text', 'number', 'date', 'select', 'checkbox', 'textarea', 'file', 'other'],
      default: 'text',
    },
    fieldPath: {
      type: String,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    isEditable: {
      type: Boolean,
      default: true,
    },
    isRequired: {
      type: Boolean,
      default: false,
    },
    defaultValue: {
      type: Schema.Types.Mixed,
    },
    validationRules: {
      min: Number,
      max: Number,
      pattern: String,
      minLength: Number,
      maxLength: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
FieldPermissionSchema.index({ tenantId: 1, formName: 1, controlName: 1 }, { unique: true });
FieldPermissionSchema.index({ tenantId: 1, formName: 1 });
FieldPermissionSchema.index({ tenantId: 1, fieldPath: 1 });

export { FieldPermissionSchema };

