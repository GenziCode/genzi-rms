import { Schema, Document } from 'mongoose';

export interface IFile extends Document {
  tenantId: Schema.Types.ObjectId;
  filename: string; // Original filename
  storedFilename: string; // Unique filename in storage
  mimetype: string; // File MIME type
  size: number; // File size in bytes
  path: string; // Storage path
  url: string; // Public URL
  category: 'product_image' | 'logo' | 'document' | 'avatar' | 'other';
  entityType?: string; // Related entity type (Product, Customer, etc.)
  entityId?: Schema.Types.ObjectId; // Related entity ID
  uploadedBy: Schema.Types.ObjectId;
  metadata?: {
    width?: number;
    height?: number;
    thumbnailUrl?: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

export const FileSchema = new Schema<IFile>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
    },
    filename: {
      type: String,
      required: true,
    },
    storedFilename: {
      type: String,
      required: true,
      unique: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
    },
    path: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['product_image', 'logo', 'document', 'avatar', 'other'],
      default: 'other',
      required: true,
    },
    entityType: String,
    entityId: {
      type: Schema.Types.ObjectId,
      refPath: 'entityType',
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
FileSchema.index({ tenantId: 1, category: 1 });
FileSchema.index({ tenantId: 1, entityType: 1, entityId: 1 });
FileSchema.index({ storedFilename: 1 }, { unique: true });

