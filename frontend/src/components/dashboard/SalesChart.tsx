import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import type { SalesTrend } from '@/types/reports.types';

interface SalesChartProps {
  data: SalesTrend[];
  title?: string;
}

function SalesChart({ data, title = 'Sales Trend' }: SalesChartProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            labelFormatter={(label) => {
              const date = new Date(label);
              return date.toLocaleDateString();
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="sales"
            stroke="#3B82F6"
            strokeWidth={2}
            name="Sales"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SalesChart;

