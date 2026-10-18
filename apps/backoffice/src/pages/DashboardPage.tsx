import { Activity, DollarSign, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';

const stats = [
  { label: 'Total Users', value: '—', icon: Users, tint: 'bg-primary/10 text-primary' },
  { label: 'Active Sessions', value: '—', icon: Activity, tint: 'bg-success/12 text-success' },
  { label: 'Revenue', value: '—', icon: DollarSign, tint: 'bg-accent text-accent-foreground' },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your workspace</p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, tint }) => (
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
