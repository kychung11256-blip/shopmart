import { useEffect, useRef, useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { X, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TransVoucherPaymentModalProps {
  isOpen: boolean;
  embedUrl: string;
  transactionId: string;
  orderId: number;
  orderTotal: number;
  onSuccess: () => void;
  onCancel: () => void;
}

type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired' | 'cancelled';

export default function TransVoucherPaymentModal({
  isOpen,
  embedUrl,
  transactionId,
  orderId,
  orderTotal,
  onSuccess,
  onCancel,
}: TransVoucherPaymentModalProps) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCompletedRef = useRef(false);

  const utils = trpc.useUtils();

  // Poll payment status every 3 seconds
  const pollStatus = useCallback(async () => {
    if (hasCompletedRef.current) return;
    try {
      const result = await utils.config.checkTransVoucherStatus.fetch({
        transactionId,
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
        // Wait a moment then trigger success
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
      console.error('[TransVoucher] Polling error:', error);
    }
  }, [transactionId, orderId, utils, onSuccess]);

  useEffect(() => {
    if (!isOpen || !transactionId) return;

    hasCompletedRef.current = false;
    setPaymentStatus('pending');
    setIframeLoaded(false);
    setPollCount(0);

    // Start polling after 5 seconds (give user time to see the form)
    const startDelay = setTimeout(() => {
      pollIntervalRef.current = setInterval(pollStatus, 3000);
    }, 5000);

    return () => {
      clearTimeout(startDelay);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isOpen, transactionId, pollStatus]);

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
      <div className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">TV</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">TransVoucher 安全支付</h3>
              <p className="text-xs text-gray-500">訂單金額：${orderTotal.toFixed(2)} USD</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Status indicator */}
            {paymentStatus === 'pending' && pollCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <RefreshCw size={12} className="animate-spin" />
                <span>等待付款</span>
              </div>
            )}
            {isCompleted && (
              <div className="flex items-center gap-1.5 text-xs text-green-600">
                <CheckCircle size={14} />
                <span>付款成功</span>
              </div>
            )}
            {isFailed && (
              <div className="flex items-center gap-1.5 text-xs text-red-600">
                <XCircle size={14} />
                <span>付款失敗</span>
              </div>
            )}
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-600"
              title="關閉"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* iframe container */}
        <div className="relative flex-1 bg-gray-50" style={{ minHeight: '500px' }}>
          {/* Loading overlay */}
          {!iframeLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
              <Loader2 size={32} className="animate-spin text-blue-600 mb-3" />
              <p className="text-sm text-gray-500">正在載入支付頁面...</p>
            </div>
          )}

          {/* Success overlay */}
          {isCompleted && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 z-20">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle size={36} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">付款成功！</h3>
              <p className="text-sm text-gray-500 mb-4">正在跳轉至訂單確認頁面...</p>
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
                {paymentStatus === 'expired' ? '支付連結已過期' : '付款失敗'}
              </h3>
              <p className="text-sm text-gray-500 mb-6">請返回重新嘗試或選擇其他支付方式</p>
              <Button onClick={onCancel} variant="outline" className="gap-2">
                <X size={16} />
                返回結帳
              </Button>
            </div>
          )}

          {/* The actual iframe */}
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            style={{ minHeight: '500px' }}
            onLoad={() => setIframeLoaded(true)}
            allow="payment; camera; microphone"
            title="TransVoucher Payment"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            🔒 由 TransVoucher 提供安全支付保障
          </p>
          <button
            onClick={onCancel}
            className="text-xs text-gray-500 hover:text-gray-700 underline transition-colors"
          >
            取消並返回
          </button>
        </div>
      </div>
    </div>
  );
}
