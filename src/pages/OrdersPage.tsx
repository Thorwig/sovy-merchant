import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

const orderStatusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PICKED_UP: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const paymentStatusColors = {
  PENDING: 'bg-red-100 text-red-800',
  PAID: 'bg-green-100 text-green-800',
};

const OrdersPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [pickupOrder, setPickupOrder] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { token } = useAuth();

  // Add mutation for updating payment status
  const updatePaymentStatus = useMutation({
    mutationFn: ({ orderId }: { orderId: string }) =>
      api.updateOrderPaymentStatus(orderId, 'PAID'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-orders'] });
    },
  });

  // Add mutation for updating order status
  const updateOrderStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      api.updateOrderStatus(orderId, status as any),
    onMutate: async ({ orderId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['merchant-orders'] });
      const previousOrders = queryClient.getQueryData(['merchant-orders', currentPage, selectedStatus]);

      if (status === 'PICKED_UP') {
        setPickupOrder(orderId);
        // After 2 seconds, clear the pickup animation
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
            orders: old.orders.map((order: any) =>
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
          // Invalidate the orders query to trigger a refetch
          queryClient.invalidateQueries({ queryKey: ['merchant-orders'] });
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        // Attempt to reconnect after a delay
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

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-muted-foreground">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Orders</h1>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PICKED_UP">Picked Up</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Order ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Items
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Total
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Payment
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Actions
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
                    <td className="px-6 py-4 text-sm">
                      {formatCurrency(
                        order.items.reduce(
                          (acc, item) => acc + item.price * item.quantity,
                          0
                        )
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          orderStatusColors[order.status]
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          paymentStatusColors[order.paymentStatus]
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {order.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              updateOrderStatus.mutate({
                                orderId: order.id,
                                status: 'CONFIRMED',
                              })
                            }
                            className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() =>
                              updateOrderStatus.mutate({
                                orderId: order.id,
                                status: 'CANCELLED',
                              })
                            }
                            className="rounded bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/90"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      {order.status === 'CONFIRMED' && (
                        <div className="flex gap-2">
                          {order.paymentStatus === 'PENDING' && (
                            <button
                              onClick={() =>
                                updatePaymentStatus.mutate({
                                  orderId: order.id,
                                })
                              }
                              className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                            >
                              Mark as Paid
                            </button>
                          )}
                          {order.paymentStatus === 'PAID' && (
                            <button
                              onClick={() =>
                                updateOrderStatus.mutate({
                                  orderId: order.id,
                                  status: 'PICKED_UP',
                                })
                              }
                              className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                            >
                              Complete Pickup
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {data && data.total > 10 && (
          <div className="flex items-center justify-between border-t px-6 py-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded px-3 py-1 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {Math.ceil(data.total / 10)}
            </span>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(Math.ceil(data.total / 10), p + 1))
              }
              disabled={currentPage >= Math.ceil(data.total / 10)}
              className="rounded px-3 py-1 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;