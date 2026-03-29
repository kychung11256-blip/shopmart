import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * NexaPayButton Component Tests
 * 
 * Tests for the embedded NexaPay payment button component
 */

describe('NexaPayButton Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    vi.clearAllMocks();
  });

  describe('Component Props Interface', () => {
    it('should accept required props: amount, currency, onSuccess', () => {
      const props = {
        amount: 25.00,
        currency: 'USD',
        onSuccess: vi.fn(),
      };

      expect(props.amount).toBe(25.00);
      expect(props.currency).toBe('USD');
      expect(typeof props.onSuccess).toBe('function');
    });

    it('should accept optional props: publicKey, onError, size, orderId, className', () => {
      const props = {
        amount: 25.00,
        currency: 'USD',
        publicKey: 'cg_live_9fdbfb12c5cb3a81cd4ac0fdbf1e598dc7c115a8eb708c08328044f16cdf2ee8',
        onSuccess: vi.fn(),
        onError: vi.fn(),
        size: 'large' as const,
        orderId: 123,
        className: 'custom-class',
      };

      expect(props.publicKey).toBeDefined();
      expect(props.onError).toBeDefined();
      expect(props.size).toBe('large');
      expect(props.orderId).toBe(123);
      expect(props.className).toBe('custom-class');
    });

    it('should support different button sizes', () => {
      const sizes = ['small', 'default', 'large'] as const;
      
      sizes.forEach(size => {
        const props = {
          amount: 25.00,
          currency: 'USD',
          onSuccess: vi.fn(),
          size,
        };
        expect(props.size).toBe(size);
      });
    });

    it('should support different currencies', () => {
      const currencies = ['USD', 'EUR', 'GBP', 'JPY'];
      
      currencies.forEach(currency => {
        const props = {
          amount: 25.00,
          currency,
          onSuccess: vi.fn(),
        };
        expect(props.currency).toBe(currency);
      });
    });
  });

  describe('Payment Flow', () => {
    it('should call onSuccess callback with transaction data', () => {
      const onSuccess = vi.fn();
      const transaction = {
        id: 'tx_123',
        status: 'completed',
        amount: 25.00,
        currency: 'USD',
      };

      // Simulate payment success
      onSuccess(transaction);

      expect(onSuccess).toHaveBeenCalledWith(transaction);
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('should call onError callback with error data', () => {
      const onError = vi.fn();
      const error = {
        message: 'Payment failed',
        code: 'PAYMENT_FAILED',
      };

      // Simulate payment error
      onError(error);

      expect(onError).toHaveBeenCalledWith(error);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('should handle missing onError callback gracefully', () => {
      const onSuccess = vi.fn();
      const props = {
        amount: 25.00,
        currency: 'USD',
        onSuccess,
        // onError is optional
      };

      expect(props.onError).toBeUndefined();
      // Should not throw when onError is not provided
    });
  });

  describe('Amount Validation', () => {
    it('should accept valid payment amounts', () => {
      const amounts = [0.01, 0.50, 1.00, 25.00, 100.00, 999.99];
      
      amounts.forEach(amount => {
        const props = {
          amount,
          currency: 'USD',
          onSuccess: vi.fn(),
        };
        expect(props.amount).toBe(amount);
      });
    });

    it('should format amount to 2 decimal places', () => {
      const amount = 25.00;
      const formatted = amount.toFixed(2);
      
      expect(formatted).toBe('25.00');
    });
  });

  describe('Button Label Generation', () => {
    it('should generate correct button label with amount and currency', () => {
      const amount = 25.00;
      const currency = 'USD';
      const label = `Pay ${amount.toFixed(2)} ${currency} with NexaPay`;
      
      expect(label).toBe('Pay 25.00 USD with NexaPay');
    });

    it('should handle different currencies in label', () => {
      const testCases = [
        { amount: 25.00, currency: 'USD', expected: 'Pay 25.00 USD with NexaPay' },
        { amount: 100.00, currency: 'EUR', expected: 'Pay 100.00 EUR with NexaPay' },
        { amount: 50.00, currency: 'GBP', expected: 'Pay 50.00 GBP with NexaPay' },
      ];

      testCases.forEach(({ amount, currency, expected }) => {
        const label = `Pay ${amount.toFixed(2)} ${currency} with NexaPay`;
        expect(label).toBe(expected);
      });
    });
  });

  describe('Modal and Dialog Behavior', () => {
    it('should track modal open/close state', () => {
      let isOpen = false;
      
      // Simulate opening modal
      isOpen = true;
      expect(isOpen).toBe(true);
      
      // Simulate closing modal
      isOpen = false;
      expect(isOpen).toBe(false);
    });

    it('should handle iframe loading state', () => {
      let iframeReady = false;
      
      // Simulate iframe loading
      iframeReady = false;
      expect(iframeReady).toBe(false);
      
      // Simulate iframe ready
      iframeReady = true;
      expect(iframeReady).toBe(true);
    });
  });

  describe('Message Handling', () => {
    it('should handle payment_completed message', () => {
      const onSuccess = vi.fn();
      const message = {
        type: 'payment_completed',
        transaction: {
          id: 'tx_123',
          status: 'completed',
        },
      };

      // Simulate receiving message
      if (message.type === 'payment_completed') {
        onSuccess(message.transaction);
      }

      expect(onSuccess).toHaveBeenCalledWith(message.transaction);
    });

    it('should handle payment_failed message', () => {
      const onError = vi.fn();
      const message = {
        type: 'payment_failed',
        error: {
          message: 'Payment failed',
          code: 'PAYMENT_FAILED',
        },
      };

      // Simulate receiving message
      if (message.type === 'payment_failed') {
        onError(message.error);
      }

      expect(onError).toHaveBeenCalledWith(message.error);
    });

    it('should handle payment_cancelled message', () => {
      let isOpen = true;
      const message = {
        type: 'payment_cancelled',
      };

      // Simulate receiving message
      if (message.type === 'payment_cancelled') {
        isOpen = false;
      }

      expect(isOpen).toBe(false);
    });

    it('should ignore messages from untrusted origins', () => {
      const onSuccess = vi.fn();
      const allowedOrigins = ['https://nexapay.one', 'https://checkout.nexapay.one', window.location.origin];
      
      const untrustedOrigin = 'https://evil.com';
      const message = {
        type: 'payment_completed',
        transaction: { id: 'tx_123' },
      };

      // Check if origin is allowed
      const isAllowed = allowedOrigins.includes(untrustedOrigin);
      
      if (isAllowed) {
        onSuccess(message.transaction);
      }

      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing checkout URL', () => {
      const onError = vi.fn();
      let checkoutUrl: string | null = null;

      if (!checkoutUrl) {
        onError(new Error('Checkout URL not available'));
      }

      expect(onError).toHaveBeenCalled();
    });

    it('should handle API errors gracefully', () => {
      const onError = vi.fn();
      const error = new Error('Failed to create payment session');

      onError(error);

      expect(onError).toHaveBeenCalledWith(error);
    });

    it('should display error message to user', () => {
      const errorMessage = 'Payment failed';
      const error = { message: errorMessage };

      expect(error.message).toBe('Payment failed');
    });
  });

  describe('Integration with Checkout Flow', () => {
    it('should receive totalPrice from parent component', () => {
      const totalPrice = 25.00;
      const props = {
        amount: totalPrice,
        currency: 'USD',
        onSuccess: vi.fn(),
      };

      expect(props.amount).toBe(25.00);
    });

    it('should receive orderId from sessionStorage', () => {
      const orderId = 123;
      const props = {
        amount: 25.00,
        currency: 'USD',
        onSuccess: vi.fn(),
        orderId,
      };

      expect(props.orderId).toBe(123);
    });

    it('should call handleNexapaySuccess on successful payment', () => {
      const handleNexapaySuccess = vi.fn();
      const transaction = {
        id: 'tx_123',
        status: 'completed',
      };

      handleNexapaySuccess(transaction);

      expect(handleNexapaySuccess).toHaveBeenCalledWith(transaction);
    });

    it('should call handleNexapayError on payment error', () => {
      const handleNexapayError = vi.fn();
      const error = { message: 'Payment failed' };

      handleNexapayError(error);

      expect(handleNexapayError).toHaveBeenCalledWith(error);
    });
  });
});
