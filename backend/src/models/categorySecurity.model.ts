import { model, Schema, Document, Types } from 'mongoose';

export interface ICategorySecurity extends Document {
  _id: string;
  tenantId: string;
  category: Types.ObjectId; // Reference to Category
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
  encryptionEnabled: boolean;
  accessLoggingEnabled: boolean;
  auditTrailEnabled: boolean;
  ipWhitelist: string[];
  allowedRoles: string[];
  allowedUsers: Types.ObjectId[]; // Specific users allowed access
  blockedRoles: string[];
  blockedUsers: Types.ObjectId[]; // Specific users blocked from access
  lastSecurityReview: Date;
  nextSecurityReview: Date;
  securityNotes: string;
  securityPolicies: string[]; // List of applied security policies
  threatDetectionEnabled: boolean;
  anomalyDetectionEnabled: boolean;
  sensitiveDataProtection: boolean;
  complianceRequirements: string[]; // E.g., GDPR, HIPAA, SOX
  createdAt: Date;
  updatedAt: Date;
}

export const CategorySecuritySchema = new Schema<ICategorySecurity>({
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true,
  },
  securityLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    required: true,
  },
  encryptionEnabled: {
    type: Boolean,
    default: false,
  },
  accessLoggingEnabled: {
    type: Boolean,
    default: true,
  },
  auditTrailEnabled: {
    type: Boolean,
    default: true,
  },
  ipWhitelist: [{
    type: String,
    validate: {
      validator: function(v: string) {
        // Simple IP address validation regex
        return /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}(\/\d{1,3})?$/.test(v);
      },
      message: 'Invalid IP address or CIDR notation'
    }
  }],
  allowedRoles: [{
    type: String,
  }],
  allowedUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  blockedRoles: [{
    type: String,
  }],
  blockedUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  lastSecurityReview: {
    type: Date,
  },
  nextSecurityReview: {
    type: Date,
  },
  securityNotes: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  securityPolicies: [{
    type: String,
    trim: true,
  }],
  threatDetectionEnabled: {
    type: Boolean,
    default: false,
  },
  anomalyDetectionEnabled: {
    type: Boolean,
    default: false,
  },
  sensitiveDataProtection: {
    type: Boolean,
    default: false,
  },
  complianceRequirements: [{
    type: String,
    enum: ['GDPR', 'HIPAA', 'SOX', 'PCI-DSS', 'ISO27001', 'CCPA'],
    trim: true,
  }],
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      (ret as any).id = (ret as any)._id.toString();
      delete (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    }
  }
});

// Compound index for efficient security policy lookups
CategorySecuritySchema.index({ category: 1, tenantId: 1 });
CategorySecuritySchema.index({ securityLevel: 1, tenantId: 1 });

export const CategorySecurity = model<ICategorySecurity>('CategorySecurity', CategorySecuritySchema);