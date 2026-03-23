import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, Eye, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function Orders() {
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { language } = useLanguage();

  // Fetch orders
  const { data: ordersList = [], isLoading } = trpc.orders.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">
              {language === 'zh' ? '請登入' : 'Please Log In'}
            </h1>
            <p className="text-gray-600 mb-6">
              {language === 'zh' ? '您需要登入才能查看訂單。' : 'You need to log in to view your orders.'}
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
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-red-500 hover:text-red-600 mb-6"
        >
          <ArrowLeft size={20} />
          {language === 'zh' ? '返回首頁' : 'Back to Home'}
        </button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {language === 'zh' ? '我的訂單' : 'My Orders'}
          </h1>
          <p className="text-gray-600">
            {language === 'zh' 
              ? `歡迎回來，${user?.name}！` 
              : `Welcome back, ${user?.name}!`}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {language === 'zh' ? '加載訂單中...' : 'Loading orders...'}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && ordersList.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {language === 'zh' ? '暫無訂單' : 'No Orders Yet'}
              </h2>
              <p className="text-gray-600 mb-6">
                {language === 'zh' 
                  ? '您還沒有任何訂單。現在開始購物吧！' 
                  : 'You don\'t have any orders yet. Start shopping now!'}
              </p>
              <Button 
                onClick={() => navigate('/')} 
                className="bg-red-500 hover:bg-red-600"
              >
                {language === 'zh' ? '開始購物' : 'Start Shopping'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        {!isLoading && ordersList.length > 0 && (
          <div className="space-y-4">
            {ordersList.map((order: any) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {language === 'zh' ? '訂單號' : 'Order #'}{order.orderNumber}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {language === 'zh' ? '下單時間' : 'Order Date'}: {new Date(order.createdAt).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-500">
                        ${(order.totalPrice / 100).toFixed(2)}
                      </p>
                      <p className={`text-sm font-semibold mt-1 ${
                        order.paymentStatus === 'paid' 
                          ? 'text-green-600' 
                          : order.paymentStatus === 'unpaid'
                          ? 'text-orange-600'
                          : 'text-red-600'
                      }`}>
                        {language === 'zh' 
                          ? (order.paymentStatus === 'paid' ? '已支付' : order.paymentStatus === 'unpaid' ? '未支付' : '已退款')
                          : order.paymentStatus}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {/* Order Status */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs text-gray-600 mb-1">
                          {language === 'zh' ? '訂單狀態' : 'Status'}
                        </p>
                        <p className="font-semibold text-gray-800 capitalize">
                          {language === 'zh' 
                            ? (order.status === 'pending' ? '待處理' : order.status === 'processing' ? '處理中' : order.status === 'shipped' ? '已發貨' : order.status === 'delivered' ? '已送達' : order.status)
                            : order.status}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs text-gray-600 mb-1">
                          {language === 'zh' ? '商品數量' : 'Items'}
                        </p>
                        <p className="font-semibold text-gray-800">
                          {order.items?.length || 0}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs text-gray-600 mb-1">
                          {language === 'zh' ? '配送地址' : 'Shipping'}
                        </p>
                        <p className="font-semibold text-gray-800 truncate text-sm">
                          {order.shippingAddress || (language === 'zh' ? '待填寫' : 'N/A')}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs text-gray-600 mb-1">
                          {language === 'zh' ? '支付方式' : 'Payment'}
                        </p>
                        <p className="font-semibold text-gray-800">Stripe</p>
                      </div>
                    </div>

                    {/* Order Items */}
                    {order.items && order.items.length > 0 && (
                      <div className="border-t pt-4">
                        <p className="font-semibold text-gray-800 mb-3">
                          {language === 'zh' ? '商品詳情' : 'Items'}
                        </p>
                        <div className="space-y-2">
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                              <div>
                                <p className="text-gray-800">{item.productName || `Product #${item.productId}`}</p>
                                <p className="text-gray-600">
                                  {language === 'zh' ? '數量' : 'Qty'}: {item.quantity}
                                </p>
                              </div>
                              <p className="font-semibold text-gray-800">
                                ${(item.price / 100).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        onClick={() => navigate(`/orders/confirmation?orderId=${order.id}`)}
                        variant="outline"
                        className="flex-1 flex items-center justify-center gap-2"
                      >
                        <Eye size={16} />
                        {language === 'zh' ? '查看詳情' : 'View Details'}
                      </Button>
                      {order.paymentStatus === 'paid' && (
                        <Button
                          onClick={() => {
                            toast.success(
                              language === 'zh' 
                                ? '下載鏈接已發送到您的郵箱' 
                                : 'Download link sent to your email'
                            );
                          }}
                          className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600"
                        >
                          <Download size={16} />
                          {language === 'zh' ? '下載虛擬商品' : 'Download Product'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
