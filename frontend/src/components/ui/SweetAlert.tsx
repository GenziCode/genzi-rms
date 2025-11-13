import { useEffect, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle, Loader2 } from 'lucide-react';

export type SweetAlertType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface SweetAlertProps {
  type: SweetAlertType;
  title: string;
  message?: string;
  show: boolean;
  onClose: () => void;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  showCancel?: boolean;
  timer?: number; // Auto-close timer in milliseconds
  allowOutsideClick?: boolean;
  allowEscapeKey?: boolean;
}

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
};

const colors = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-600',
    title: 'text-green-900',
    button: 'bg-green-600 hover:bg-green-700',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-600',
    title: 'text-red-900',
    button: 'bg-red-600 hover:bg-red-700',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'text-yellow-600',
    title: 'text-yellow-900',
    button: 'bg-yellow-600 hover:bg-yellow-700',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    title: 'text-blue-900',
    button: 'bg-blue-600 hover:bg-blue-700',
  },
  loading: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    icon: 'text-gray-600',
    title: 'text-gray-900',
    button: 'bg-gray-600 hover:bg-gray-700',
  },
};

export function SweetAlert({
  type,
  title,
  message,
  show,
  onClose,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  showCancel = false,
  timer,
  allowOutsideClick = true,
  allowEscapeKey = true,
}: SweetAlertProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

  useEffect(() => {
    if (show && timer) {
      const timeout = setTimeout(() => {
        handleClose();
      }, timer);
      return () => clearTimeout(timeout);
    }
  }, [show, timer, handleClose]);

  useEffect(() => {
    if (show && allowEscapeKey) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [show, allowEscapeKey, handleClose]);

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    if (!onConfirm || type !== 'loading') {
      handleClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    handleClose();
  };

  if (!show && !isClosing) return null;

  const Icon = icons[type];
  const colorScheme = colors[type];
  const isAnimated = show && !isClosing;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity ${
        isAnimated ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={allowOutsideClick ? handleClose : undefined}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />

      {/* Alert Box */}
      <div
        className={`
          relative bg-white rounded-2xl shadow-2xl max-w-md w-full
          transform transition-all duration-300
          ${isAnimated ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
          ${colorScheme.border} border-2
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        {allowEscapeKey && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`p-3 rounded-full ${colorScheme.bg}`}>
              {type === 'loading' ? (
                <Loader2 className={`w-8 h-8 ${colorScheme.icon} animate-spin`} />
              ) : (
                <Icon className={`w-8 h-8 ${colorScheme.icon}`} />
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className={`text-xl font-bold text-center mb-2 ${colorScheme.title}`}>
            {title}
          </h3>

          {/* Message */}
          {message && (
            <p className="text-gray-600 text-center mb-6">{message}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {showCancel && (
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              disabled={type === 'loading'}
              className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors ${
                colorScheme.button
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

