import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Package, ShoppingBag, TrendingUp } from 'lucide-react';
import { api } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const DashboardPage = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['merchant-stats'],
    queryFn: api.getMerchantStats,
  });

  const statCards = [
    {
      title: 'Total Orders',
      value: stats?.totalOrders ?? 0,
      icon: ShoppingBag,
      color: 'text-blue-500',
    },
    {
      title: 'Revenue',
      value: formatCurrency(stats?.revenue ?? 0),
      icon: TrendingUp,
      color: 'text-green-500',
    },
    {
      title: 'Items Saved',
      value: stats?.itemsSaved ?? 0,
      icon: Package,
      color: 'text-purple-500',
    },
    {
      title: 'Active Food Items',
      value: stats?.totalFoodItems ?? 0,
      icon: LayoutDashboard,
      color: 'text-orange-500',
    },
  ];

  // Example data for the chart - in a real app, you'd fetch this from the API
  const chartData = [
    { name: 'Mon', orders: 4 },
    { name: 'Tue', orders: 3 },
    { name: 'Wed', orders: 7 },
    { name: 'Thu', orders: 5 },
    { name: 'Fri', orders: 8 },
    { name: 'Sat', orders: 12 },
    { name: 'Sun', orders: 9 },
  ];

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-muted-foreground">Loading statistics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="rounded-lg border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="mt-2 text-3xl font-bold">{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Orders Over Time</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;