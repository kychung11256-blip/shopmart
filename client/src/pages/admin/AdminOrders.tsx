/**
 * ShopMart Admin - Orders Management
 * Design: 深色側邊欄 + 白色內容區域
 * 數據來源: 完全從後端 API 獲取真實數據
 */

import { useState } from 'react';
import { Search, Eye, X, Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { AdminLayout } from './Dashboard';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const statusConfig: Record<string, { color: string; icon: any; labelZh: string; labelEn: string }> = {
  pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, labelZh: '待處理', labelEn: 'Pending' },
  processing: { color: 'bg-blue-100 text-blue-700', icon: Package, labelZh: '處理中', labelEn: 'Processing' },
  shipped: { color: 'bg-purple-100 text-purple-700', icon: Truck, labelZh: '已發貨', labelEn: 'Shipped' },
  delivered: { color: 'bg-green-100 text-green-700', icon: CheckCircle, labelZh: '已送達', labelEn: 'Delivered' },
  completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle, labelZh: '已完成', labelEn: 'Completed' },
  paid: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle, labelZh: '已付款', labelEn: 'Paid' },
  cancelled: { color: 'bg-red-100 text-red-700', icon: XCircle, labelZh: '已取消', labelEn: 'Cancelled' },
};

function getStatusLabel(status: string, language: string) {
  const config = statusConfig[status];
  if (config) return language === 'zh' ? config.labelZh : config.labelEn;
  return status;
}

function OrderDetailModal({ order, onClose }: {
  order: any;
  onClose: () => void;
}) {
  const { language } = useLanguage();
  const config = statusConfig[order.status] || statusConfig.pending;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">{language === 'zh' ? '訂單詳情' : 'Order Details'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">#{order.id}</p>
              <p className="text-xs text-gray-400">{order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}</p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${config.color}`}>
              {getStatusLabel(order.status, language)}
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-1">{language === 'zh' ? '客戶' : 'Customer'}</p>
            <p className="text-sm text-gray-600">{order.userName || 'Guest'}</p>
            {order.userEmail && <p className="text-xs text-gray-400 mt-1">{order.userEmail}</p>}
          </div>

          {order.items && order.items.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">{language === 'zh' ? '商品' : 'Products'}</p>
              <div className="space-y-2">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{item.productName || `Product #${item.productId}`} × {item.quantity}</span>
                    <span className="font-medium text-gray-700">${((item.price || 0) * item.quantity / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
            <span>{language === 'zh' ? '總計' : 'Total'}</span>
            <span className="text-red-500">${(order.totalAmount / 100).toFixed(2)}</span>
          </div>

          {order.stripePaymentIntentId && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-1">{language === 'zh' ? '支付資訊' : 'Payment Info'}</p>
              <p className="text-xs text-gray-500 font-mono">{order.stripePaymentIntentId}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // 從後端 API 獲取真實訂單數據
  const { data: orderList = [], isLoading } = trpc.orders.list.useQuery({ limit: 100 });

  const filtered = orderList.filter((o: any) => {
    const matchSearch = String(o.id).includes(searchQuery) ||
      (o.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'All' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusCounts = Object.keys(statusConfig).reduce((acc, status) => {
    acc[status] = orderList.filter((o: any) => o.status === status).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{language === 'zh' ? '訂單管理' : 'Orders'}</h1>
        <p className="text-gray-500 text-sm mt-1">{orderList.length} {language === 'zh' ? '個訂單' : 'orders total'}</p>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {Object.entries(statusConfig).filter(([status]) => statusCounts[status] > 0 || ['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)).slice(0, 5).map(([status, config]) => (
          <button
            key={status}
            onClick={() => setFilterStatus(filterStatus === status ? 'All' : status)}
            className={`bg-white rounded-lg shadow-sm border p-3 text-left transition-all ${
              filterStatus === status ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <config.icon size={14} className={config.color.includes('yellow') ? 'text-yellow-500' :
                config.color.includes('blue') ? 'text-blue-500' :
                config.color.includes('purple') ? 'text-purple-500' :
                config.color.includes('green') ? 'text-green-500' : 'text-red-500'} />
              <span className="text-xs text-gray-500">{getStatusLabel(status, language)}</span>
            </div>
            <p className="text-xl font-bold text-gray-700">{statusCounts[status] || 0}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'zh' ? '按訂單 ID 或客戶名稱搜索...' : 'Search by order ID or customer...'}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-red-400"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400"
          >
            <option value="All">{language === 'zh' ? '所有狀態' : 'All Status'}</option>
            {Object.entries(statusConfig).map(([status]) => (
              <option key={status} value={status}>{getStatusLabel(status, language)}</option>
            ))}
          </select>
          <span className="text-sm text-gray-500">{filtered.length} {language === 'zh' ? '個結果' : 'results'}</span>
        </div>
      </div>

      {/* Orders table */}
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
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '訂單 ID' : 'Order ID'}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '客戶' : 'Customer'}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '總計' : 'Total'}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '日期' : 'Date'}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '狀態' : 'Status'}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '操作' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((order: any) => {
                  const config = statusConfig[order.status] || statusConfig.pending;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <span className="text-sm font-mono font-medium text-gray-700">#{order.id}</span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-gray-700">{order.userName || 'Guest'}</p>
                        {order.userEmail && <p className="text-xs text-gray-400">{order.userEmail}</p>}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-semibold text-red-500">${(order.totalAmount / 100).toFixed(2)}</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color}`}>
                          {getStatusLabel(order.status, language)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
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
