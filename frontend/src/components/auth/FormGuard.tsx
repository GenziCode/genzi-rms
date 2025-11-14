import { ReactNode } from 'react';
import { useCanAccessForm } from '@/hooks/usePermissions';
import { FileText, Lock } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

interface FormGuardProps {
  formName: string;
  fallback?: ReactNode;
  showError?: boolean;
  children: ReactNode;
}

/**
 * Form Guard Component
 * Conditionally renders children based on form access permissions
 */
export default function FormGuard({
  formName,
  fallback,
  showError = false,
  children,
}: FormGuardProps) {
  const { canAccess, isLoading } = useCanAccessForm(formName);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (canAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
        <FileText className="w-12 h-12 text-yellow-600 mb-4" />
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">Form Access Denied</h3>
        <p className="text-sm text-yellow-700 text-center">
          You don't have permission to access this form.
          <span className="block mt-1">
            Form: <code className="bg-yellow-100 px-2 py-1 rounded">{formName}</code>
          </span>
        </p>
      </div>
    );
  }

  return null;
}

