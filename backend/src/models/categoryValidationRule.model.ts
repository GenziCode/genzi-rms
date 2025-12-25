import { model, Schema, Document } from 'mongoose';

export interface ICategoryValidationRule extends Document {
  _id: string;
 tenantId: string;
  name: string;
  description?: string;
  field: string;
  validationType: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'unique' | 'custom';
  validationValue: string | number | boolean;
  errorMessage: string;
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export const CategoryValidationRuleSchema = new Schema<ICategoryValidationRule>({
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  field: {
    type: String,
    required: true,
    enum: [
      'name',
      'description',
      'color',
      'icon',
      'image',
      'sortOrder',
      'isActive',
      'isPublic',
      'parent',
      'tags',
      'customFields'
    ],
    index: true,
  },
  validationType: {
    type: String,
    required: true,
    enum: ['required', 'minLength', 'maxLength', 'pattern', 'unique', 'custom'],
  },
  validationValue: {
    type: Schema.Types.Mixed,
    required: true,
  },
  errorMessage: {
    type: String,
    required: true,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  priority: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      ret.id = ret._id.toString();
      delete (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    }
  }
});

// Compound index for efficient rule lookups
CategoryValidationRuleSchema.index({ tenantId: 1, field: 1, isActive: 1 });
CategoryValidationRuleSchema.index({ tenantId: 1, validationType: 1 });

export const CategoryValidationRule = model<ICategoryValidationRule>('CategoryValidationRule', CategoryValidationRuleSchema);