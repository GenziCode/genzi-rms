import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export interface ReportLayout {
  id: string;
  name: string;
  reportType: string;
  columns: Array<{
    id: string;
    visible: boolean;
    order: number;
    width?: string;
  }>;
  filters: Record<string, any>;
  sortConfig?: {
    key: string;
    direction: 'asc' | 'desc';
  };
  widgetLayout?: Array<{
    id: string;
    type: string;
    position: { x: number; y: number; w: number; h: number };
    config: Record<string, any>;
  }>;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY_PREFIX = 'report_layout_';

export function useReportLayout(reportType: string) {
  const { user } = useAuthStore();
  const [layouts, setLayouts] = useState<ReportLayout[]>([]);
  const [currentLayout, setCurrentLayout] = useState<ReportLayout | null>(null);
  const [loading, setLoading] = useState(false);

  const storageKey = `${STORAGE_KEY_PREFIX}${user?._id}_${reportType}`;

  // Load layouts from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setLayouts(parsed.layouts || []);
        if (parsed.current) {
          setCurrentLayout(parsed.current);
        }
      }
    } catch (error) {
      console.error('Failed to load report layouts:', error);
    }
  }, [storageKey]);

  // Save layouts to localStorage
  const saveLayouts = (newLayouts: ReportLayout[], current?: ReportLayout) => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          layouts: newLayouts,
          current: current || currentLayout,
        })
      );
      setLayouts(newLayouts);
      if (current) {
        setCurrentLayout(current);
      }
    } catch (error) {
      console.error('Failed to save report layouts:', error);
    }
  };

  const saveLayout = (layout: ReportLayout) => {
    setLoading(true);
    try {
      const existingIndex = layouts.findIndex((l) => l.id === layout.id);
      let newLayouts: ReportLayout[];

      if (existingIndex >= 0) {
        // Update existing
        newLayouts = [...layouts];
        newLayouts[existingIndex] = {
          ...layout,
          updatedAt: new Date().toISOString(),
        };
      } else {
        // Add new
        newLayouts = [
          ...layouts,
          {
            ...layout,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
      }

      saveLayouts(newLayouts, layout);
    } finally {
      setLoading(false);
    }
  };

  const deleteLayout = (layoutId: string) => {
    setLoading(true);
    try {
      const newLayouts = layouts.filter((l) => l.id !== layoutId);
      saveLayouts(newLayouts, currentLayout?.id === layoutId ? null : currentLayout);
    } finally {
      setLoading(false);
    }
  };

  const loadLayout = (layoutId: string) => {
    const layout = layouts.find((l) => l.id === layoutId);
    if (layout) {
      setCurrentLayout(layout);
      saveLayouts(layouts, layout);
    }
  };

  const createNewLayout = (
    name: string,
    columns: ReportLayout['columns'],
    filters?: Record<string, any>
  ): ReportLayout => {
    return {
      id: `layout_${Date.now()}`,
      name,
      reportType,
      columns,
      filters: filters || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  return {
    layouts,
    currentLayout,
    loading,
    saveLayout,
    deleteLayout,
    loadLayout,
    createNewLayout,
    setCurrentLayout,
  };
}

