import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface LineChartProps {
  data: Array<Record<string, any>>;
  dataKey: string;
  lines: Array<{
    dataKey: string;
    name: string;
    color: string;
    strokeWidth?: number;
  }>;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  showDots?: boolean;
}

export default function LineChart({
  data,
  dataKey,
  lines,
  height = 300,
  showLegend = true,
  showGrid = true,
  showDots = true,
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
        <XAxis
          dataKey={dataKey}
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
        />
        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
            iconSize={12}
          />
        )}
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={line.color}
            strokeWidth={line.strokeWidth || 2}
            dot={showDots ? { r: 4, fill: line.color } : false}
            activeDot={{ r: 6 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

