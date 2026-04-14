/**
 * Jade Emporium Admin - Orders Management
 * 改善: 顯示商品名稱、數量、付款狀態、付款方式
 */

import { useState } from 'react';
import { Search, Eye, X, Package, Truck, CheckCircle, Clock, XCircle, DollarSign, AlertCircle, RefreshCw, ShoppingBag } from 'lucide-react';
import { AdminLayout } from './Dashboard';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';

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
  if (order.whopPaymentId)         return { label: 'Whop',   color: 'text-purple-600' };
  if (order.stripePaymentIntentId) return { label: 'Stripe', color: 'text-indigo-600' };
  if (order.stripeSessionId)       return { label: 'Stripe', color: 'text-indigo-600' };
  return { label: '—', color: 'text-gray-300' };
}

// ── 商品摘要文字（列表用）────────────────────────────────────
function buildItemsSummary(items: any[], language: string): string {
  if (!items || items.length === 0) return language === 'zh' ? '無商品資訊' : 'No items';
  return items
    .map((item) => `${item.productName || `#${item.productId}`} × ${item.quantity}`)
    .join('、');
}

function getOrderStatusLabel(status: string, language: string) {
  const config = orderStatusConfig[status];
  return config ? (language === 'zh' ? config.labelZh : config.labelEn) : status;
}

function getPaymentStatusLabel(status: string, language: string) {
  const config = paymentStatusConfig[status] || paymentStatusConfig.unpaid;
  return language === 'zh' ? config.labelZh : config.labelEn;
}

// ── 訂單詳情 Modal ────────────────────────────────────────────
function OrderDetailModal({ order, onClose, onStatusUpdated }: { order: any; onClose: () => void; onStatusUpdated?: () => void }) {
  const { language } = useLanguage();
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  const orderConfig = orderStatusConfig[currentStatus] || orderStatusConfig.pending;
  const payConfig   = paymentStatusConfig[order.paymentStatus] || paymentStatusConfig.unpaid;
  const payMethod   = detectPaymentMethod(order);
  const items: any[] = order.items || [];

  const utils = trpc.useUtils();
  const updateStatus = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      utils.orders.list.invalidate();
      onStatusUpdated?.();
    },
  });

  const handleUpdateStatus = async (newStatus: string) => {
    await updateStatus.mutateAsync({
      orderId: order.id,
      status: newStatus as any,
      trackingNumber: trackingNumber || undefined,
    });
    setCurrentStatus(newStatus);
    setShowStatusPanel(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {language === 'zh' ? '訂單詳情' : 'Order Details'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* ID + 訂單狀態 */}
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

          {/* ── 商品清單 ── */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag size={14} className="text-gray-500" />
              <p className="text-sm font-medium text-gray-700">
                {language === 'zh' ? '購買商品' : 'Items Purchased'}
              </p>
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-gray-400 italic px-1">
                {language === 'zh' ? '此訂單無商品記錄' : 'No item records for this order'}
              </p>
            ) : (
              <div className="border border-gray-100 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2">
                        {language === 'zh' ? '商品名稱' : 'Product'}
                      </th>
                      <th className="text-center text-xs font-semibold text-gray-500 px-3 py-2">
                        {language === 'zh' ? '數量' : 'Qty'}
                      </th>
                      <th className="text-right text-xs font-semibold text-gray-500 px-3 py-2">
                        {language === 'zh' ? '單價' : 'Price'}
                      </th>
                      <th className="text-right text-xs font-semibold text-gray-500 px-3 py-2">
                        {language === 'zh' ? '小計' : 'Subtotal'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {item.productImage && (
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-8 h-8 object-cover rounded flex-shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            )}
                            <span className="text-gray-700 font-medium">
                              {item.productName || `Product #${item.productId}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-600">{item.quantity}</td>
                        <td className="px-3 py-2 text-right text-gray-600">
                          ${(item.price / 100).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-gray-700">
                          ${((item.price * item.quantity) / 100).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 總計 */}
          <div className="border-t border-gray-200 pt-3 flex justify-between font-semibold">
            <span className="text-gray-700">{language === 'zh' ? '訂單總計' : 'Order Total'}</span>
            <span className="text-red-500 text-lg">
              ${((order.totalAmount ?? order.totalPrice ?? 0) / 100).toFixed(2)}
            </span>
          </div>

          {/* 支付憑證 */}
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

          {/* ── 管理員操作區 ── */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">
                {language === 'zh' ? '更新訂單狀態' : 'Update Order Status'}
              </p>
              <button
                onClick={() => setShowStatusPanel(!showStatusPanel)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {showStatusPanel
                  ? (language === 'zh' ? '收起' : 'Collapse')
                  : (language === 'zh' ? '展開操作' : 'Expand')}
              </button>
            </div>

            {/* 快速操作按鈕 */}
            <div className="flex flex-wrap gap-2">
              {currentStatus !== 'shipped' && currentStatus !== 'delivered' && currentStatus !== 'completed' && currentStatus !== 'cancelled' && (
                <button
                  onClick={() => handleUpdateStatus('shipped')}
                  disabled={updateStatus.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <Truck size={13} />
                  {language === 'zh' ? '標記已發貨' : 'Mark as Shipped'}
                </button>
              )}
              {currentStatus === 'shipped' && (
                <button
                  onClick={() => handleUpdateStatus('delivered')}
                  disabled={updateStatus.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <CheckCircle size={13} />
                  {language === 'zh' ? '標記已送達' : 'Mark as Delivered'}
                </button>
              )}
              {currentStatus !== 'completed' && currentStatus !== 'cancelled' && (
                <button
                  onClick={() => handleUpdateStatus('completed')}
                  disabled={updateStatus.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <CheckCircle size={13} />
                  {language === 'zh' ? '標記已完成' : 'Mark as Completed'}
                </button>
              )}
              {currentStatus !== 'cancelled' && (
                <button
                  onClick={() => handleUpdateStatus('cancelled')}
                  disabled={updateStatus.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <XCircle size={13} />
                  {language === 'zh' ? '取消訂單' : 'Cancel Order'}
                </button>
              )}
            </div>

            {/* 展開：追蹤號輸入 */}
            {showStatusPanel && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {language === 'zh' ? '追蹤號碼（選填）' : 'Tracking Number (optional)'}
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder={language === 'zh' ? '輸入物流追蹤號碼' : 'Enter tracking number'}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['pending','processing','shipped','delivered','completed','cancelled'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleUpdateStatus(s)}
                      disabled={updateStatus.isPending || currentStatus === s}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-40 ${
                        currentStatus === s
                          ? 'bg-gray-200 text-gray-500 cursor-default'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {orderStatusConfig[s]?.labelZh || s}
                    </button>
                  ))}
                </div>
                {updateStatus.isSuccess && (
                  <p className="text-xs text-green-600 font-medium">
                    ✓ {language === 'zh' ? '狀態已更新' : 'Status updated successfully'}
                  </p>
                )}
                {updateStatus.isError && (
                  <p className="text-xs text-red-600 font-medium">
                    ✗ {language === 'zh' ? '更新失敗，請重試' : 'Update failed, please try again'}
                  </p>
                )}
              </div>
            )}
              </div>

          {/* ── 下載發票 ── */}
          <div className="pt-2">
            <a
              href={`/api/invoice/${order.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {language === 'zh' ? '下載發票 PDF' : 'Download Invoice PDF'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 主頁面 ────────────────────────────────────────────
export default function AdminOrders() {
  const { language } = useLanguage();
  const PAGE_SIZE = 40;
  const [searchQuery,   setSearchQuery]   = useState('');
  const [filterStatus,  setFilterStatus]  = useState('All');
  const [filterPayment, setFilterPayment] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [currentPage,   setCurrentPage]   = useState(1);

  const { data: orderList = [], isLoading, refetch } = trpc.orders.list.useQuery({} as any);

  // ── 篩選 ──
  const filtered = (orderList as any[]).filter((o: any) => {
    const matchSearch =
      String(o.id).includes(searchQuery) ||
      (o.orderNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.items || []).some((item: any) =>
        (item.productName || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchStatus  = filterStatus  === 'All' || o.status                    === filterStatus;
    const matchPayment = filterPayment === 'All' || (o.paymentStatus || 'unpaid') === filterPayment;
    return matchSearch && matchStatus && matchPayment;
  });

  // ── 分頁 ──
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // ── 統計 ──
  const paidCount    = (orderList as any[]).filter((o: any) => o.paymentStatus === 'paid').length;
  const unpaidCount  = (orderList as any[]).filter((o: any) => !o.paymentStatus || o.paymentStatus === 'unpaid').length;
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
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder={language === 'zh' ? '搜索訂單 ID、客戶、商品名稱...' : 'Search by order ID, customer or product...'}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-red-400"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400"
          >
            <option value="All">{language === 'zh' ? '所有訂單狀態' : 'All Order Status'}</option>
            {Object.entries(orderStatusConfig).map(([status, cfg]) => (
              <option key={status} value={status}>{language === 'zh' ? cfg.labelZh : cfg.labelEn}</option>
            ))}
          </select>
          <select
            value={filterPayment}
            onChange={(e) => { setFilterPayment(e.target.value); setCurrentPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400"
          >
            <option value="All">{language === 'zh' ? '所有付款狀態' : 'All Payment Status'}</option>
            {Object.entries(paymentStatusConfig).map(([status, cfg]) => (
              <option key={status} value={status}>{language === 'zh' ? cfg.labelZh : cfg.labelEn}</option>
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
                    {language === 'zh' ? '購買商品' : 'Items'}
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
                {paginated.map((order: any) => {
                  const orderCfg  = orderStatusConfig[order.status] || orderStatusConfig.pending;
                  const payCfg    = paymentStatusConfig[order.paymentStatus || 'unpaid'] || paymentStatusConfig.unpaid;
                  const payMethod = detectPaymentMethod(order);
                  const isPaid    = order.paymentStatus === 'paid';
                  const items: any[] = order.items || [];

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
                        {order.userEmail && <p className="text-xs text-gray-400">{order.userEmail}</p>}
                        {order.shippingAddress && (
                          <p className="text-xs text-blue-500 truncate max-w-[120px]">{order.shippingAddress}</p>
                        )}
                      </td>
                      {/* 購買商品摘要 */}
                      <td className="px-4 py-3 max-w-[220px]">
                        {items.length === 0 ? (
                          <span className="text-xs text-gray-300">—</span>
                        ) : (
                          <div className="space-y-0.5">
                            {items.slice(0, 2).map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                {item.productImage && (
                                  <img
                                    src={item.productImage}
                                    alt={item.productName}
                                    className="w-5 h-5 object-cover rounded flex-shrink-0"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                )}
                                <span className="text-xs text-gray-600 truncate">
                                  {item.productName || `#${item.productId}`}
                                  <span className="text-gray-400 ml-1">×{item.quantity}</span>
                                </span>
                              </div>
                            ))}
                            {items.length > 2 && (
                              <span className="text-xs text-gray-400">
                                +{items.length - 2} {language === 'zh' ? '件' : 'more'}
                              </span>
                            )}
                          </div>
                        )}
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
                        <span className={`text-xs font-semibold ${payMethod.color}`}>{payMethod.label}</span>
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

        {/* ── 分頁控制列 ── */}
        {!isLoading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <span className="text-sm text-gray-500">
              {language === 'zh'
                ? `第 ${safePage} 頁 / 共 ${totalPages} 頁（${filtered.length} 筆訂單）`
                : `Page ${safePage} of ${totalPages} (${filtered.length} orders)`}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← {language === 'zh' ? '上一頁' : 'Prev'}
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {language === 'zh' ? '下一頁' : 'Next'} →
              </button>
            </div>
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
