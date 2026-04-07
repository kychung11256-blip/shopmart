import { useEffect, useRef, useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { X, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EcomTrade24PaymentModalProps {
  isOpen: boolean;
  checkoutUrl: string;
  sessionId: number | string;
  orderId: number;
  orderTotal: number;
  onSuccess: () => void;
  onCancel: () => void;
}

type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired' | 'cancelled';

export default function EcomTrade24PaymentModal({
  isOpen,
  checkoutUrl,
  sessionId,
  orderId,
  orderTotal,
  onSuccess,
  onCancel,
}: EcomTrade24PaymentModalProps) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCompletedRef = useRef(false);

  const utils = trpc.useUtils();

  // Poll payment status every 4 seconds via EcomTrade24 session_status API
  const pollStatus = useCallback(async () => {
    if (hasCompletedRef.current) return;
    try {
      const result = await utils.config.checkEcomTrade24Status.fetch({
        sessionId: String(sessionId),
        orderId,
      });
      const status = result.status as PaymentStatus;
      setPaymentStatus(status);
      setPollCount(c => c + 1);

      if (status === 'completed') {
        hasCompletedRef.current = true;
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else if (status === 'failed' || status === 'expired' || status === 'cancelled') {
        hasCompletedRef.current = true;
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    } catch (error) {
      console.error('[EcomTrade24] Polling error:', error);
    }
  }, [sessionId, orderId, utils, onSuccess]);

  useEffect(() => {
    if (!isOpen || !sessionId) return;

    hasCompletedRef.current = false;
    setPaymentStatus('pending');
    setIframeLoaded(false);
    setIframeError(false);
    setPollCount(0);

    // Start polling after 6 seconds
    const startDelay = setTimeout(() => {
      pollIntervalRef.current = setInterval(pollStatus, 4000);
    }, 6000);

    return () => {
      clearTimeout(startDelay);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isOpen, sessionId, pollStatus]);

  if (!isOpen) return null;

  const isCompleted = paymentStatus === 'completed';
  const isFailed = paymentStatus === 'failed' || paymentStatus === 'expired' || paymentStatus === 'cancelled';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={isFailed ? onCancel : undefined}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">E24</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">EcomTrade24 Pay</h3>
              <p className="text-xs text-gray-500">Order amount: ${orderTotal.toFixed(2)} USD</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {paymentStatus === 'pending' && pollCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <RefreshCw size={12} className="animate-spin" />
                <span>Waiting for payment</span>
              </div>
            )}
            {isCompleted && (
              <div className="flex items-center gap-1.5 text-xs text-green-600">
                <CheckCircle size={14} />
                <span>Payment successful</span>
              </div>
            )}
            {isFailed && (
              <div className="flex items-center gap-1.5 text-xs text-red-600">
                <XCircle size={14} />
                <span>Payment failed</span>
              </div>
            )}
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-600"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* iframe container */}
        <div className="relative flex-1 bg-gray-50" style={{ minHeight: '520px' }}>
          {/* Loading overlay */}
          {!iframeLoaded && !iframeError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
              <Loader2 size={32} className="animate-spin text-green-600 mb-3" />
              <p className="text-sm text-gray-500">Loading payment page...</p>
            </div>
          )}

          {/* iframe blocked / error overlay */}
          {iframeError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                <XCircle size={28} className="text-yellow-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Cannot embed payment page</h3>
              <p className="text-sm text-gray-500 mb-5">
                The payment provider does not allow embedding. Please open the payment page in a new tab to complete your purchase.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => window.open(checkoutUrl, '_blank')}
                  className="bg-green-600 hover:bg-green-700 text-white gap-2"
                >
                  Open payment page
                </Button>
                <Button onClick={onCancel} variant="outline">
                  Cancel
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                After completing payment in the new tab, this dialog will update automatically.
              </p>
            </div>
          )}

          {/* Success overlay */}
          {isCompleted && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 z-20">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle size={36} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Payment successful!</h3>
              <p className="text-sm text-gray-500 mb-4">Redirecting to order confirmation...</p>
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
          )}

          {/* Failed overlay */}
          {isFailed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 z-20">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <XCircle size={36} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {paymentStatus === 'expired' ? 'Payment link expired' : 'Payment failed'}
              </h3>
              <p className="text-sm text-gray-500 mb-6">Please go back and try again or choose another payment method.</p>
              <Button onClick={onCancel} variant="outline" className="gap-2">
                <X size={16} />
                Back to checkout
              </Button>
            </div>
          )}

          {/* The actual iframe */}
          {!iframeError && (
            <iframe
              src={checkoutUrl}
              className="w-full h-full border-0"
              style={{ minHeight: '520px' }}
              onLoad={() => {
                // Try to detect if iframe was blocked by X-Frame-Options
                try {
                  setIframeLoaded(true);
                } catch {
                  setIframeError(true);
                }
              }}
              onError={() => setIframeError(true)}
              allow="payment; camera; microphone"
              title="EcomTrade24 Pay"
              referrerPolicy="origin-when-cross-origin"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation allow-popups-to-escape-sandbox"
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            🔒 Secured by EcomTrade24 Pay
          </p>
          <button
            onClick={onCancel}
            className="text-xs text-gray-500 hover:text-gray-700 underline transition-colors"
          >
            Cancel and return
          </button>
        </div>
      </div>
    </div>
  );
}
