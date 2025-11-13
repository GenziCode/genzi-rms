import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface PaymentMethodData {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

interface PaymentMethodsChartProps {
  data: PaymentMethodData[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function PaymentMethodsChart({
  data,
}: PaymentMethodsChartProps) {
  const chartData = data.map((item) => ({
    name: item.method.replace('_', ' ').toUpperCase(),
    value: item.amount,
    count: item.count,
  }));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Payment Methods Distribution
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-6 grid grid-cols-2 gap-4">
        {data.map((item, index) => (
          <div key={item.method} className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <div className="flex-1">
              <p className="text-sm text-gray-600">
                {item.method.replace('_', ' ').toUpperCase()}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(item.amount)}
              </p>
              <p className="text-xs text-gray-500">{item.count} transactions</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
