import { ReactNode, useState } from 'react';

interface TooltipProps {
  text: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export default function Tooltip({
  text,
  children,
  position = 'top',
  delay = 200,
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900',
    bottom:
      'bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900',
    right:
      'right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900',
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          className={`
            absolute ${positionClasses[position]} z-[9999]
            px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl
            max-w-xs pointer-events-none
            animate-in fade-in-0 zoom-in-95 duration-200
            whitespace-normal break-words
          `}
          style={{
            ...(position === 'top' && { marginBottom: '8px' }),
            ...(position === 'bottom' && { marginTop: '8px' }),
            ...(position === 'left' && { marginRight: '8px' }),
            ...(position === 'right' && { marginLeft: '8px' }),
          }}
        >
          {text}
          <div className={`absolute ${arrowClasses[position]}`}></div>
        </div>
      )}
    </div>
  );
}
