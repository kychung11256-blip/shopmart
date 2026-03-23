import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Package, Truck, CreditCard, ArrowLeft, Clock, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function OrderConfirmation() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const [orderId, setOrderId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMarkedAsPaid, setHasMarkedAsPaid] = useState(false);
  
  // Mutation to mark order as paid
  const markAsPaidMutation = trpc.orders.markAsPaid.useMutation();

  // Get order ID from session storage or URL
  useEffect(() => {
    // Check if this is a return from Stripe
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    
    let id: number | null = null;
    
    if (sessionId) {
      // Coming from Stripe, get order ID from session storage
      const storedOrderId = sessionStorage.getItem('lastOrderId');
      if (storedOrderId) {
        id = parseInt(storedOrderId);
        sessionStorage.removeItem('lastOrderId');
      }
    }
    
    if (!id) {
      // Try to get from URL params
      const urlOrderId = params.get('orderId');
      if (urlOrderId) {
        id = parseInt(urlOrderId);
      }
    }
    
    if (!id) {
      toast.error(language === 'zh' ? '找不到訂單' : 'Order not found');
      navigate('/');
      return;
    }

    setOrderId(id);
    setIsLoading(false);
  }, [navigate, language]);
  
  // Mark order as paid when orderId is available and we haven't done it yet
  useEffect(() => {
    if (orderId && !hasMarkedAsPaid && isAuthenticated) {
      setHasMarkedAsPaid(true);
      markAsPaidMutation.mutateAsync(orderId).catch((error) => {
        console.error('Failed to mark order as paid:', error);
        // Don't show error toast as this is not critical
      });
    }
  }, [orderId, hasMarkedAsPaid, isAuthenticated]);

  // Fetch order details
  const { data: order, isLoading: orderLoading, refetch: refetchOrder } = trpc.orders.getById.useQuery(orderId || 0, {
    enabled: !!orderId && isAuthenticated,
  });
  
  // Refetch order after marking as paid
  useEffect(() => {
    if (hasMarkedAsPaid && !markAsPaidMutation.isPending) {
      refetchOrder();
    }
  }, [hasMarkedAsPaid, markAsPaidMutation.isPending, refetchOrder]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">
              {language === 'zh' ? '請登入' : 'Please Log In'}
            </h1>
            <p className="text-gray-600 mb-6">
              {language === 'zh' ? '您需要登入才能查看訂單。' : 'You need to log in to view your order.'}
            </p>
            <Button onClick={() => navigate('/')} className="bg-red-500 hover:bg-red-600">
              {language === 'zh' ? '返回首頁' : 'Go to Home'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || orderLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {language === 'zh' ? '加載訂單詳情...' : 'Loading order details...'}
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 mb-6"
          >
            <ArrowLeft size={20} />
            {language === 'zh' ? '返回首頁' : 'Back to Home'}
          </button>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">
              {language === 'zh' ? '訂單未找到' : 'Order Not Found'}
            </h1>
            <p className="text-gray-600 mb-6">
              {language === 'zh' ? '我們無法找到您的訂單詳情。' : 'We couldn\'t find your order details.'}
            </p>
            <Button onClick={() => navigate('/')} className="bg-red-500 hover:bg-red-600">
              {language === 'zh' ? '返回首頁' : 'Go to Home'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-red-500 hover:text-red-600 mb-6"
        >
          <ArrowLeft size={20} />
          {language === 'zh' ? '返回首頁' : 'Back to Home'}
        </button>

        {/* Success message */}
        <div className="bg-white rounded-lg shadow p-8 mb-6 text-center border-t-4 border-green-500">
          <div className="flex justify-center mb-4">
            <CheckCircle2 size={64} className="text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {language === 'zh' ? '支付成功！' : 'Payment Successful!'}
          </h1>
          <p className="text-gray-600 mb-4">
            {language === 'zh' 
              ? '感謝您的購買。您的訂單已確認。' 
              : 'Thank you for your purchase. Your order has been confirmed.'}
          </p>
          <p className="text-2xl font-bold text-red-500">Order #{order.orderNumber}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Order Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock size={20} className="text-blue-500" />
                {language === 'zh' ? '訂單狀態' : 'Order Status'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-1">{language === 'zh' ? '狀態' : 'Status'}</p>
              <p className="text-lg font-bold capitalize text-blue-600">
                {language === 'zh' 
                  ? (order.status === 'pending' ? '待處理' : order.status === 'processing' ? '處理中' : order.status === 'shipped' ? '已發貨' : order.status === 'delivered' ? '已送達' : order.status)
                  : order.status}
              </p>
            </CardContent>
          </Card>

          {/* Payment Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard size={20} className="text-green-500" />
                {language === 'zh' ? '支付狀態' : 'Payment Status'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-1">{language === 'zh' ? '狀態' : 'Status'}</p>
              <p className="text-lg font-bold capitalize text-green-600">
                {language === 'zh' 
                  ? (order.paymentStatus === 'paid' ? '已支付' : order.paymentStatus === 'unpaid' ? '未支付' : '已退款')
                  : order.paymentStatus}
              </p>
            </CardContent>
          </Card>

          {/* Shipping Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck size={20} className="text-orange-500" />
                {language === 'zh' ? '配送' : 'Shipping'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-1">{language === 'zh' ? '地址' : 'Address'}</p>
              <p className="text-sm font-semibold text-gray-800 truncate">
                {order.shippingAddress || (language === 'zh' ? '待填寫' : 'To be filled')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Order Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{language === 'zh' ? '訂單詳情' : 'Order Details'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Order Items */}
              {order.items && order.items.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">
                    {language === 'zh' ? '商品' : 'Items'}
                  </h3>
                  <div className="space-y-2">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium text-gray-800">{item.productName || `Product #${item.productId}`}</p>
                          <p className="text-sm text-gray-600">
                            {language === 'zh' ? '數量' : 'Quantity'}: {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-800">${(item.price / 100).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-600">{language === 'zh' ? '小計' : 'Subtotal'}</p>
                  <p className="font-medium text-gray-800">${(order.totalPrice / 100).toFixed(2)}</p>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-600">{language === 'zh' ? '運費' : 'Shipping'}</p>
                  <p className="font-medium text-gray-800">{language === 'zh' ? '免費' : 'Free'}</p>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <p className="font-bold text-gray-800">{language === 'zh' ? '總計' : 'Total'}</p>
                  <p className="text-2xl font-bold text-red-500">${(order.totalPrice / 100).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">
              {language === 'zh' ? '後續步驟' : 'What\'s Next?'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-blue-900">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <p className="font-semibold">
                    {language === 'zh' ? '確認郵件' : 'Confirmation Email'}
                  </p>
                  <p className="text-blue-800">
                    {language === 'zh' 
                      ? '我們已向您的郵箱發送訂單確認和虛擬商品下載鏈接。' 
                      : 'We\'ve sent a confirmation email with your virtual product download link.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <p className="font-semibold">
                    {language === 'zh' ? '下載虛擬商品' : 'Download Virtual Product'}
                  </p>
                  <p className="text-blue-800">
                    {language === 'zh' 
                      ? '點擊郵件中的下載鏈接獲取您購買的虛擬商品。下載鏈接有效期為 30 天。' 
                      : 'Click the download link in the email to get your virtual product. Links are valid for 30 days.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <p className="font-semibold">
                    {language === 'zh' ? '查看訂單歷史' : 'View Order History'}
                  </p>
                  <p className="text-blue-800">
                    {language === 'zh' 
                      ? '您可以隨時在「我的訂單」頁面查看所有訂單和下載記錄。' 
                      : 'You can view all your orders and download history anytime in the Orders page.'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => navigate('/orders')}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {language === 'zh' ? '查看所有訂單' : 'View All Orders'}
          </Button>
          <Button
            onClick={() => navigate('/')}
            className="bg-red-500 hover:bg-red-600"
          >
            {language === 'zh' ? '繼續購物' : 'Continue Shopping'}
          </Button>
        </div>
      </div>
    </div>
  );
}
