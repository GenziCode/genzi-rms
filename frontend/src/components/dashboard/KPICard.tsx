import { LucideIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconBgColor?: string;
  iconColor?: string;
}

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  iconBgColor = 'bg-blue-100',
  iconColor = 'text-blue-600',
}: KPICardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${iconBgColor}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {trend && (
          <div
            className={`text-sm font-medium ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.isPositive ? '+' : ''}
            {trend.value}%
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mb-1">
        {typeof value === 'number' && title.toLowerCase().includes('sales')
          ? formatCurrency(value)
          : value}
      </p>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}

export default KPICard;

