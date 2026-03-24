import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, CreditCard } from 'lucide-react';
import { useLocation } from 'wouter';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

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
      const submitResult = await elements.submit();
      if (submitResult.error) {
        toast.error(submitResult.error.message || 'Form submission failed');
        setIsProcessing(false);
        return;
      }

      const orderId = sessionStorage.getItem('lastOrderId');
      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: orderId 
            ? `${window.location.origin}/orders/confirmation?orderId=${orderId}`
            : `${window.location.origin}/orders/confirmation`,
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
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'starpay' | null>(null);
  const [starPayUrl, setStarPayUrl] = useState<string | null>(null);
  const [starPayProduct, setStarPayProduct] = useState<'TRC20Buy' | 'TRC20H5' | 'USDCERC20Buy'>('TRC20Buy');

  // Get cart items
  const { data: cartItems = [] } = trpc.cart.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Mutations
  const createOrderMutation = trpc.orders.create.useMutation();
  const createPaymentIntentMutation = trpc.payments.createPaymentIntent.useMutation();
  const createStarPayOrderMutation = trpc.payments.createStarPayOrder.useMutation();
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

  // Calculate total
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.quantity * ((item.price || 0) / 100)), 0);
  const totalPriceInCents = Math.round(totalPrice * 100);

  const handleStarPayCheckout = async (product: 'TRC20Buy' | 'TRC20H5' | 'USDCERC20Buy') => {
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

      const orderId = orderResult.id || 1;

      // Create Star Pay order
      const starPayResult = await createStarPayOrderMutation.mutateAsync({
        orderId,
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: (item.price || 0) / 100,
          name: item.productName || `Product ${item.productId}`,
        })),
        shippingAddress,
        totalPrice,
        product,
      });

      setStarPayUrl(starPayResult.url);
      setPaymentMethod('starpay');
      setStarPayProduct(product);
      sessionStorage.setItem('lastOrderId', orderId.toString());
      toast.success('Star Pay payment form loaded');
    } catch (error: any) {
      console.error('Star Pay checkout error:', error);
      const errorMessage = error?.message || 'Failed to process Star Pay checkout';
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

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

      const orderId = orderResult.id || 1;
      // Create Payment Intent
      const paymentResult = await createPaymentIntentMutation.mutateAsync({
        orderId,
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: (item.price || 0) / 100,
          name: item.productName || `Product ${item.productId}`,
        })),
        shippingAddress,
        totalPrice: totalPriceInCents,
      });

      setClientSecret(paymentResult.clientSecret);
      setPaymentIntentId(paymentResult.paymentIntentId);
      setPaymentMethod('stripe');
      sessionStorage.setItem('lastOrderId', orderId.toString());
    } catch (error: any) {
      console.error('Checkout error:', error);
      const errorMessage = error?.message || 'Failed to process checkout';
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async () => {
    toast.success('Payment successful! Redirecting to confirmation...');
    const orderId = sessionStorage.getItem('lastOrderId');
    
    if (orderId) {
      try {
        const markAsPaidMutation = trpc.orders.markAsPaid.useMutation();
        await markAsPaidMutation.mutateAsync(parseInt(orderId));
        console.log(`Order ${orderId} marked as paid`);
      } catch (error) {
        console.error('Error marking order as paid:', error);
      }
    }
    
    setTimeout(() => {
      if (orderId) {
        navigate(`/orders/confirmation?orderId=${orderId}`);
      } else {
        navigate('/orders/confirmation');
      }
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

  // Show Star Pay iFrame if payment method is starpay
  if (paymentMethod === 'starpay' && starPayUrl) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => {
              setPaymentMethod(null);
              setStarPayUrl(null);
            }}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 mb-6"
          >
            <ArrowLeft size={20} />
            Back to Payment Method
          </button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6">Complete Payment</h2>
                <p className="text-gray-600 mb-4">
                  You will be redirected to CI to complete your payment. Your transaction is secure and encrypted.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> You can pay with Visa, Mastercard, or other payment methods supported by Star Pay.
                  </p>
                </div>
                <style>{`
                  /* Hide non-Visa/Mastercard payment methods in Star Pay iframe */
                  iframe[title="Star Pay Payment Form"] {
                    display: block;
                  }
                  
                  /* Hide cryptocurrency payment options */
                  iframe[title="Star Pay Payment Form"] ~ * [data-payment-method*="crypto"],
                  iframe[title="Star Pay Payment Form"] ~ * [data-payment-method*="usdt"],
                  iframe[title="Star Pay Payment Form"] ~ * [data-payment-method*="usdc"],
                  iframe[title="Star Pay Payment Form"] ~ * [class*="crypto"],
                  iframe[title="Star Pay Payment Form"] ~ * [class*="usdt"],
                  iframe[title="Star Pay Payment Form"] ~ * [class*="usdc"] {
                    display: none !important;
                  }
                `}</style>
                <iframe
                  src={starPayUrl}
                  style={{
                    width: '100%',
                    height: '600px',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                  title="Star Pay Payment Form"
                  onLoad={(e) => {
                    // Attempt to hide non-Visa/Mastercard payment methods inside iframe
                    try {
                      const iframeElement = e.currentTarget as HTMLIFrameElement;
                      const iframeDoc = iframeElement.contentDocument || iframeElement.contentWindow?.document;
                      if (iframeDoc) {
                        // Hide elements containing 'usdt', 'usdc', 'crypto' keywords
                        const elementsToHide = iframeDoc.querySelectorAll(
                          '[class*="usdt"], [class*="usdc"], [class*="crypto"], '
                          + '[data-payment*="usdt"], [data-payment*="usdc"], [data-payment*="crypto"]'
                        );
                        elementsToHide.forEach((el: Element) => {
                          (el as HTMLElement).style.display = 'none';
                        });
                        
                        // Also hide by text content
                        const allElements = iframeDoc.querySelectorAll('*');
                        allElements.forEach((el: Element) => {
                          const htmlEl = el as HTMLElement;
                          const text = el.textContent?.toLowerCase() || '';
                          if ((text.includes('usdt') || text.includes('usdc') || text.includes('crypto')) && htmlEl.offsetHeight > 0) {
                            // Only hide if it's likely a payment method selector
                            if (el.tagName === 'BUTTON' || el.tagName === 'DIV' || el.tagName === 'LABEL') {
                              htmlEl.style.display = 'none';
                            }
                          }
                        });
                      }
                    } catch (err) {
                      console.log('Cannot access iframe content (cross-origin):', err);
                    }
                  }}
                />
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
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-green-800">
                  ✓ Secure payment processing
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show Stripe payment form if client secret is available
  if (clientSecret && stripePromiseState && paymentMethod === 'stripe') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => {
              setClientSecret(null);
              setPaymentIntentId(null);
              setPaymentMethod(null);
            }}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 mb-6"
          >
            <ArrowLeft size={20} />
            Back to Payment Method
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

  // Show checkout form with payment method selection
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
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center pb-3 border-b">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">${((item.price || 0) / 100 * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
                <div className="space-y-3">
                  {/* Stripe Option */}
                  <button
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard size={24} className="text-red-500" />
                      <div>
                        <p className="font-semibold">Stripe (Visa/Mastercard)</p>
                        <p className="text-sm text-gray-600">Secure payment with Stripe</p>
                      </div>
                    </div>
                  </button>

                  {/* Star Pay Options - Only show TRC20Buy */}
                  <div className="border-t pt-4">
                    <div className="space-y-2">
                      <button
                        onClick={() => handleStarPayCheckout('TRC20Buy')}
                        disabled={isProcessing}
                        className="w-full p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            ⚡
                          </div>
                          <div>
                            <p className="font-semibold text-sm">USDT (TRC20) - Visa/Mastercard</p>
                            <p className="text-xs text-gray-600">Pay with Star Pay</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {isProcessing && (
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Loader2 size={20} className="animate-spin" />
                  <span>Processing...</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
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
