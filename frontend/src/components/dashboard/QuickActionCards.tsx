import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Package,
  Users,
  FileText,
  TrendingUp,
  Plus,
} from 'lucide-react';

export default function QuickActionCards() {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'New Sale',
      description: 'Process a transaction',
      icon: ShoppingCart,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      path: '/pos',
    },
    {
      title: 'Add Product',
      description: 'Create new product',
      icon: Package,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      path: '/products',
    },
    {
      title: 'New Customer',
      description: 'Add customer',
      icon: Users,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      path: '/customers',
    },
    {
      title: 'Create Invoice',
      description: 'Generate invoice',
      icon: FileText,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      path: '/invoices',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.title}
            onClick={() => navigate(action.path)}
            className={`${action.color} ${action.hoverColor} text-white rounded-lg p-6 transition-all transform hover:scale-105 hover:shadow-lg text-left group`}
          >
            <div className="flex items-start justify-between mb-3">
              <Icon className="w-8 h-8 opacity-90" />
              <Plus className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
            <p className="text-sm opacity-90">{action.description}</p>
          </button>
        );
      })}
    </div>
  );
}
