import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AreaChartProps {
  data: Array<Record<string, any>>;
  dataKey: string;
  areas: Array<{
    dataKey: string;
    name: string;
    color: string;
    fillOpacity?: number;
  }>;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  stacked?: boolean;
}

export default function AreaChart({
  data,
  dataKey,
  areas,
  height = 300,
  showLegend = true,
  showGrid = true,
  stacked = false,
}: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            iconType="rect"
            iconSize={12}
          />
        )}
        {areas.map((area, index) => (
          <Area
            key={area.dataKey}
            type="monotone"
            dataKey={area.dataKey}
            name={area.name}
            stackId={stacked ? '1' : undefined}
            stroke={area.color}
            fill={area.color}
            fillOpacity={area.fillOpacity || 0.6}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}

