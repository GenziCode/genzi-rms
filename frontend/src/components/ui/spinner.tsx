import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SpinnerProps extends React.ComponentProps<typeof Loader2> {
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
} as const;

export function Spinner({ className, size = 'md', ...props }: SpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin', sizeClasses[size], className)}
      {...props}
    />
  );
}
