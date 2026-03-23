import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Stripe Promise - will be initialized with publishable key
let stripePromise: ReturnType<typeof loadStripe> | null = null;

function PaymentForm({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error('Payment system not ready');
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Submit the form data to Stripe
      const submitResult = await elements.submit();
      if (submitResult.error) {
        toast.error(submitResult.error.message || 'Form submission failed');
        setIsProcessing(false);
        return;
      }

      // Step 2: Confirm the payment
      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/orders/confirmation`,
        },
      });

      if (error) {
        toast.error(error.message || 'Payment failed');
      } else {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      toast.error('Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        disabled={isProcessing || !stripe || !elements}
        className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
      >
        {isProcessing && <Loader2 size={20} className="animate-spin" />}
        {isProcessing ? 'Processing Payment...' : 'Pay Now'}
      </Button>
    </form>
  );
}

export default function Checkout() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [shippingAddress, setShippingAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [stripePromiseState, setStripePromiseState] = useState<Awaited<ReturnType<typeof loadStripe>> | null>(null);

  // Get cart items
  const { data: cartItems = [] } = trpc.cart.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Mutations
  const createOrderMutation = trpc.orders.create.useMutation();
  const createPaymentIntentMutation = trpc.payments.createPaymentIntent.useMutation();
  const stripeKeyQuery = trpc.config.getStripePublishableKey.useQuery();

  // Initialize Stripe
  useEffect(() => {
    const initStripe = async () => {
      try {
        if (stripeKeyQuery.data?.data) {
          const stripe = await loadStripe(stripeKeyQuery.data.data);
          setStripePromiseState(stripe);
        }
      } catch (error) {
        console.error('Failed to load Stripe:', error);
      }
    };
    initStripe();
  }, [stripeKeyQuery.data]);

  // Calculate total (prices from DB are in cents, convert to dollars for display)
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.quantity * ((item.price || 0) / 100)), 0);
  const totalPriceInCents = Math.round(totalPrice * 100); // For Stripe API

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
      // Create Payment Intent (pass totalPrice in cents for Stripe)
      const paymentResult = await createPaymentIntentMutation.mutateAsync({
        orderId,
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: (item.price || 0) / 100, // Convert cents to dollars for display
          name: item.productName || `Product ${item.productId}`,
        })),
        shippingAddress,
        totalPrice: totalPriceInCents, // Pass in cents for Stripe
      });

      setClientSecret(paymentResult.clientSecret);
      setPaymentIntentId(paymentResult.paymentIntentId);
      sessionStorage.setItem('lastOrderId', orderId.toString());
    } catch (error: any) {
      console.error('Checkout error:', error);
      const errorMessage = error?.message || 'Failed to process checkout';
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast.success('Payment successful! Redirecting to confirmation...');
    setTimeout(() => {
      navigate('/order-confirmation');
    }, 1500);
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

  // Show payment form if client secret is available
  if (clientSecret && stripePromiseState) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => {
              setClientSecret(null);
              setPaymentIntentId(null);
            }}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 mb-6"
          >
            <ArrowLeft size={20} />
            Back to Order
          </button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6">Complete Payment</h2>
                <Elements stripe={stripePromiseState} options={{ clientSecret }}>
                  <PaymentForm clientSecret={clientSecret} onSuccess={handlePaymentSuccess} />
                </Elements>
              </div>
            </div>

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
                Your payment is processed securely
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show checkout form
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
                      <p className="font-semibold">${(item.quantity * ((item.price || 0) / 100)).toFixed(2)}</p>
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
              Secure payment powered by Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
