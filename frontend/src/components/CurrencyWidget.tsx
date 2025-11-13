import { useState } from 'react';
import { DollarSign, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export default function CurrencyWidget() {
  const [base, setBase] = useState('USD');
  const [target, setTarget] = useState('PKR');

  const { data: rates, refetch } = useQuery({
    queryKey: ['rates', base],
    queryFn: async () => {
      try {
        const res = await axios.get(`https://api.exchangerate-api.com/v4/latest/${base}`);
        return res.data.rates;
      } catch {
        return { USD: 1, PKR: 278.5, EUR: 0.92, GBP: 0.79, AED: 3.67, SAR: 3.75, INR: 83.12, CNY: 7.24 };
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const currencies = ['USD', 'PKR', 'EUR', 'GBP', 'AED', 'SAR'];

  return (
    <div className="px-4 py-2 border-b bg-gray-50">
      <div className="flex items-center gap-2 text-sm">
        <DollarSign className="w-4 h-4 text-gray-500" />
        <select
          value={base}
          onChange={(e) => setBase(e.target.value)}
          className="text-sm font-medium bg-transparent border-none focus:ring-0 p-0"
        >
          {currencies.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-gray-400">=</span>
        <span className="font-bold text-gray-900">{rates?.[target]?.toFixed(2) || '...'}</span>
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="text-sm font-medium bg-transparent border-none focus:ring-0 p-0"
        >
          {currencies.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => refetch()} className="ml-auto p-1 hover:bg-gray-200 rounded">
          <RefreshCw className="w-3 h-3 text-gray-500" />
        </button>
      </div>
    </div>
  );
}

