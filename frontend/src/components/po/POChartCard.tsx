import { ReactNode } from 'react';

interface POChartCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function POChartCard({ title, children, className = '', action }: POChartCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {action && <div>{action}</div>}
      </div>
      <div className="h-64">{children}</div>
    </div>
  );
}

