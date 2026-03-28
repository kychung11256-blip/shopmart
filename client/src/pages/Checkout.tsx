import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, CreditCard, X } from 'lucide-react';
import { useLocation } from 'wouter';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

let stripePromise: ReturnType<typeof loadStripe> | null = null;

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
  const [starPayOrderId, setStarPayOrderId] = useState<number | null>(null);
  const [paymentCheckInterval, setPaymentCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastTransactionId, setLastTransactionId] = useState<string | null>(null);
  const [transferStatus, setTransferStatus] = useState<{
    success: boolean;
    status: string;
    transactionHash: string | null;
    message: string;
    errorMessage: string | null;
  } | null>(null);

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
        // Ensure price is in dollars - if it's > 100, it's likely in cents
        const price = item.price > 100 ? item.price / 100 : item.price;
        return {
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          price: price,
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
            // Ensure price is in dollars - if it's > 100, it's likely in cents
            const price = item.product.price > 100 ? item.product.price / 100 : item.product.price;
            return {
              productId: item.product.id,
              quantity: item.qty,
              price: price,
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
              const price = item.product.price > 100 ? item.product.price / 100 : item.product.price;
              return {
                productId: item.product.id,
                quantity: item.qty,
                price: price,
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
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const totalPriceInCents = Math.round(totalPrice * 100);

  const transferNFTMutation = trpc.nftProducts.transferNFT.useMutation();
  const checkTransferStatusMutation = trpc.nftProducts.checkTransferStatus.useQuery(
    { transactionId: lastTransactionId || '' },
    { enabled: false }
  );

  const handleCheckStatus = async () => {
    if (!lastTransactionId) {
      toast.error('No transaction ID found');
      return;
    }

    try {
      setIsProcessing(true);
      const result = await checkTransferStatusMutation.refetch();
      if (result.data) {
        setTransferStatus(result.data);
        if (result.data.success) {
          toast.success('NFT transfer successful!');
        } else if (result.data.message.includes('processing')) {
          toast.info('Transfer is still processing...');
        } else {
          toast.error(result.data.message);
        }
      }
    } catch (error: any) {
      console.error('[Check Status] Error:', error);
      toast.error('Failed to check transfer status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestGift = async () => {
    if (!shippingAddress.trim()) {
      toast.error('Please enter wallet address');
      return;
    }

    setIsProcessing(true);

    try {
      // Get NFT data from localStorage cart
      const savedCart = localStorage.getItem('shopmart_cart');
      if (!savedCart) {
        toast.error('No NFT in cart');
        return;
      }

      const cart = JSON.parse(savedCart);
      if (cart.length === 0) {
        toast.error('No NFT in cart');
        return;
      }

      // Get the first NFT item from cart
      const nftItem = cart[0];
      if (!nftItem.nftData) {
        toast.error('Invalid NFT data in cart');
        return;
      }

      const { contractAddress, tokenId } = nftItem.nftData;

      console.log('[Test Gift] Transferring NFT:', { contractAddress, tokenId, toAddress: shippingAddress });

      const result = await transferNFTMutation.mutateAsync({
        contractAddress,
        tokenId,
        toAddress: shippingAddress,
      });

      if (result.success) {
        toast.success(`NFT transfer initiated! Transaction ID: ${result.transactionId}`);
        // Store transaction ID for status checking
        setLastTransactionId(result.transactionId);
        setTransferStatus(null);
      } else {
        throw new Error('Transfer failed');
      }
    } catch (error: any) {
      console.error('[Test Gift] Error:', error);
      toast.error(error?.message || 'Failed to transfer NFT');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStarPayCheckout = async (product: 'TRC20Buy' | 'TRC20H5' | 'USDCERC20Buy') => {
    if (!shippingAddress.trim()) {
      toast.error('Please enter shipping address');
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
      toast.error('Please enter shipping address');
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
      setStarPayOrderId(Number(orderId));

      // Create Stripe payment intent
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

              {/* Wallet Address */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wallet Address *
                </label>
                <input
                  type="text"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Enter your wallet address (0x...)"
                  className="w-full border border-gray-300 rounded px-4 py-2 text-sm outline-none focus:border-red-500 font-mono"
                />
                <p className="text-xs text-gray-500 mt-2">Your NFT will be transferred to this wallet address</p>
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
                  <button
                    onClick={handleStripeCheckout}
                    disabled={isProcessing}
                    className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CreditCard size={20} className="text-red-500" />
                    <div className="text-left">
                      <div className="font-semibold">St (Visa/Mastercard)</div>
                      <div className="text-sm text-gray-600">Pay securely with your card</div>
                    </div>
                  </button>

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

                  <button
                    onClick={handleTestGift}
                    disabled={isProcessing || !shippingAddress}
                    className="w-full flex items-center gap-3 p-4 border-2 border-yellow-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-yellow-50"
                  >
                    <div className="text-2xl">🎁</div>
                    <div className="text-left">
                      <div className="font-semibold text-yellow-700">Test Gift (Demo)</div>
                      <div className="text-sm text-yellow-600">Simulate NFT transfer</div>
                    </div>
                  </button>

                  {lastTransactionId && (
                    <button
                      onClick={handleCheckStatus}
                      disabled={isProcessing}
                      className="w-full flex items-center gap-3 p-4 border-2 border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-blue-50"
                    >
                      <div className="text-2xl">🔍</div>
                      <div className="text-left">
                        <div className="font-semibold text-blue-700">Check Transfer Status</div>
                        <div className="text-sm text-blue-600">Query transaction status</div>
                      </div>
                    </button>
                  )}
                </div>

                {transferStatus && (
                  <div className={`mt-6 p-4 rounded-lg border-2 ${
                    transferStatus.success
                      ? 'bg-green-50 border-green-300'
                      : 'bg-red-50 border-red-300'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{transferStatus.success ? '✅' : '❌'}</div>
                      <div className="flex-1">
                        <h4 className={`font-semibold ${
                          transferStatus.success ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {transferStatus.success ? 'Transfer Successful' : 'Transfer Failed'}
                        </h4>
                        <p className={`text-sm mt-1 ${
                          transferStatus.success ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transferStatus.message}
                        </p>
                        {transferStatus.transactionHash && (
                          <div className="mt-3 bg-white rounded p-3 font-mono text-xs break-all">
                            <p className="text-gray-600 mb-1">Transaction Hash:</p>
                            <p className="text-gray-800">{transferStatus.transactionHash}</p>
                          </div>
                        )}
                        {transferStatus.errorMessage && (
                          <div className="mt-3 bg-white rounded p-3 text-xs">
                            <p className="text-gray-600 mb-1">Error Details:</p>
                            <p className="text-red-600">{transferStatus.errorMessage}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
    </div>
  );
}
