import { useEffect, useState } from 'react';
import api from '../services/api';

interface Stats {
  totalProducts: number;
  totalUsers: number;
  totalStock: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get<{ success: boolean; data: Stats }>('/api/products/stats')
      .then(({ data }) => setStats(data.data))
      .catch(() => setStats(null));
  }, []);

  const cards = [
    { label: 'Total Products', value: stats?.totalProducts ?? '—' },
    { label: 'Total Users', value: stats?.totalUsers ?? '—' },
    {
      label: 'Products + Users',
      value: stats ? stats.totalProducts + stats.totalUsers : '—',
    },
    { label: 'Total Stock', value: stats?.totalStock ?? '—' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-6 shadow">
            <p className="text-gray-500 text-sm">{card.label}</p>
            <p className="text-3xl font-bold mt-2">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
