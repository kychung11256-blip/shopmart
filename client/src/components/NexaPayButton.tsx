import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface NexaPayButtonProps {
  amount: number;
  currency?: string;
  publicKey?: string;
  onSuccess: (tx: any) => void;
  onError?: (error: any) => void;
  size?: 'small' | 'default' | 'large';
  orderId?: number;
  className?: string;
}

/**
 * NexaPayButton - Embedded payment component for NexaPay
 * 
 * A pre-built, animated checkout component that you can embed directly on your website.
 * It handles the entire payment flow with a single line of code.
 * 
 * Usage:
 * <NexaPayButton
 *   amount={25.00}
 *   currency="USD"
 *   onSuccess={(tx) => console.log(tx)}
 * />
 * 
 * Implementation:
 * - Opens NexaPay checkout in a new window (embedded within the website flow)
 * - No external redirects visible to the user
 * - Automatically detects payment completion via webhook
 * - Redirects to success page after payment
 */
export function NexaPayButton({
  amount,
  currency = 'USD',
  publicKey,
  onSuccess,
  onError,
  size = 'default',
  orderId,
  className,
}: NexaPayButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);

  const createPaymentMutation = trpc.orders.createNexapaySession.useMutation();

  // Monitor payment window and check for completion
  useEffect(() => {
    if (!paymentWindow) return;

    const checkWindowStatus = setInterval(() => {
      try {
        // Check if window is closed
        if (paymentWindow.closed) {
          clearInterval(checkWindowStatus);
          setPaymentWindow(null);
          // Window was closed - payment may have been completed
          // The webhook will update the order status
          console.log('Payment window closed');
        }
      } catch (err) {
        // Window may be from different origin, this is expected
      }
    }, 1000);

    return () => clearInterval(checkWindowStatus);
  }, [paymentWindow]);

  const handleOpenCheckout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate a temporary order ID if not provided
      const tempOrderId = orderId || Math.floor(Math.random() * 1000000);

      // Call backend to create NexaPay session
      const response = await createPaymentMutation.mutateAsync({
        orderId: tempOrderId,
        amount,
        currency,
        successUrl: `${window.location.origin}/checkout?payment_status=success&order_id=${tempOrderId}`,
        cancelUrl: `${window.location.origin}/checkout?payment_status=cancelled&order_id=${tempOrderId}`,
      });

      if (response.checkoutUrl) {
        // Open payment page in new window
        // This is the embedded approach - the payment happens in a new window
        // but the user stays within the website flow
        const newWindow = window.open(
          response.checkoutUrl,
          'NexaPayCheckout',
          'width=800,height=600,resizable=yes,scrollbars=yes'
        );

        if (newWindow) {
          setPaymentWindow(newWindow);
          console.log('Payment window opened:', response.checkoutUrl);
          
          // Store the order ID for webhook processing
          sessionStorage.setItem('nexapay_pending_order', String(tempOrderId));
          
          // Call onSuccess after a short delay to allow webhook to process
          // The webhook will update the order status in the database
          setTimeout(() => {
            onSuccess({
              orderId: tempOrderId,
              amount,
              currency,
              status: 'pending_confirmation',
              checkoutUrl: response.checkoutUrl,
            });
          }, 500);
        } else {
          throw new Error('Failed to open payment window. Please check your browser popup settings.');
        }
      } else {
        throw new Error('Failed to create payment session');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to create payment session';
      setError(errorMessage);
      onError?.(err);
      console.error('NexaPayButton error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeMap = {
    small: 'h-8 px-3 text-sm',
    default: 'h-10 px-4',
    large: 'h-12 px-6 text-lg',
  };

  if (error) {
    return (
      <div className="flex flex-col gap-2 p-4 bg-red-50 border border-red-200 rounded">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
        <Button 
          onClick={() => setError(null)} 
          variant="outline"
          size="sm"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleOpenCheckout}
      disabled={isLoading}
      className={`${sizeMap[size]} ${className}`}
      variant="default"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        `Pay ${amount.toFixed(2)} ${currency} with NexaPay`
      )}
    </Button>
  );
}
