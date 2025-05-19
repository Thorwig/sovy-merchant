import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Clock,
  DollarSign,
  LayoutDashboard,
  Package,
  ShoppingBag,
} from 'lucide-react';
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
  BarChart,
  Bar,
} from 'recharts';
import type { MerchantStats } from '../types/merchant';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: number;
}

const LoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
    
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-lg border bg-card p-4 sm:p-6"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 animate-pulse bg-gray-200" />
        </div>
      ))}
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-[250px] animate-pulse rounded-lg bg-gray-200 sm:h-[300px]" />
        </div>
      ))}
    </div>
  </div>
);

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="group relative overflow-hidden rounded-lg border bg-card p-4 hover:shadow-md sm:p-6"
  >
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
        {trend !== undefined && (
          <p className={trend >= 0 ? "text-green-600 text-sm" : "text-red-600 text-sm"}>
            {trend >= 0 ? "+" : ""}{trend}% from last week
          </p>
        )}
      </div>
      <div className={`rounded-full bg-${color}/10 p-3 text-${color}`}>
        <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
      </div>
    </div>
    <div className={`absolute inset-x-0 bottom-0 h-1 bg-${color}`} />
  </motion.div>
);

// Sample data for charts
const sampleDailyOrdersData = [
  { name: 'Mon', orders: 4, revenue: 120 },
  { name: 'Tue', orders: 3, revenue: 90 },
  { name: 'Wed', orders: 7, revenue: 210 },
  { name: 'Thu', orders: 5, revenue: 150 },
  { name: 'Fri', orders: 8, revenue: 240 },
  { name: 'Sat', orders: 12, revenue: 360 },
  { name: 'Sun', orders: 9, revenue: 270 },
];

const sampleHourlyOrdersData = [
  { hour: '09:00', orders: 2 },
  { hour: '10:00', orders: 4 },
  { hour: '11:00', orders: 6 },
  { hour: '12:00', orders: 8 },
  { hour: '13:00', orders: 10 },
  { hour: '14:00', orders: 7 },
  { hour: '15:00', orders: 5 },
  { hour: '16:00', orders: 3 },
];

const DashboardPage: React.FC = () => {
  const { data: stats, isLoading } = useQuery<MerchantStats>({
    queryKey: ['merchant-stats'],
    queryFn: api.getMerchantStats,
  });

  const statCards = [
    {
      title: 'Total Orders',
      value: stats?.totalOrders ?? 0,
      icon: ShoppingBag,
      color: 'blue-500',
      trend: 12.5,
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.revenue ?? 0),
      icon: DollarSign,
      color: 'green-500',
      trend: 8.2,
    },
    {
      title: 'Items Saved',
      value: stats?.itemsSaved ?? 0,
      icon: Package,
      color: 'purple-500',
      trend: 15.8,
    },
    {
      title: 'Active Items',
      value: stats?.totalFoodItems ?? 0,
      icon: LayoutDashboard,
      color: 'orange-500',
      trend: -2.4,
    },
  ];

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold sm:text-3xl">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your business.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-lg border bg-card p-4 sm:p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold">Daily Orders</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Overview of orders for the past week
              </p>
            </div>
          </div>
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sampleDailyOrdersData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip />
                <Bar dataKey="orders" fill="currentColor" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-lg border bg-card p-4 sm:p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold">Today's Orders</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Hourly order distribution
              </p>
            </div>
          </div>
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sampleHourlyOrdersData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="currentColor"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;