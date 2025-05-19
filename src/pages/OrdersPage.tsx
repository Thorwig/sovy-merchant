import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, Order } from '../services/api';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Clock, Filter, X } from 'lucide-react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

const orderStatusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PICKED_UP: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const orderStatusIcons = {
  PENDING: Clock,
  CONFIRMED: Check,
  PICKED_UP: Check,
  CANCELLED: X,
};

const paymentStatusColors = {
  PENDING: 'bg-red-100 text-red-800',
  PAID: 'bg-green-100 text-green-800',
};

const OrdersPage = () => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [pickupOrder, setPickupOrder] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const queryClient = useQueryClient();
  const { token } = useAuth();

  const updatePaymentStatus = useMutation({
    mutationFn: ({ orderId }: { orderId: string }) =>
      api.updateOrderPaymentStatus(orderId, 'PAID'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-orders'] });
    },
  });

  const updateOrderStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: Order['status'] }) =>
      api.updateOrderStatus(orderId, status),
    onMutate: async ({ orderId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['merchant-orders'] });
      const previousOrders = queryClient.getQueryData(['merchant-orders', currentPage, selectedStatus]);

      if (status === 'PICKED_UP') {
        setPickupOrder(orderId);
        setTimeout(() => {
          setPickupOrder(null);
        }, 2000);
      }

      queryClient.setQueryData(
        ['merchant-orders', currentPage, selectedStatus],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            orders: old.orders.map((order: Order) =>
              order.id === orderId ? { ...order, status } : order
            ),
          };
        }
      );

      return { previousOrders };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(['merchant-orders', currentPage, selectedStatus], context.previousOrders);
      }
      setPickupOrder(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-orders'] });
    },
  });

  useEffect(() => {
    let ws: WebSocket | null = null;

    const connectWebSocket = async () => {
      if (!token) return;

      ws = new WebSocket(`${WS_URL}/orders?token=${token}`);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'ORDER_UPDATED') {
          queryClient.invalidateQueries({ queryKey: ['merchant-orders'] });
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        setTimeout(connectWebSocket, 5000);
      };
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [queryClient, token]);

  const { data, isLoading } = useQuery({
    queryKey: ['merchant-orders', currentPage, selectedStatus],
    queryFn: () =>
      api.getOrders({
        page: currentPage,
        limit: 10,
        status: selectedStatus || undefined,
      }),
  });

  const LoadingSkeleton = () => (
    <>
      {/* Mobile Loading Skeleton */}
      <div className="grid gap-4 lg:hidden">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border bg-card p-4 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="h-4 w-20 rounded bg-gray-200" />
              <div className="h-5 w-24 rounded-full bg-gray-200" />
            </div>
            <div className="space-y-3">
              <div className="h-3 w-32 rounded bg-gray-200" />
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-gray-200" />
                <div className="h-3 w-full rounded bg-gray-200" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="h-4 w-16 rounded bg-gray-200" />
                <div className="h-4 w-24 rounded bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Loading Skeleton */}
      <div className="hidden rounded-lg border bg-card lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-4 text-left" />
                <th className="px-6 py-4 text-left" />
                <th className="px-6 py-4 text-left" />
                <th className="px-6 py-4 text-left" />
                <th className="px-6 py-4 text-left" />
                <th className="px-6 py-4 text-left" />
                <th className="px-6 py-4 text-left" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="h-4 w-20 rounded bg-gray-200" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-32 rounded bg-gray-200" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded bg-gray-200" />
                      <div className="h-3 w-3/4 rounded bg-gray-200" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-24 rounded bg-gray-200" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 w-24 rounded-full bg-gray-200" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 w-20 rounded-full bg-gray-200" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-8 w-20 rounded bg-gray-200" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-8 w-32 animate-pulse rounded bg-gray-200 sm:h-10 sm:w-40" />
          <div className="h-10 w-full animate-pulse rounded bg-gray-200 sm:w-48" />
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  const renderOrderStatus = (status: Order['status']) => {
    const StatusIcon = orderStatusIcons[status];
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${orderStatusColors[status]}`}>
        <StatusIcon className="h-3 w-3" />
        {t(`orders.status.${status.toLowerCase()}`)}
      </span>
    );
  };

  const renderPaymentStatus = (status: Order['paymentStatus']) => (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentStatusColors[status]}`}>
      {t(`orders.payment.${status.toLowerCase()}`)}
    </span>
  );

  const renderActionButtons = (order: Order) => (
    <div className="flex flex-wrap items-center gap-2">
      {order.status === 'PENDING' && (
        <button
          onClick={() => updateOrderStatus.mutate({ orderId: order.id, status: 'CONFIRMED' })}
          className="rounded bg-blue-500 px-2 py-1 text-xs font-medium text-white hover:bg-blue-600"
        >
          {t('orders.actions.confirm')}
        </button>
      )}
      {order.status === 'CONFIRMED' && (
        <button
          onClick={() => updateOrderStatus.mutate({ orderId: order.id, status: 'PICKED_UP' })}
          className="rounded bg-green-500 px-2 py-1 text-xs font-medium text-white hover:bg-green-600"
        >
          {t('orders.actions.pickup')}
        </button>
      )}
      {order.status === 'PENDING' && (
        <button
          onClick={() => updateOrderStatus.mutate({ orderId: order.id, status: 'CANCELLED' })}
          className="rounded bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600"
        >
          {t('orders.actions.cancel')}
        </button>
      )}
      {order.paymentStatus === 'PENDING' && (
        <button
          onClick={() => updatePaymentStatus.mutate({ orderId: order.id })}
          className="rounded bg-green-500 px-2 py-1 text-xs font-medium text-white hover:bg-green-600"
        >
          {t('orders.actions.markPaid')}
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold sm:text-3xl">{t('orders.title')}</h1>
        
        {/* Mobile Filter Button */}
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-sm sm:hidden"
        >
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {selectedStatus ? t(`orders.status.${selectedStatus.toLowerCase()}`) : t('orders.allStatus')}
          </span>
          <ChevronRight className={`h-4 w-4 transition-transform ${isFilterOpen ? 'rotate-90' : ''}`} />
        </button>

        {/* Mobile Filter Dropdown */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden sm:hidden"
            >
              <div className="space-y-2 rounded-md border bg-background p-2">
                {['', 'PENDING', 'CONFIRMED', 'PICKED_UP', 'CANCELLED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setSelectedStatus(status);
                      setIsFilterOpen(false);
                    }}
                    className={`w-full rounded-sm px-3 py-2 text-left text-sm ${
                      selectedStatus === status
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    }`}
                  >
                    {status ? t(`orders.status.${status.toLowerCase()}`) : t('orders.allStatus')}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="hidden rounded-md border bg-background px-3 py-2 text-sm sm:block"
        >
          <option value="">{t('orders.allStatus')}</option>
          <option value="PENDING">{t('orders.status.pending')}</option>
          <option value="CONFIRMED">{t('orders.status.confirmed')}</option>
          <option value="PICKED_UP">{t('orders.status.picked_up')}</option>
          <option value="CANCELLED">{t('orders.status.cancelled')}</option>
        </select>
      </div>

      {/* Mobile View */}
      <div className="grid gap-4 lg:hidden">
        <AnimatePresence>
          {data?.orders.map((order) => (
            <motion.div
              key={order.id}
              initial={false}
              animate={pickupOrder === order.id ? { y: -100, opacity: 0 } : { y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-lg border bg-card p-3 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-medium">#{order.id.slice(-8)}</span>
                {renderOrderStatus(order.status)}
              </div>
              <div className="mb-3 space-y-2 text-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatDateTime(order.createdAt)}</span>
                  {renderPaymentStatus(order.paymentStatus)}
                </div>
                <div className="space-y-1 border-y py-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.foodItem.name}
                      </span>
                      <span className="text-muted-foreground">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span>{t('orders.total')}:</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
              {renderActionButtons(order)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Desktop View */}
      <div className="hidden rounded-lg border bg-card lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  {t('orders.orderId')}
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  {t('orders.date')}
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  {t('orders.items')}
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  {t('orders.total')}
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  {t('orders.status.title')}
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  {t('orders.payment.title')}
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  {t('orders.actions.title')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <AnimatePresence>
                {data?.orders.map((order) => (
                  <motion.tr
                    key={order.id}
                    initial={false}
                    animate={pickupOrder === order.id ? { y: -100, opacity: 0 } : { y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium">#{order.id.slice(-8)}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {order.items.map((item) => (
                          <div key={item.id} className="text-sm">
                            {item.quantity}x {item.foodItem.name}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-6 py-4">{renderOrderStatus(order.status)}</td>
                    <td className="px-6 py-4">
                      {renderPaymentStatus(order.paymentStatus)}
                    </td>
                    <td className="px-6 py-4">
                      {renderActionButtons(order)}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {data && data.total > 10 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1 rounded px-3 py-1.5 text-sm disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t('common.previous')}</span>
          </button>
          <span className="text-sm text-muted-foreground">
            {t('orders.page', { current: currentPage, total: Math.ceil(data.total / 10) })}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(Math.ceil(data.total / 10), p + 1))}
            disabled={currentPage === Math.ceil(data.total / 10)}
            className="inline-flex items-center gap-1 rounded px-3 py-1.5 text-sm disabled:opacity-50"
          >
            <span className="hidden sm:inline">{t('common.next')}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;