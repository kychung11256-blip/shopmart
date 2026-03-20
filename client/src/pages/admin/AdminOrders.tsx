/**
 * ShopMart Admin - Orders Management
 * Design: 深色側邊欄 + 白色內容區域
 */

import { useState } from 'react';
import { Search, Eye, ChevronDown, X, Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { AdminLayout } from './Dashboard';
import { orders as initialOrders } from '@/lib/data';
import { useLanguage } from '@/contexts/LanguageContext';
import { getStatusLabel } from '@/lib/data-translations';
import type { Order } from '@/lib/data';
import { toast } from 'sonner';

const statusConfig: Record<string, { color: string; icon: any }> = {
  pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  processing: { color: 'bg-blue-100 text-blue-700', icon: Package },
  shipped: { color: 'bg-purple-100 text-purple-700', icon: Truck },
  delivered: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { color: 'bg-red-100 text-red-700', icon: XCircle },
};

function OrderDetailModal({ order, onClose, onUpdateStatus }: {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (id: string, status: Order['status']) => void;
}) {
  const { language } = useLanguage();
  const config = statusConfig[order.status];

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
              <p className="text-sm font-semibold text-gray-700">{order.id}</p>
              <p className="text-xs text-gray-400">{order.createdAt}</p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${config.color}`}>
              {getStatusLabel(order.status, language)}
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-1">{language === 'zh' ? '客戶' : 'Customer'}</p>
            <p className="text-sm text-gray-600">{order.userName}</p>
            <p className="text-xs text-gray-400 mt-1">{order.address}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">{language === 'zh' ? '商品' : 'Products'}</p>
            <div className="space-y-2">
              {order.products.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{p.name} × {p.qty}</span>
                  <span className="font-medium text-gray-700">${(p.price * p.qty).toFixed(2)}</span>
                </div>
              ))}
                <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                  <span>{language === 'zh' ? '總計' : 'Total'}</span>
                <span className="text-red-500">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">{language === 'zh' ? '更新狀态' : 'Update Status'}</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(statusConfig) as Order['status'][]).map((status) => (
                <button
                  key={status}
                  onClick={() => { onUpdateStatus(order.id, status); onClose(); }}
                  disabled={order.status === status}
                  className={`py-2 text-xs rounded font-medium transition-colors ${
                    order.status === status
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-500 border border-gray-200'
                  }`}
                >
                  {getStatusLabel(status, language)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const { language } = useLanguage();
  const [orderList, setOrderList] = useState(initialOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filtered = orderList.filter(o => {
    const matchSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'All' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleUpdateStatus = (id: string, status: Order['status']) => {
    setOrderList(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    toast.success(language === 'zh' ? `訂單狀态已更新为${getStatusLabel(status, language)}` : `Order status updated to ${getStatusLabel(status, language)}`);
  };

  const statusCounts = Object.keys(statusConfig).reduce((acc, status) => {
    acc[status] = orderList.filter(o => o.status === status).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{language === 'zh' ? '訂單管理' : 'Orders'}</h1>
        <p className="text-gray-500 text-sm mt-1">{orderList.length} {language === 'zh' ? '个訂單' : 'orders total'}</p>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {Object.entries(statusConfig).map(([status, config]) => (
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
              <span className="text-xs text-gray-500">{getStatusLabel(status as any, language)}</span>
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
            <option value="All">{language === 'zh' ? '所有狀态' : 'All Status'}</option>
            {Object.entries(statusConfig).map(([status]) => (
              <option key={status} value={status}>{getStatusLabel(status as any, language)}</option>
            ))}
          </select>
          <span className="text-sm text-gray-500">{filtered.length} {language === 'zh' ? '个结果' : 'results'}</span>
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '訂單 ID' : 'Order ID'}</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '客戶' : 'Customer'}</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '商品' : 'Products'}</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '總計' : 'Total'}</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '日期' : 'Date'}</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '狀态' : 'Status'}</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '操作' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((order) => {
                const config = statusConfig[order.status];
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="text-sm font-mono font-medium text-gray-700">{order.id}</span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-700">{order.userName}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs text-gray-500 line-clamp-1 max-w-[180px]">
                        {order.products.map(p => p.name).join(', ')}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold text-red-500">${order.total.toFixed(2)}</span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">{order.createdAt}</td>
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
              <p>No orders found</p>
            </div>
          )}
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </AdminLayout>
  );
}
