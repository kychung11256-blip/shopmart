/**
 * PinKoi Admin - Orders Management
 * Design: 深色側邊欄 + 白色內容區域
 * 數據來源: 完全從後端 API 獲取真實數據
 * 改善: 正確顯示付款狀態 (paymentStatus)、付款方式識別、付款篩選器
 */

import { useState } from 'react';
import { Search, Eye, X, Package, Truck, CheckCircle, Clock, XCircle, CreditCard, DollarSign, AlertCircle, RefreshCw } from 'lucide-react';
import { AdminLayout } from './Dashboard';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

// ── 訂單流程狀態 ─────────────────────────────────────────────
const orderStatusConfig: Record<string, { color: string; icon: any; labelZh: string; labelEn: string }> = {
  pending:    { color: 'bg-yellow-100 text-yellow-700',  icon: Clock,        labelZh: '待處理',  labelEn: 'Pending' },
  processing: { color: 'bg-blue-100 text-blue-700',      icon: Package,      labelZh: '處理中',  labelEn: 'Processing' },
  shipped:    { color: 'bg-purple-100 text-purple-700',  icon: Truck,        labelZh: '已發貨',  labelEn: 'Shipped' },
  delivered:  { color: 'bg-green-100 text-green-700',    icon: CheckCircle,  labelZh: '已送達',  labelEn: 'Delivered' },
  completed:  { color: 'bg-green-100 text-green-700',    icon: CheckCircle,  labelZh: '已完成',  labelEn: 'Completed' },
  cancelled:  { color: 'bg-red-100 text-red-700',        icon: XCircle,      labelZh: '已取消',  labelEn: 'Cancelled' },
};

// ── 付款狀態 ─────────────────────────────────────────────────
const paymentStatusConfig: Record<string, { color: string; dotColor: string; labelZh: string; labelEn: string }> = {
  paid:     { color: 'bg-emerald-100 text-emerald-700', dotColor: 'bg-emerald-500', labelZh: '已付款', labelEn: 'Paid' },
  unpaid:   { color: 'bg-gray-100 text-gray-500',       dotColor: 'bg-gray-400',    labelZh: '未付款', labelEn: 'Unpaid' },
  refunded: { color: 'bg-orange-100 text-orange-700',   dotColor: 'bg-orange-500',  labelZh: '已退款', labelEn: 'Refunded' },
  failed:   { color: 'bg-red-100 text-red-600',         dotColor: 'bg-red-500',     labelZh: '付款失敗', labelEn: 'Failed' },
};

// ── 付款方式識別 ──────────────────────────────────────────────
function detectPaymentMethod(order: any): { label: string; color: string } {
  if (order.whopPaymentId)            return { label: 'Whop',   color: 'text-purple-600' };
  if (order.stripePaymentIntentId)    return { label: 'Stripe', color: 'text-indigo-600' };
  if (order.stripeSessionId)          return { label: 'Stripe', color: 'text-indigo-600' };
  return { label: '—', color: 'text-gray-300' };
}

function getOrderStatusLabel(status: string, language: string) {
  const config = orderStatusConfig[status];
  if (config) return language === 'zh' ? config.labelZh : config.labelEn;
  return status;
}

function getPaymentStatusLabel(status: string, language: string) {
  const config = paymentStatusConfig[status] || paymentStatusConfig.unpaid;
  return language === 'zh' ? config.labelZh : config.labelEn;
}

// ── 訂單詳情 Modal ────────────────────────────────────────────
function OrderDetailModal({ order, onClose }: { order: any; onClose: () => void }) {
  const { language } = useLanguage();
  const orderConfig  = orderStatusConfig[order.status] || orderStatusConfig.pending;
  const payConfig    = paymentStatusConfig[order.paymentStatus] || paymentStatusConfig.unpaid;
  const payMethod    = detectPaymentMethod(order);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {language === 'zh' ? '訂單詳情' : 'Order Details'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Header: ID + 訂單狀態 */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">#{order.id}</p>
              {order.orderNumber && (
                <p className="text-xs text-gray-400 font-mono mt-0.5">{order.orderNumber}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}
              </p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${orderConfig.color}`}>
              {getOrderStatusLabel(order.status, language)}
            </span>
          </div>

          {/* 付款狀態 + 付款方式 */}
          <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">{language === 'zh' ? '付款狀態' : 'Payment Status'}</p>
              <div className="flex items-center gap-1.5">
                <span className={`inline-block w-2 h-2 rounded-full ${payConfig.dotColor}`} />
                <span className={`text-sm font-semibold ${payConfig.color.split(' ')[1]}`}>
                  {getPaymentStatusLabel(order.paymentStatus || 'unpaid', language)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">{language === 'zh' ? '付款方式' : 'Payment Method'}</p>
              <span className={`text-sm font-semibold ${payMethod.color}`}>{payMethod.label}</span>
            </div>
          </div>

          {/* 客戶資訊 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-1">{language === 'zh' ? '客戶' : 'Customer'}</p>
            <p className="text-sm text-gray-600">{order.userName || 'Guest'}</p>
            {order.userEmail && <p className="text-xs text-gray-400 mt-1">{order.userEmail}</p>}
          </div>

          {/* 收件郵箱 */}
          {order.shippingAddress && (
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-1">
                {language === 'zh' ? '收件郵箱' : 'Delivery Email'}
              </p>
              <p className="text-sm text-blue-600 break-all">{order.shippingAddress}</p>
            </div>
          )}

          {/* 商品列表 */}
          {order.items && order.items.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                {language === 'zh' ? '商品' : 'Products'}
              </p>
              <div className="space-y-2">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {item.productName || `Product #${item.productId}`} × {item.quantity}
                    </span>
                    <span className="font-medium text-gray-700">
                      ${((item.price || 0) * item.quantity / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 總計 */}
          <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
            <span>{language === 'zh' ? '總計' : 'Total'}</span>
            <span className="text-red-500">
              ${((order.totalAmount ?? order.totalPrice ?? 0) / 100).toFixed(2)}
            </span>
          </div>

          {/* 支付 ID */}
          {(order.whopPaymentId || order.stripePaymentIntentId || order.stripeSessionId) && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">
                {language === 'zh' ? '支付憑證' : 'Payment Reference'}
              </p>
              {order.whopPaymentId && (
                <div>
                  <p className="text-xs text-gray-400">Whop ID</p>
                  <p className="text-xs text-gray-600 font-mono break-all">{order.whopPaymentId}</p>
                </div>
              )}
              {order.stripePaymentIntentId && (
                <div>
                  <p className="text-xs text-gray-400">Stripe Payment Intent</p>
                  <p className="text-xs text-gray-600 font-mono break-all">{order.stripePaymentIntentId}</p>
                </div>
              )}
              {order.stripeSessionId && (
                <div>
                  <p className="text-xs text-gray-400">Stripe Session</p>
                  <p className="text-xs text-gray-600 font-mono break-all">{order.stripeSessionId}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 主頁面 ────────────────────────────────────────────────────
export default function AdminOrders() {
  const { language } = useLanguage();
  const [searchQuery,      setSearchQuery]      = useState('');
  const [filterStatus,     setFilterStatus]     = useState('All');
  const [filterPayment,    setFilterPayment]    = useState('All');
  const [selectedOrder,    setSelectedOrder]    = useState<any>(null);

  const { data: orderList = [], isLoading, refetch } = trpc.orders.list.useQuery({ limit: 100 } as any);

  // ── 篩選 ──
  const filtered = (orderList as any[]).filter((o: any) => {
    const matchSearch =
      String(o.id).includes(searchQuery) ||
      (o.orderNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus  = filterStatus  === 'All' || o.status         === filterStatus;
    const matchPayment = filterPayment === 'All' || (o.paymentStatus || 'unpaid') === filterPayment;
    return matchSearch && matchStatus && matchPayment;
  });

  // ── 統計 ──
  const paidCount   = (orderList as any[]).filter((o: any) => o.paymentStatus === 'paid').length;
  const unpaidCount = (orderList as any[]).filter((o: any) => !o.paymentStatus || o.paymentStatus === 'unpaid').length;
  const totalRevenue = (orderList as any[])
    .filter((o: any) => o.paymentStatus === 'paid')
    .reduce((sum: number, o: any) => sum + ((o.totalAmount ?? o.totalPrice ?? 0) / 100), 0);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {language === 'zh' ? '訂單管理' : 'Orders'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {(orderList as any[]).length} {language === 'zh' ? '個訂單' : 'orders total'}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} />
          {language === 'zh' ? '刷新' : 'Refresh'}
        </button>
      </div>

      {/* ── 付款統計卡片 ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-emerald-500" />
            <span className="text-sm text-gray-500">{language === 'zh' ? '已付款訂單' : 'Paid Orders'}</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{paidCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-gray-400" />
            <span className="text-sm text-gray-500">{language === 'zh' ? '未付款訂單' : 'Unpaid Orders'}</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{unpaidCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-emerald-500" />
            <span className="text-sm text-gray-500">{language === 'zh' ? '已收款總額' : 'Total Revenue'}</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">${totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* ── 篩選列 ── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'zh' ? '搜索訂單 ID、客戶名稱或郵箱...' : 'Search by order ID, customer or email...'}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-red-400"
            />
          </div>

          {/* 訂單狀態篩選 */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400"
          >
            <option value="All">{language === 'zh' ? '所有訂單狀態' : 'All Order Status'}</option>
            {Object.entries(orderStatusConfig).map(([status, cfg]) => (
              <option key={status} value={status}>
                {language === 'zh' ? cfg.labelZh : cfg.labelEn}
              </option>
            ))}
          </select>

          {/* 付款狀態篩選 */}
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400"
          >
            <option value="All">{language === 'zh' ? '所有付款狀態' : 'All Payment Status'}</option>
            {Object.entries(paymentStatusConfig).map(([status, cfg]) => (
              <option key={status} value={status}>
                {language === 'zh' ? cfg.labelZh : cfg.labelEn}
              </option>
            ))}
          </select>

          <span className="text-sm text-gray-500">
            {filtered.length} {language === 'zh' ? '個結果' : 'results'}
          </span>
        </div>
      </div>

      {/* ── 訂單表格 ── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-gray-400">
            {language === 'zh' ? '加載中...' : 'Loading...'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">
                    {language === 'zh' ? '訂單 ID' : 'Order ID'}
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">
                    {language === 'zh' ? '客戶' : 'Customer'}
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">
                    {language === 'zh' ? '收件郵箱' : 'Delivery Email'}
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">
                    {language === 'zh' ? '總計' : 'Total'}
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">
                    {language === 'zh' ? '付款狀態' : 'Payment'}
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">
                    {language === 'zh' ? '付款方式' : 'Method'}
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">
                    {language === 'zh' ? '訂單狀態' : 'Status'}
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">
                    {language === 'zh' ? '日期' : 'Date'}
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">
                    {language === 'zh' ? '操作' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((order: any) => {
                  const orderCfg  = orderStatusConfig[order.status] || orderStatusConfig.pending;
                  const payCfg    = paymentStatusConfig[order.paymentStatus || 'unpaid'] || paymentStatusConfig.unpaid;
                  const payMethod = detectPaymentMethod(order);
                  const isPaid    = order.paymentStatus === 'paid';

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-gray-50 transition-colors ${isPaid ? 'border-l-2 border-l-emerald-400' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono font-medium text-gray-700">#{order.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-700">{order.userName || 'Guest'}</p>
                        {order.userEmail && (
                          <p className="text-xs text-gray-400">{order.userEmail}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[160px]">
                        <p className="text-sm text-blue-600 truncate">
                          {order.shippingAddress || <span className="text-gray-300">—</span>}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-red-500">
                          ${((order.totalAmount ?? order.totalPrice ?? 0) / 100).toFixed(2)}
                        </span>
                      </td>
                      {/* 付款狀態 */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${payCfg.dotColor}`} />
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${payCfg.color}`}>
                            {getPaymentStatusLabel(order.paymentStatus || 'unpaid', language)}
                          </span>
                        </div>
                      </td>
                      {/* 付款方式 */}
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${payMethod.color}`}>
                          {payMethod.label}
                        </span>
                      </td>
                      {/* 訂單狀態 */}
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${orderCfg.color}`}>
                          {getOrderStatusLabel(order.status, language)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Package size={40} className="mx-auto mb-3 opacity-30" />
                <p>{language === 'zh' ? '暫無訂單' : 'No orders found'}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </AdminLayout>
  );
}
