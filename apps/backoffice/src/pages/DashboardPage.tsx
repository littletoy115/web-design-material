import { useEffect, useState } from 'react';
import { Boxes, Layers, Package, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
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
    { label: 'Total Products', value: stats?.totalProducts ?? '—', icon: Package, tint: 'bg-primary/10 text-primary' },
    { label: 'Total Users', value: stats?.totalUsers ?? '—', icon: Users, tint: 'bg-success/12 text-success' },
    {
      label: 'Products + Users',
      value: stats ? stats.totalProducts + stats.totalUsers : '—',
      icon: Layers,
      tint: 'bg-accent text-accent-foreground',
    },
    { label: 'Total Stock', value: stats?.totalStock ?? '—', icon: Boxes, tint: 'bg-primary/10 text-primary' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your workspace</p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tint }) => (
          <Card key={label}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <div className={`flex size-9 items-center justify-center rounded-md ${tint}`}>
                <Icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tracking-tight">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
