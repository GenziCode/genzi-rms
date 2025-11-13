import { useState, useCallback } from 'react';
import type { SweetAlertType } from '@/components/ui/SweetAlert';

interface AlertOptions {
  type: SweetAlertType;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  showCancel?: boolean;
  timer?: number;
}

export function useSweetAlert() {
  const [alert, setAlert] = useState<AlertOptions & { show: boolean } | null>(null);

  const showAlert = useCallback((options: AlertOptions) => {
    setAlert({ ...options, show: true });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert(null);
  }, []);

  return {
    showAlert,
    hideAlert,
    alert, // Return alert state instead of JSX
  };
}

// Convenience functions
export const useAlert = () => {
  const { showAlert, hideAlert, alert } = useSweetAlert();

  return {
    success: (title: string, message?: string, onConfirm?: () => void) => {
      showAlert({ type: 'success', title, message, onConfirm });
    },
    error: (title: string, message?: string, onConfirm?: () => void) => {
      showAlert({ type: 'error', title, message, onConfirm });
    },
    warning: (title: string, message?: string, onConfirm?: () => void) => {
      showAlert({ type: 'warning', title, message, onConfirm });
    },
    info: (title: string, message?: string, onConfirm?: () => void) => {
      showAlert({ type: 'info', title, message, onConfirm });
    },
    confirm: (
      title: string,
      message: string,
      onConfirm: () => void | Promise<void>,
      onCancel?: () => void
    ) => {
      showAlert({
        type: 'warning',
        title,
        message,
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        showCancel: true,
        onConfirm,
        onCancel,
      });
    },
    alert, // Return alert state
    hideAlert,
  };
};

