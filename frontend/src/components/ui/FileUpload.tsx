import { useState, useRef, ChangeEvent } from 'react';
import {
  Upload,
  X,
  File,
  Image as ImageIcon,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface FileUploadProps {
  /**
   * Callback when file is selected and validated
   */
  onFileSelect: (file: File) => void | Promise<void>;

  /**
   * Accepted file types (MIME types or extensions)
   * Examples: ['image/*', 'image/jpeg', 'image/png', '.pdf', '.csv']
   */
  accept?: string[];

  /**
   * Maximum file size in bytes (default: 10MB)
   */
  maxSize?: number;

  /**
   * Whether to allow multiple files
   */
  multiple?: boolean;

  /**
   * Button label
   */
  label?: string;

  /**
   * Helper text
   */
  helperText?: string;

  /**
   * Whether the upload is disabled
   */
  disabled?: boolean;

  /**
   * Current file name (for display)
   */
  currentFile?: string | null;

  /**
   * Whether to show preview for images
   */
  showPreview?: boolean;

  /**
   * Custom className
   */
  className?: string;
}

/**
 * Standardized File Upload Component
 *
 * Features:
 * - File type validation (images, documents, custom types)
 * - File size validation
 * - Image preview (for image files)
 * - Blob URL handling
 * - Error handling with toast notifications
 */
export default function FileUpload({
  onFileSelect,
  accept = ['*/*'],
  maxSize = 10 * 1024 * 1024, // 10MB default
  multiple = false,
  label = 'Upload File',
  helperText,
  disabled = false,
  currentFile = null,
  showPreview = true,
  className = '',
}: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewImage, setIsPreviewImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImageType = (file: File): boolean => {
    return file.type.startsWith('image/');
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `File size exceeds ${maxSizeMB}MB limit`,
      };
    }

    // Check file type
    if (accept.length > 0 && !accept.includes('*/*')) {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const fileType = file.type.toLowerCase();

      const isAccepted = accept.some((pattern) => {
        // Check MIME type patterns
        if (pattern.includes('*')) {
          const baseType = pattern.split('/')[0];
          return fileType.startsWith(baseType + '/');
        }
        // Check exact MIME type
        if (pattern.includes('/')) {
          return fileType === pattern.toLowerCase();
        }
        // Check file extension
        if (pattern.startsWith('.')) {
          return fileExtension === pattern.toLowerCase();
        }
        return false;
      });

      if (!isAccepted) {
        return {
          valid: false,
          error: `File type not allowed. Accepted types: ${accept.join(', ')}`,
        };
      }
    }

    return { valid: true };
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0]; // Handle first file for now (multiple can be extended)

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Create preview for images
    if (showPreview && isImageType(file)) {
      const blobUrl = URL.createObjectURL(file);
      setPreview(blobUrl);
      setIsPreviewImage(true);
    } else {
      setPreview(null);
      setIsPreviewImage(false);
    }

    // Call onFileSelect callback
    try {
      setIsUploading(true);
      await onFileSelect(file);
      toast.success('File selected successfully');
    } catch (error: any) {
      console.error('File upload error:', error);
      toast.error(error?.message || 'Failed to process file');
      setPreview(null);
      setIsPreviewImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Build accept attribute string
  const acceptString = accept.join(',');

  return (
    <div className={`space-y-2 ${className}`}>
      {/* File Input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptString}
        multiple={multiple}
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {/* Upload Button */}
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={disabled || isUploading}
        className={`
          w-full px-4 py-2 border-2 border-dashed rounded-lg
          flex items-center justify-center gap-2
          transition-colors
          ${
            disabled || isUploading
              ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-white border-gray-300 text-gray-700 hover:border-blue-500 hover:bg-blue-50'
          }
        `}
      >
        {isUploading ? (
          <>
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            <span className="font-medium">{label}</span>
          </>
        )}
      </button>

      {/* Helper Text */}
      {helperText && <p className="text-xs text-gray-500">{helperText}</p>}

      {/* File Info / Preview */}
      {(preview || currentFile) && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-start gap-3">
            {/* Image Preview */}
            {preview && isPreviewImage && (
              <div className="flex-shrink-0">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded border"
                />
              </div>
            )}

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {isPreviewImage && preview ? (
                  <ImageIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-gray-600 flex-shrink-0" />
                )}
                <span className="text-sm font-medium text-gray-900 truncate">
                  {currentFile || 'Selected file'}
                </span>
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="mt-2 text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
