import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface NexaPayButtonProps {
  amount: number;
  currency?: string;
  publicKey?: string;
  onSuccess: (tx: any) => void;
  onError?: (error: any) => void;
  size?: 'small' | 'default' | 'large';
  orderId?: string;
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
  const [isOpen, setIsOpen] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeReady, setIframeReady] = useState(false);

  const createPaymentMutation = trpc.orders.createNexapaySession.useMutation();

  useEffect(() => {
    // Listen for messages from the iframe
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from nexapay.one or same origin
      const allowedOrigins = ['https://nexapay.one', 'https://checkout.nexapay.one', window.location.origin];
      if (!allowedOrigins.includes(event.origin)) {
        return;
      }

      console.log('Message from iframe:', event.data);

      if (event.data.type === 'payment_completed' || event.data.status === 'completed') {
        const transaction = event.data.transaction || event.data;
        console.log('Payment completed:', transaction);
        setIsOpen(false);
        setCheckoutUrl(null);
        onSuccess(transaction);
      } else if (event.data.type === 'payment_failed' || event.data.status === 'failed') {
        const error = event.data.error || event.data;
        console.error('Payment failed:', error);
        setError(error?.message || 'Payment failed');
        onError?.(error);
      } else if (event.data.type === 'payment_cancelled' || event.data.status === 'cancelled') {
        console.log('Payment cancelled');
        setIsOpen(false);
        setCheckoutUrl(null);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onSuccess, onError]);

  const handleOpenCheckout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate a temporary order ID if not provided
      const tempOrderId = orderId || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Call backend to create NexaPay session
      const response = await createPaymentMutation.mutateAsync({
        orderId: tempOrderId,
        amount,
        currency,
        successUrl: `${window.location.origin}/checkout?payment_status=success&order_id=${tempOrderId}`,
        cancelUrl: `${window.location.origin}/checkout?payment_status=cancelled&order_id=${tempOrderId}`,
      });

      if (response.checkoutUrl) {
        setCheckoutUrl(response.checkoutUrl);
        setIsOpen(true);
        setIframeReady(false);
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

  return (
    <>
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl h-[700px] p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Complete Payment - NexaPay</DialogTitle>
          </DialogHeader>

          {error ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <p className="text-center text-red-600 font-medium">{error}</p>
              <Button 
                onClick={() => {
                  setIsOpen(false);
                  setError(null);
                }} 
                variant="outline"
              >
                Close
              </Button>
            </div>
          ) : checkoutUrl ? (
            <>
              {!iframeReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-50">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              )}
              <iframe
                src={checkoutUrl}
                className="w-full h-full border-0"
                title="NexaPay Checkout"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-popups-to-escape-sandbox"
                onLoad={() => setIframeReady(true)}
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
