import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Checkout() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [shippingAddress, setShippingAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: cartItems } = trpc.cart.list.useQuery();
  const createCheckoutSession = trpc.payments.createCheckoutSession.useMutation();
  const createOrder = trpc.orders.create.useMutation();

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      navigate('/');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleProceedToPayment = async () => {
    if (!shippingAddress.trim()) {
      toast.error('Please enter a shipping address');
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsProcessing(true);

    try {
      // Create order first
      const order = await createOrder.mutateAsync({
        items: cartItems.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress,
      });

      // Prepare items for checkout session
      const items = cartItems.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        name: item.name || 'Product',
      }));

      const totalPrice = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

      // Create Stripe checkout session
      const session = await createCheckoutSession.mutateAsync({
        orderId: order.orderId,
        items,
        shippingAddress,
        totalPrice,
      });

      // Redirect to Stripe checkout
      if (session.url) {
        window.location.href = session.url;
      } else {
        toast.error('Failed to create payment session');
        setIsProcessing(false);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to initialize payment');
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const subtotal = cartItems?.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0) || 0;
  const shipping = subtotal > 0 ? 0 : 0;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-red-500 hover:text-red-600 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Cart
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">Checkout</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Address
                </label>
                <textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Enter your full shipping address"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={4}
                  disabled={isProcessing}
                />
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Order Items</h3>
                {cartItems?.map((item: any) => (
                  <div key={item.id} className="flex justify-between py-2 border-b">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleProceedToPayment}
                disabled={isProcessing || createCheckoutSession.isPending || createOrder.isPending}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                {isProcessing && <Loader2 size={20} className="animate-spin" />}
                {isProcessing ? 'Processing...' : 'Proceed to Payment'}
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 h-fit">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>${shipping.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-red-500">${total.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-sm text-gray-500">Your payment is processed securely</p>
          </div>
        </div>
      </div>
    </div>
  );
}
