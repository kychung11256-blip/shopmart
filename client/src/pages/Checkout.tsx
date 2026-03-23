import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Checkout() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [shippingAddress, setShippingAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Get cart items
  const { data: cartItems = [] } = trpc.cart.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Mutations
  const createOrderMutation = trpc.orders.create.useMutation();
  const createCheckoutSessionMutation = trpc.payments.createCheckoutSession.useMutation();

  // Calculate total
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0);

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to proceed');
      return;
    }

    if (!shippingAddress.trim()) {
      toast.error('Please enter shipping address');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsProcessing(true);

    try {
      // Create order
      const orderResult = await createOrderMutation.mutateAsync({
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress,
      });

      if (!orderResult.success) {
        throw new Error('Failed to create order');
      }

      // Extract order ID from order number (format: ORD-{timestamp})
      const orderId = parseInt(orderResult.orderNumber.split('-')[1]) || 1;

      // Create Stripe checkout session
      const sessionResult = await createCheckoutSessionMutation.mutateAsync({
        orderId,
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price || 0,
          name: item.productName || `Product ${item.productId}`,
        })),
        shippingAddress,
        totalPrice,
      });

      // Redirect to Stripe checkout
      if (sessionResult.url) {
        window.open(sessionResult.url, '_blank');
        toast.success('Redirecting to payment...');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      const errorMessage = error?.message || 'Failed to process checkout';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin mx-auto mb-4 text-red-500" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 mb-6"
          >
            <ArrowLeft size={20} />
            Back to Home
          </button>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
            <p className="text-gray-600 mb-6">You need to log in to proceed with checkout.</p>
            <Button onClick={() => navigate('/')} className="bg-red-500 hover:bg-red-600">
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-red-500 hover:text-red-600 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Cart
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Order Summary */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">Checkout</h2>

              {/* Shipping Address */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Address
                </label>
                <textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Enter your full shipping address"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={4}
                />
              </div>

              {/* Order Items */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Order Items</h3>
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center border-b pb-4">
                      <div>
                        <p className="font-medium">Product {item.productId}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">${(item.quantity * (item.price || 0)).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={handleCheckout}
                disabled={isProcessing || cartItems.length === 0}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                {isProcessing && <Loader2 size={20} className="animate-spin" />}
                {isProcessing ? 'Processing...' : 'Proceed to Payment'}
              </Button>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="bg-white rounded-lg shadow p-6 h-fit">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>$0.00</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-red-500">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center">
              You will be redirected to Stripe to complete payment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
