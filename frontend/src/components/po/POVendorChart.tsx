import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface VendorData {
  vendorName: string;
  orders: number;
  value: number;
}

interface POVendorChartProps {
  data: VendorData[];
}

export function POVendorChart({ data }: POVendorChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>No data available</p>
      </div>
    );
  }

  // Limit to top 10 vendors
  const chartData = data.slice(0, 10).map((item) => ({
    name: item.vendorName.length > 15 ? item.vendorName.substring(0, 15) + '...' : item.vendorName,
    orders: item.orders,
    value: item.value,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
        <YAxis 
          dataKey="name" 
          type="category" 
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
          width={120}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Bar dataKey="orders" fill="#3b82f6" name="Orders" radius={[0, 4, 4, 0]} />
        <Bar dataKey="value" fill="#10b981" name="Value ($)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

