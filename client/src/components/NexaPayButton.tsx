import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface NexaPayButtonProps {
  amount: number;
  currency: string;
  publicKey: string;
  checkoutUrl?: string;
  onSuccess?: (transaction: any) => void;
  onError?: (error: any) => void;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  disabled?: boolean;
}

/**
 * Custom NexaPayButton component that integrates NexaPay payment gateway
 * 
 * This component provides a button that opens NexaPay checkout in a new window.
 * The payment flow is controlled by the parent component (Checkout.tsx):
 * 1. Parent creates order
 * 2. Parent creates NexaPay session and gets checkoutUrl
 * 3. Parent passes checkoutUrl to this component
 * 4. User clicks button to open payment page
 * 5. After payment, webhook updates order status
 * 6. Parent component handles redirect to confirmation page
 */
export function NexaPayButton({
  amount,
  currency,
  publicKey,
  checkoutUrl,
  onSuccess,
  onError,
  size = 'large',
  className = '',
  disabled = false,
}: NexaPayButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    try {
      if (!checkoutUrl) {
        throw new Error('Checkout URL not available. Please try again.');
      }

      setIsLoading(true);

      // Open NexaPay checkout in new window
      const paymentWindow = window.open(checkoutUrl, 'NexaPayCheckout', 'width=800,height=600');

      if (!paymentWindow) {
        throw new Error('Failed to open payment window. Please check your browser popup settings.');
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess({ checkoutUrl });
      }

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      console.error('NexaPayButton error:', error);
      if (onError) {
        onError({ message: errorMessage });
      }
    }
  };

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || disabled || !checkoutUrl}
      className={`
        w-full flex items-center justify-center gap-3 
        ${sizeClasses[size]}
        bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
        text-white font-semibold rounded-lg
        transition-colors duration-200
        disabled:cursor-not-allowed
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <Loader2 size={20} className="animate-spin" />
          <span>Opening Payment...</span>
        </>
      ) : (
        <>
          <div className="w-6 h-6 bg-white rounded flex items-center justify-center text-blue-600 font-bold text-sm">
            ₦
          </div>
          <span>Pay with Nexapay</span>
        </>
      )}
    </button>
  );
}
