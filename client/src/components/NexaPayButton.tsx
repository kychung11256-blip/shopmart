import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface NexaPayButtonProps {
  amount: number;
  currency?: string;
  publicKey?: string;
  onSuccess?: (tx: any) => void;
  onError?: (error: any) => void;
  size?: 'small' | 'default' | 'large';
  orderId?: number;
  className?: string;
}

/**
 * NexaPayButton - Redirect-based payment component for NexaPay
 * 
 * Redirects user to NexaPay checkout page for payment processing.
 * After payment completion, webhook automatically updates order status.
 * 
 * Usage:
 * <NexaPayButton
 *   amount={25.00}
 *   currency="USD"
 *   onSuccess={(tx) => console.log(tx)}
 * />
 * 
 * Implementation:
 * - Redirects to NexaPay checkout page
 * - Webhook handles payment completion
 * - Automatic order status update
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

  const createPaymentMutation = trpc.orders.createNexapaySession.useMutation();

  const handleCheckout = async () => {
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
        successUrl: `${window.location.origin}/order-confirmation?orderId=${tempOrderId}`,
        cancelUrl: `${window.location.origin}/checkout`,
      });

      if (response.checkoutUrl) {
        // Redirect to NexaPay checkout page
        window.location.href = response.checkoutUrl;
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
      onClick={handleCheckout}
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
