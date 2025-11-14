import { useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface OffCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  position?: 'left' | 'right' | 'top' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  allowOutsideClick?: boolean;
  allowEscapeKey?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full',
};

const positionClasses = {
  left: 'left-0 top-0 bottom-0',
  right: 'right-0 top-0 bottom-0',
  top: 'top-0 left-0 right-0',
  bottom: 'bottom-0 left-0 right-0',
};

const positionTransforms = {
  left: {
    open: 'translate-x-0',
    closed: '-translate-x-full',
  },
  right: {
    open: 'translate-x-0',
    closed: 'translate-x-full',
  },
  top: {
    open: 'translate-y-0',
    closed: '-translate-y-full',
  },
  bottom: {
    open: 'translate-y-0',
    closed: 'translate-y-full',
  },
};

export function OffCanvas({
  isOpen,
  onClose,
  title,
  children,
  footer,
  position = 'right',
  size = 'md',
  showCloseButton = true,
  allowOutsideClick = true,
  allowEscapeKey = true,
  className = '',
}: OffCanvasProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && allowEscapeKey) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, allowEscapeKey, onClose]);

  const isVertical = position === 'top' || position === 'bottom';
  const sizeClass = isVertical ? 'h-auto max-h-[80vh]' : `${sizeClasses[size]} h-full`;

  const content = (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={allowOutsideClick ? onClose : undefined}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />

      {/* OffCanvas Panel */}
      <div
        className={`
          fixed ${positionClasses[position]} ${sizeClass}
          bg-white shadow-2xl
          transition-transform duration-300 ease-in-out
          ${isOpen ? positionTransforms[position].open : positionTransforms[position].closed}
          flex flex-col
          overflow-hidden
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
        style={{
          willChange: 'transform',
        }}
      >
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/30 pointer-events-none" />
        
        {/* Content wrapper with relative positioning */}
        <div className="relative flex flex-col h-full z-10">
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 flex-shrink-0 bg-white/95 backdrop-blur-sm">
              {title && (
                <div className="flex-1">
                  {typeof title === 'string' ? (
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900">{title}</h2>
                  ) : (
                    title
                  )}
                </div>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-4 md:p-6">
              {children}
            </div>
          </div>

          {/* Footer - Fixed at bottom */}
          {footer && (
            <div className="border-t border-gray-200 bg-white/95 backdrop-blur-sm flex-shrink-0 p-4 md:p-6 shadow-lg">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Use portal to render outside the normal DOM hierarchy
  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
}
