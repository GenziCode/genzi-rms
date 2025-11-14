import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPIWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
  onClick?: () => void;
  loading?: boolean;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    border: 'border-blue-200',
    hover: 'hover:border-blue-300',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    border: 'border-green-200',
    hover: 'hover:border-green-300',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    border: 'border-purple-200',
    hover: 'hover:border-purple-300',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'text-orange-600',
    border: 'border-orange-200',
    hover: 'hover:border-orange-300',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    border: 'border-red-200',
    hover: 'hover:border-red-300',
  },
  indigo: {
    bg: 'bg-indigo-50',
    icon: 'text-indigo-600',
    border: 'border-indigo-200',
    hover: 'hover:border-indigo-300',
  },
};

export default function KPIWidget({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
  onClick,
  loading = false,
}: KPIWidgetProps) {
  const colors = colorClasses[color];

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend.value < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = () => {
    if (!trend) return 'text-gray-600';
    if (trend.value > 0) return 'text-green-600';
    if (trend.value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-xl shadow-sm border-2 ${colors.border} ${colors.hover}
        p-6 transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
        ${loading ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colors.bg}`}>
          {icon || <div className={`w-6 h-6 ${colors.icon}`} />}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>
              {trend.value > 0 ? '+' : ''}
              {trend.value.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        {loading ? (
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
        ) : (
          <>
            <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
            {trend && (
              <p className="text-xs text-gray-500 mt-1">{trend.label}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

