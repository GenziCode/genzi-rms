import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface SalesChartProps {
  data: Array<{
    date: string;
    sales: number;
    orders: number;
    revenue: number;
  }>;
  type?: 'line' | 'bar';
}

export default function SalesChart({ data, type = 'line' }: SalesChartProps) {
  const ChartComponent = type === 'line' ? LineChart : BarChart;
  const DataComponent = type === 'line' ? Line : Bar;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) =>
              new Date(value).toLocaleDateString('en', {
                month: 'short',
                day: 'numeric',
              })
            }
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            labelFormatter={(label) => new Date(label).toLocaleDateString()}
          />
          <Legend />
          <DataComponent
            type="monotone"
            dataKey="revenue"
            stroke="#3b82f6"
            fill="#3b82f6"
            name="Revenue"
          />
          <DataComponent
            type="monotone"
            dataKey="orders"
            stroke="#10b981"
            fill="#10b981"
            name="Orders"
          />
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}
