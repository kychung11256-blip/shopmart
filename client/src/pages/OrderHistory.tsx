/**
 * PinKoi - Order History Page
 * Display all user orders with status and details
 */

import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { ChevronRight, Package, Clock, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';

interface Order {
  id: number;
  orderNumber: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  shippingAddress: string | null;
  createdAt: Date | string;
}

export default function OrderHistory() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's orders
  const { data: ordersData, isLoading: isFetching } = trpc.orders.list.useQuery(
    undefined,
    {
      enabled: !!user,
    }
  );

  useEffect(() => {
    if (ordersData) {
      setOrders(ordersData);
      setLoading(false);
    }
  }, [ordersData]);

  if (authLoading || loading || isFetching) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-red-500 rounded-full"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Please Log In</h2>
            <p className="text-gray-600 mb-6">You need to be logged in to view your orders.</p>
            <Button
              onClick={() => navigate('/login')}
              className="bg-red-500 hover:bg-red-600"
            >
              Go to Login
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">View and track all your orders</p>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Yet</h3>
            <p className="text-gray-600 mb-6">You haven't placed any orders yet.</p>
            <Button
              onClick={() => navigate('/products')}
              className="bg-red-500 hover:bg-red-600"
            >
              Start Shopping
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/orders/confirmation?orderId=${order.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {/* Order Number and Date */}
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {order.orderNumber}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Status Badges */}
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                          order.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status === 'completed' && (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        {order.status === 'pending' && (
                          <Clock className="w-4 h-4" />
                        )}
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </span>

                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          order.paymentStatus === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {order.paymentStatus === 'paid'
                          ? 'Paid'
                          : 'Unpaid'}
                      </span>
                    </div>

                    {/* Payment Method */}
                    {order.paymentMethod && (
                      <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                        <CreditCard size={13} className="text-gray-400" />
                        <span className="font-medium">Payment:</span>{' '}
                        <span className="text-gray-700">{order.paymentMethod}</span>
                      </p>
                    )}

                    {/* Delivery Email */}
                    {order.shippingAddress && (
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Delivery Email:</span>{' '}
                        <span className="text-blue-600">{order.shippingAddress}</span>
                      </p>
                    )}
                  </div>

                  {/* Total Price and Arrow */}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-500 mb-2">
                      ${(order.totalPrice / 100).toFixed(2)}
                    </p>
                    <ChevronRight className="w-6 h-6 text-gray-400" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-8">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
