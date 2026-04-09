import { useState, useEffect, useRef } from 'react';
import { WhopCheckoutEmbed } from '@whop/checkout/react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, CreditCard, X } from 'lucide-react';
import { NexaPayButton } from '@/components/NexaPayButton';
import TransVoucherPaymentModal from '@/components/TransVoucherPaymentModal';
import EcomTrade24PaymentModal from '@/components/EcomTrade24PaymentModal';
import { useLocation } from 'wouter';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

let stripePromise: ReturnType<typeof loadStripe> | null = null;

const NEXAPAY_PUBLIC_KEY = 'cg_live_9fdbfb12c5cb3a81cd4ac0fdbf1e598dc7c115a8eb708c08328044f16cdf2ee8';

interface CartItem {
  id?: number;
  productId: number;
  quantity: number;
  price: number;
  name: string;
}

function PaymentForm({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

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
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [stripePromiseState, setStripePromiseState] = useState<Awaited<ReturnType<typeof loadStripe>> | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'starpay' | null>(null);
  const [starPayUrl, setStarPayUrl] = useState<string | null>(null);
  const [starPayProduct, setStarPayProduct] = useState<'TRC20Buy' | 'TRC20H5' | 'USDCERC20Buy'>('USDCERC20Buy'); // Use USDCERC20Buy for fiat to crypto conversion
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showGuestForm, setShowGuestForm] = useState<boolean>(false);
  const [showStarPayModal, setShowStarPayModal] = useState<boolean>(false);
  // NexaPay modal removed - now using redirect-based payment
  const [starPayOrderId, setStarPayOrderId] = useState<number | null>(null);
  const [paymentCheckInterval, setPaymentCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [showWhopModal, setShowWhopModal] = useState<boolean>(false);
  const [whopPlanId, setWhopPlanId] = useState<string | null>(null);
  const [whopOrderId, setWhopOrderId] = useState<number | null>(null);
  // EcomTrade24 state
  const [isEcomTrade24Processing, setIsEcomTrade24Processing] = useState<boolean>(false);
  const [showEcomTrade24Modal, setShowEcomTrade24Modal] = useState<boolean>(false);
  const [ecomTrade24CheckoutUrl, setEcomTrade24CheckoutUrl] = useState<string>('');
  const [ecomTrade24SessionId, setEcomTrade24SessionId] = useState<string>('');
  const [ecomTrade24OrderId, setEcomTrade24OrderId] = useState<number>(0);
  const [ecomTrade24OrderTotal, setEcomTrade24OrderTotal] = useState<number>(0);
  // TransVoucher Modal state
  const [showTransVoucherModal, setShowTransVoucherModal] = useState<boolean>(false);
  const [transVoucherEmbedUrl, setTransVoucherEmbedUrl] = useState<string>('');
  const [transVoucherTransactionId, setTransVoucherTransactionId] = useState<string>('');
  const [transVoucherOrderId, setTransVoucherOrderId] = useState<number>(0);
  const [transVoucherOrderTotal, setTransVoucherOrderTotal] = useState<number>(0);
  // Use ref to avoid stale closure in WhopCheckoutEmbed onComplete callback
  const whopOrderIdRef = useRef<number | null>(null);

  // Get cart items from localStorage for guests, or from tRPC for authenticated users
  const { data: authenticatedCartItems } = trpc.cart.list.useQuery(undefined, {
    enabled: isAuthenticated && !loading,
  });

  // Query to check order payment status
  // Allow both authenticated and guest users to check order status
  const { data: orderData, refetch: refetchOrder } = trpc.orders.getById.useQuery(
    starPayOrderId || 0,
    { enabled: !!starPayOrderId && !loading }
  );

  useEffect(() => {
    if (isAuthenticated && authenticatedCartItems) {
      const formattedItems: CartItem[] = authenticatedCartItems.map((item: any) => {
        // 後端已轉換價格，直接使用
        return {
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          name: item.productName,
        };
      });
      setCartItems(formattedItems);
      } else if (!isAuthenticated) {
      // Load from localStorage for guests (shopmart_cart format)
      const savedCart = localStorage.getItem('shopmart_cart');
      if (savedCart) {
        try {
          const items = JSON.parse(savedCart);
          const formattedItems: CartItem[] = items.map((item: any) => {
            // 後端已轉換價格，直接使用
            return {
              productId: item.product.id,
              quantity: item.qty,
              price: item.product.price,
              name: item.product.name,
            };
          });
          setCartItems(formattedItems);
        } catch (e) {
          console.error('Failed to parse guest cart:', e);
        }
      }
    }
  }, [isAuthenticated, authenticatedCartItems, loading]);

  // Listen for localStorage changes (for guest cart updates)
  useEffect(() => {
    const handleCartUpdated = () => {
      if (!isAuthenticated) {
        const savedCart = localStorage.getItem('shopmart_cart');
        if (savedCart) {
          try {
            const items = JSON.parse(savedCart);
            const formattedItems: CartItem[] = items.map((item: any) => {
                return {
                productId: item.product.id,
                quantity: item.qty,
                price: item.product.price,
                name: item.product.name,
              };
            });
            setCartItems(formattedItems);
          } catch (e) {
            console.error('Failed to parse guest cart:', e);
          }
        }
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdated);
    return () => window.removeEventListener('cartUpdated', handleCartUpdated);
  }, [isAuthenticated, loading]);

  // Show guest form if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      setShowGuestForm(true);
    }
  }, [isAuthenticated, loading]);

  // Monitor payment status when Star Pay modal is open
  useEffect(() => {
    if (showStarPayModal && starPayOrderId) {
      // Check payment status every 2 seconds
      const interval = setInterval(async () => {
        await refetchOrder();
      }, 2000);
      setPaymentCheckInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [showStarPayModal, starPayOrderId, refetchOrder]);

  // Auto-close modal and navigate when payment is completed
  useEffect(() => {
    if (showStarPayModal && orderData?.paymentStatus === 'paid') {
      // Payment completed
      setShowStarPayModal(false);
      if (paymentCheckInterval) clearInterval(paymentCheckInterval);
      
      toast.success('Payment successful!');
      
      // Clear cart
      if (isAuthenticated) {
        // Cart will be cleared by the backend
      } else {
        localStorage.removeItem('shopmart_cart');
      }
      
      // Navigate to order confirmation
      navigate(`/orders/confirmation?orderId=${starPayOrderId}`);
    }
  }, [orderData?.paymentStatus, showStarPayModal, starPayOrderId, paymentCheckInterval, isAuthenticated, navigate]);

  // Mutations
  const createOrderMutation = trpc.orders.create.useMutation();
  const createGuestOrderMutation = trpc.orders.createGuest.useMutation();
  const createPaymentIntentMutation = trpc.payments.createPaymentIntent.useMutation();
  const createStarPayOrderMutation = trpc.payments.createStarPayOrder.useMutation();
  const createNexapaySessionMutation = trpc.orders.createNexapaySession.useMutation();
  const createWhopCheckoutMutation = trpc.orders.createWhopCheckout.useMutation();
  const createTransVoucherSessionMutation = trpc.config.createTransVoucherSession.useMutation();
  const createEcomTrade24SessionMutation = trpc.config.createEcomTrade24Session.useMutation();
  const stripeKeyQuery = trpc.config.getStripePublishableKey.useQuery();
  // Fetch enabled payment methods from backend settings
  const { data: paymentMethodsData } = trpc.config.getPaymentMethodsPublic.useQuery();
  const whopEnabled = paymentMethodsData?.whopEnabled ?? true;
  const stripeEnabled = paymentMethodsData?.stripeEnabled ?? false;
  const transVoucherEnabled = paymentMethodsData?.transVoucherEnabled ?? false;
  const ecomTrade24Enabled = paymentMethodsData?.ecomTrade24Enabled ?? false;
  const nexaPayEnabled = paymentMethodsData?.nexaPayEnabled ?? false;

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
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const totalPriceInCents = Math.round(totalPrice * 100);

  const handleNexapaySuccess = async (transaction: any) => {
    try {
      console.log('NexaPay payment successful:', transaction);
      const orderId = sessionStorage.getItem('lastOrderId');
      
      if (!orderId) {
        toast.error('Order ID not found');
        return;
      }
      
      // Show loading toast
      const loadingToastId = toast.loading('Processing payment...');
      
      // Poll for order status update (webhook may take a moment)
      let orderUpdated = false;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout
      
      while (!orderUpdated && attempts < maxAttempts) {
        try {
          const utils = trpc.useUtils();
          const order = await utils.orders.getById.fetch(parseInt(orderId));
          if (order && order.status === 'processing') {
            orderUpdated = true;
            console.log('Order status updated to paid');
            break;
          }
        } catch (err) {
          console.log('Waiting for order status update...');
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      }
      
      // Clear cart
      if (isAuthenticated) {
        // Cart will be cleared by the backend
      } else {
        localStorage.removeItem('shopmart_cart');
      }
      
      // Navigate to order confirmation
      toast.dismiss(loadingToastId);
      toast.success('Payment successful!');
      navigate(`/orders/confirmation?orderId=${orderId}&payment=nexapay`);
    } catch (error: any) {
      console.error('Error handling NexaPay success:', error);
      toast.error('Failed to process payment success');
    }
  };

  const handleNexapayError = (error: any) => {
    console.error('NexaPay payment error:', error);
    toast.error(error?.message || 'Payment failed');
  };

  const handleWhopCheckout = async () => {
    if (!shippingAddress.trim()) { toast.error('Please enter your email address'); return; }
    if (!isAuthenticated && (!guestEmail.trim() || !guestName.trim())) { toast.error('Please enter email and name for guest checkout'); return; }
    if (cartItems.length === 0) { toast.error('Your cart is empty'); return; }
    setIsProcessing(true);
    try {
      let orderResult;
      if (isAuthenticated) {
        orderResult = await createOrderMutation.mutateAsync({
          items: cartItems.map(item => ({ productId: item.productId, quantity: item.quantity })),
          shippingAddress,
        });
      } else {
        orderResult = await createGuestOrderMutation.mutateAsync({
          items: cartItems.map(item => ({ productId: item.productId, quantity: item.quantity })),
          shippingAddress, guestEmail, guestName,
        });
      }
      if (!orderResult.success) throw new Error('Failed to create order');
      const orderId = orderResult.id || 1;
      sessionStorage.setItem('lastOrderId', orderId.toString());
      sessionStorage.setItem('orderCustomerEmail', isAuthenticated ? (user?.email || '') : guestEmail);
      sessionStorage.setItem('orderCustomerName', isAuthenticated ? (user?.name || '') : guestName);
      const origin = window.location.origin;
      const result = await createWhopCheckoutMutation.mutateAsync({
        orderId,
        amount: totalPrice,
        successUrl: `${origin}/orders/confirmation?orderId=${orderId}&payment=whop`,
        cancelUrl: `${origin}/checkout`,
        customerEmail: isAuthenticated ? user?.email || undefined : guestEmail || undefined,
        customerName: isAuthenticated ? user?.name || undefined : guestName || undefined,
      });
      // Open embedded Whop checkout dialog
      setWhopPlanId(result.checkoutConfigId);
      setWhopOrderId(orderId);
      whopOrderIdRef.current = orderId; // Store in ref to avoid stale closure
      setShowWhopModal(true);
    } catch (error: any) {
      console.error('Whop checkout error:', error);
      toast.error(error?.message || 'Failed to create Whop checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTransVoucherCheckout = async () => {
    if (!shippingAddress.trim()) { toast.error('Please enter your email address'); return; }
    if (!isAuthenticated && (!guestEmail.trim() || !guestName.trim())) { toast.error('Please enter email and name for guest checkout'); return; }
    if (cartItems.length === 0) { toast.error('Your cart is empty'); return; }
    setIsProcessing(true);
    try {
      let orderResult;
      if (isAuthenticated) {
        orderResult = await createOrderMutation.mutateAsync({
          items: cartItems.map(item => ({ productId: item.productId, quantity: item.quantity })),
          shippingAddress,
        });
      } else {
        orderResult = await createGuestOrderMutation.mutateAsync({
          items: cartItems.map(item => ({ productId: item.productId, quantity: item.quantity })),
          shippingAddress, guestEmail, guestName,
        });
      }
      if (!orderResult.success) throw new Error('Failed to create order');
      const orderId = orderResult.id || 1;
      sessionStorage.setItem('lastOrderId', orderId.toString());
      sessionStorage.setItem('orderCustomerEmail', isAuthenticated ? (user?.email || '') : guestEmail);
      sessionStorage.setItem('orderCustomerName', isAuthenticated ? (user?.name || '') : guestName);
      const origin = window.location.origin;
      const result = await createTransVoucherSessionMutation.mutateAsync({
        orderId,
        amount: totalPrice,
        currency: 'USD',
        title: `Order #${orderId}`,
        customerEmail: isAuthenticated ? user?.email || undefined : guestEmail || undefined,
        // Omit customerFirstName and customerLastName to avoid TransVoucher validation errors
        // (TransVoucher requires last_name >= 2 chars, which fails for single Chinese names)
        successUrl: `${origin}/orders/confirmation?orderId=${orderId}&payment=transvoucher`,
        cancelUrl: `${origin}/checkout`,
      });
      // Open embedded payment modal instead of redirecting
      setTransVoucherEmbedUrl(result.embedUrl || result.paymentUrl);
      setTransVoucherTransactionId(result.transactionId || '');
      setTransVoucherOrderId(orderId);
      setTransVoucherOrderTotal(totalPrice);
      setShowTransVoucherModal(true);
      toast.success('支付頁面已開啟，請在彈窗中完成付款');
    } catch (error: any) {
      console.error('TransVoucher checkout error:', error);
      toast.error(error?.message || 'Failed to create TransVoucher payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNexapayCheckout = async () => {
    if (!shippingAddress.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    if (!isAuthenticated && (!guestEmail.trim() || !guestName.trim())) {
      toast.error('Please enter email and name for guest checkout');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsProcessing(true);

    try {
      // Create order
      let orderResult;
      if (isAuthenticated) {
        orderResult = await createOrderMutation.mutateAsync({
          items: cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          shippingAddress,
        });
      } else {
        orderResult = await createGuestOrderMutation.mutateAsync({
          items: cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          shippingAddress,
          guestEmail,
          guestName,
        });
      }

      if (!orderResult.success) {
        throw new Error('Failed to create order');
      }

      const orderId = orderResult.id || 1;
      sessionStorage.setItem('lastOrderId', orderId.toString());
      sessionStorage.setItem('orderCustomerEmail', isAuthenticated ? (user?.email || '') : guestEmail);
      sessionStorage.setItem('orderCustomerName', isAuthenticated ? (user?.name || '') : guestName);
      // NexaPayButton will handle redirect, no modal needed
    } catch (error: any) {
      console.error('Nexapay checkout error:', error);
      toast.error(error?.message || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEcomTrade24Checkout = async () => {
    if (!shippingAddress.trim()) { toast.error('Please enter your email address'); return; }
    if (!isAuthenticated && (!guestEmail.trim() || !guestName.trim())) { toast.error('Please enter email and name for guest checkout'); return; }
    if (cartItems.length === 0) { toast.error('Your cart is empty'); return; }
    setIsEcomTrade24Processing(true);
    let redirecting = false;
    try {
      let orderResult;
      if (isAuthenticated) {
        orderResult = await createOrderMutation.mutateAsync({
          items: cartItems.map(item => ({ productId: item.productId, quantity: item.quantity })),
          shippingAddress,
        });
      } else {
        orderResult = await createGuestOrderMutation.mutateAsync({
          items: cartItems.map(item => ({ productId: item.productId, quantity: item.quantity })),
          shippingAddress, guestEmail, guestName,
        });
      }
      if (!orderResult.success) throw new Error('Failed to create order');
      const orderId = orderResult.id || 1;
      sessionStorage.setItem('lastOrderId', orderId.toString());
      sessionStorage.setItem('orderCustomerEmail', isAuthenticated ? (user?.email || '') : guestEmail);
      sessionStorage.setItem('orderCustomerName', isAuthenticated ? (user?.name || '') : guestName);
      const origin = window.location.origin;
      const result = await createEcomTrade24SessionMutation.mutateAsync({
        orderId,
        amount: totalPrice,
        currency: 'USD',
        customerEmail: isAuthenticated ? user?.email || undefined : guestEmail || undefined,
        successUrl: `${origin}/orders/confirmation?orderId=${orderId}&payment=ecomtrade24`,
        cancelUrl: `${origin}/checkout`,
      });
      // Redirect to EcomTrade24 checkout page in the same tab
      if (result.checkoutUrl) {
        redirecting = true;
        // Keep the loading spinner visible during navigation
        // Do NOT reset isEcomTrade24Processing - let the page unload naturally
        window.location.href = result.checkoutUrl;
        return; // prevent finally from resetting state
      } else {
        throw new Error('No checkout URL returned from EcomTrade24');
      }
    } catch (error: any) {
      console.error('EcomTrade24 checkout error:', error);
      toast.error(error?.message || 'Failed to create EcomTrade24 payment');
    } finally {
      // Only reset loading state if we are NOT redirecting
      if (!redirecting) {
        setIsEcomTrade24Processing(false);
      }
    }
  };

  const handleStarPayCheckout = async (product: 'TRC20Buy' | 'TRC20H5' | 'USDCERC20Buy') => {
    if (!shippingAddress.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    if (!isAuthenticated && (!guestEmail.trim() || !guestName.trim())) {
      toast.error('Please enter email and name for guest checkout');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsProcessing(true);

    try {
      // Create order
      let orderResult;
      if (isAuthenticated) {
        orderResult = await createOrderMutation.mutateAsync({
          items: cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          shippingAddress,
        });
      } else {
        orderResult = await createGuestOrderMutation.mutateAsync({
          items: cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          shippingAddress,
          guestEmail,
          guestName,
        });
      }

      if (!orderResult.success) {
        throw new Error('Failed to create order');
      }

      const orderId = orderResult.id || 1;
      sessionStorage.setItem('lastOrderId', orderId.toString());
      setStarPayOrderId(Number(orderId));

      // Create Star Pay order
      const starPayResult = await createStarPayOrderMutation.mutateAsync({
        orderId,
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
        })),
        shippingAddress,
        totalPrice: totalPrice,
        product: starPayProduct, // Use starPayProduct state instead of undefined product
        guestEmail: !isAuthenticated && guestEmail ? guestEmail : '',
        guestName: !isAuthenticated && guestName ? guestName : '',
      });

      if (starPayResult.url) {
        setStarPayUrl(starPayResult.url);
        // Show modal with embedded payment page instead of opening new tab
        setShowStarPayModal(true);
        toast.success('Opening payment page...');
      } else {
        throw new Error('Failed to get payment URL');
      }
    } catch (error: any) {
      console.error('Star Pay checkout error:', error);
      toast.error(error?.message || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripeCheckout = async () => {
    if (!shippingAddress.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    if (!isAuthenticated && (!guestEmail.trim() || !guestName.trim())) {
      toast.error('Please enter email and name for guest checkout');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Check minimum amount for Stripe ($0.50)
    if (totalPrice < 0.50) {
      toast.error('Minimum order amount is $0.50 USD');
      return;
    }

    setIsProcessing(true);

    try {
      // Create order
      let orderResult;
      if (isAuthenticated) {
        orderResult = await createOrderMutation.mutateAsync({
          items: cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          shippingAddress,
        });
      } else {
        orderResult = await createGuestOrderMutation.mutateAsync({
          items: cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          shippingAddress,
          guestEmail,
          guestName,
        });
      }

      if (!orderResult.success) {
        throw new Error('Failed to create order');
      }

      const orderId = orderResult.id || 1;
      sessionStorage.setItem('lastOrderId', orderId.toString());
      sessionStorage.setItem('orderCustomerEmail', isAuthenticated ? (user?.email || '') : guestEmail);
      sessionStorage.setItem('orderCustomerName', isAuthenticated ? (user?.name || '') : guestName);
      setStarPayOrderId(Number(orderId));
      // Create Stripe payment intentt
      const paymentResult = await createPaymentIntentMutation.mutateAsync({
        orderId,
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
        })),
        shippingAddress,
        totalPrice: totalPrice,
      });

      if (paymentResult.clientSecret) {
        setClientSecret(paymentResult.clientSecret);
        setPaymentIntentId(paymentResult.paymentIntentId);
        setPaymentMethod('stripe');
      } else {
        throw new Error('Failed to create payment intent');
      }
    } catch (error: any) {
      console.error('Stripe checkout error:', error);
      toast.error(error?.message || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-red-500" />
      </div>
    );
  }

  // Show Stripe payment form if payment method is selected
  if (paymentMethod === 'stripe' && clientSecret && stripePromiseState) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => {
              setPaymentMethod(null);
              setClientSecret(null);
            }}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 mb-6"
          >
            <ArrowLeft size={20} />
            Back to Checkout
          </button>
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold mb-6">Payment</h2>
            <Elements stripe={stripePromiseState} options={{ clientSecret }}>
              <PaymentForm
                clientSecret={clientSecret}
                onSuccess={() => {
                  toast.success('Payment successful!');
                  navigate(`/orders/confirmation?orderId=${sessionStorage.getItem('lastOrderId')}`);
                }}
              />
            </Elements>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main checkout form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">Checkout</h2>

              {/* Email Address for digital delivery */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address * <span className="text-xs text-gray-400 font-normal">(Your NFT will be delivered to this email)</span>
                </label>
                <input
                  type="email"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full border border-gray-300 rounded px-4 py-2 text-sm outline-none focus:border-red-500"
                />
              </div>

              {/* Guest checkout fields */}
              {!isAuthenticated && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-4">Guest Checkout</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <Input
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <Input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Your Name"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Methods */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
                <div className="space-y-3">
                  {/* Stripe Payment - controlled by admin toggle */}
                  {stripeEnabled && (
                  <button
                    onClick={handleStripeCheckout}
                    disabled={isProcessing}
                    className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CreditCard size={20} className="text-red-500" />
                    <div className="text-left">
                      <div className="font-semibold">Stripe (Visa/Mastercard)</div>
                      <div className="text-sm text-gray-600">Pay securely with your card</div>
                    </div>
                  </button>
                  )}

                  {/* USD PAY (Star Pay) - Hidden, code preserved for future use */}
                  {false && (
                  <button
                    onClick={() => handleStarPayCheckout('TRC20Buy')}
                    disabled={isProcessing}
                    className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-5 h-5 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">$</div>
                    <div className="text-left">
                      <div className="font-semibold">USD PAY</div>
                      <div className="text-sm text-gray-600">Pay with cryptocurrency</div>
                    </div>
                  </button>
                  )}

                  {/* NexaPay Payment - controlled by admin toggle */}
                  {nexaPayEnabled && (
                  <div className="w-full">
                    <NexaPayButton
                      amount={totalPrice}
                      currency="USD"
                      orderId={cartItems.length > 0 ? Math.floor(Math.random() * 1000000) : undefined}
                      onSuccess={handleNexapaySuccess}
                      onError={handleNexapayError}
                      size="default"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    />
                  </div>
                  )}

                  {/* TransVoucher Payment - controlled by admin toggle */}
                  {transVoucherEnabled && (
                  <button
                    onClick={handleTransVoucherCheckout}
                    disabled={isProcessing}
                    className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <Loader2 size={20} className="animate-spin text-blue-600" />
                    ) : (
                      <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">TB</span>
                      </div>
                    )}
                    <div className="text-left">
                      <div className="font-semibold">TrB Pay</div>
                      <div className="text-sm text-gray-600">Pay with visa,master & more</div>
                    </div>
                  </button>
                  )}

                  {/* EcomTrade24 Payment - controlled by admin toggle */}
                  {ecomTrade24Enabled && (
                  <button
                    onClick={handleEcomTrade24Checkout}
                    disabled={isEcomTrade24Processing}
                    className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isEcomTrade24Processing ? (
                      <Loader2 size={20} className="animate-spin text-green-600" />
                    ) : (
                      <div className="w-5 h-5 rounded bg-green-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">E</span>
                      </div>
                    )}
                    <div className="text-left">
                      <div className="font-semibold">Eco Pay</div>
                      <div className="text-sm text-gray-600">Pay with credit card & more</div>
                    </div>
                  </button>
                  )}

                  {/* Whop Payment - controlled by admin toggle */}
                  {whopEnabled && (
                  <button
                    onClick={handleWhopCheckout}
                    disabled={isProcessing}
                    className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <Loader2 size={20} className="animate-spin text-purple-600" />
                    ) : (
                      <div className="w-5 h-5 rounded bg-black flex items-center justify-center">
                        <span className="text-white text-xs font-bold">W</span>
                      </div>
                    )}
                    <div className="text-left">
                      <div className="font-semibold">Whop</div>
                      <div className="text-sm text-gray-600">Pay with Whop — credit card, Apple Pay & more</div>
                    </div>
                  </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-gray-600">Qty: {item.quantity}</div>
                    </div>
                    <div className="font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Star Pay Payment Modal */}
      <Dialog open={showStarPayModal} onOpenChange={(open) => {
        if (!open) {
          setShowStarPayModal(false);
          if (paymentCheckInterval) clearInterval(paymentCheckInterval);
        }
      }}>
        <DialogContent className="max-w-4xl w-full h-screen md:h-auto md:max-h-[90vh] flex flex-col">
          <DialogHeader className="flex items-center justify-between">
            <DialogTitle>Complete Your Payment</DialogTitle>
            <button
              onClick={() => {
                setShowStarPayModal(false);
                if (paymentCheckInterval) clearInterval(paymentCheckInterval);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </DialogHeader>
          
          {starPayUrl ? (
            <div className="flex-1 overflow-hidden">
              <iframe
                src={starPayUrl}
                title="Star Pay Payment"
                className="w-full h-full border-0"
                allow="payment"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-96">
              <Loader2 size={40} className="animate-spin text-red-500" />
            </div>
          )}
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              ℹ️ Your payment will be processed securely. Once completed, you'll be automatically redirected to your order confirmation page.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* NexaPay modal removed - using redirect-based payment */}

      {/* Whop Embedded Checkout Dialog */}
      <Dialog open={showWhopModal} onOpenChange={(open) => { if (!open) setShowWhopModal(false); }}>
        <DialogContent className="max-w-lg w-full p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <DialogHeader className="px-6 pt-5 pb-3 border-b flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-black flex items-center justify-center">
                <span className="text-white text-xs font-bold">W</span>
              </div>
              Whop Checkout
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 overflow-y-auto flex-1">
            {whopPlanId ? (
              <WhopCheckoutEmbed
                sessionId={whopPlanId}
                theme="light"
                skipRedirect={true}
                onComplete={(plan_id, receipt_id) => {
                  setShowWhopModal(false);
                  toast.success(`Payment successful! Receipt: ${receipt_id || plan_id}`);
                  if (!isAuthenticated) {
                    localStorage.removeItem('shopmart_cart');
                  }
                  // Use ref to avoid stale closure; fall back to sessionStorage
                  const confirmedOrderId = whopOrderIdRef.current || sessionStorage.getItem('lastOrderId');
                  console.log('[Whop] onComplete - orderId:', confirmedOrderId, 'plan_id:', plan_id, 'receipt_id:', receipt_id);
                  navigate(`/orders/confirmation?orderId=${confirmedOrderId}&payment=whop`);
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-64">
                <Loader2 size={40} className="animate-spin text-purple-600" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* TransVoucher Embedded Payment Modal */}
      <TransVoucherPaymentModal
        isOpen={showTransVoucherModal}
        embedUrl={transVoucherEmbedUrl}
        transactionId={transVoucherTransactionId}
        orderId={transVoucherOrderId}
        orderTotal={transVoucherOrderTotal}
        onSuccess={() => {
          setShowTransVoucherModal(false);
          if (!isAuthenticated) {
            localStorage.removeItem('shopmart_cart');
          }
          navigate(`/orders/confirmation?orderId=${transVoucherOrderId}&payment=transvoucher`);
        }}
        onCancel={() => {
          setShowTransVoucherModal(false);
        }}
      />

      {/* EcomTrade24 Embedded Payment Modal */}
      <EcomTrade24PaymentModal
        isOpen={showEcomTrade24Modal}
        checkoutUrl={ecomTrade24CheckoutUrl}
        sessionId={ecomTrade24SessionId}
        orderId={ecomTrade24OrderId}
        orderTotal={ecomTrade24OrderTotal}
        onSuccess={() => {
          setShowEcomTrade24Modal(false);
          if (!isAuthenticated) {
            localStorage.removeItem('shopmart_cart');
          }
          navigate(`/orders/confirmation?orderId=${ecomTrade24OrderId}&payment=ecomtrade24`);
        }}
        onCancel={() => {
          setShowEcomTrade24Modal(false);
        }}
      />
    </div>
  );
}
