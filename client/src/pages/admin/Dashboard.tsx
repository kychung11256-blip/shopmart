/**
 * Jade Emporium Admin - Dashboard
 * Design: 深色側邊欄 + 白色內容區域
 * 包含: 銷售統計、訂單概覽、商品管理入口
 * 數據來源: 完全從後端 API 獲取真實數據
 */

import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tag, BarChart3,
  Settings, LogOut, Menu, X, TrendingUp, TrendingDown, DollarSign,
  ShoppingCart, UserCheck, Box, ChevronRight, Bell, Search, Eye, Globe, Image
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: Package, label: 'Products', href: '/admin/products' },
  { icon: ShoppingBag, label: 'Orders', href: '/admin/orders' },
  { icon: Users, label: 'Users', href: '/admin/users' },
  { icon: Tag, label: 'Categories', href: '/admin/categories' },
  { icon: Image, label: 'Banners', href: '/admin/banners' },
  { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

function StatCard({ title, value, growth, icon: Icon, color }: {
  title: string;
  value: string;
  growth: number;
  icon: any;
  color: string;
}) {
  const isPositive = growth >= 0;
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{Math.abs(growth)}% vs last month</span>
          </div>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const [location] = useLocation();

  return (
    <aside className={`fixed left-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 z-50 flex flex-col ${collapsed ? 'w-12 sm:w-16' : 'w-48 sm:w-60'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
        <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center shrink-0">
          <ShoppingCart size={16} className="text-white" />
        </div>
        {!collapsed && <span className="font-bold text-lg">Jade Emporium</span>}
        <button
          onClick={onToggle}
          className="ml-auto text-gray-400 hover:text-white transition-colors"
        >
          {collapsed ? <Menu size={18} /> : <X size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { language, toggleLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-12 sm:ml-16' : 'ml-48 sm:ml-60'}`}>
        <header className="bg-white border-b border-gray-100 px-3 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={language === 'zh' ? '搜索...' : 'Search...'}
                className="pl-9 pr-4 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg outline-none focus:border-red-400 w-48 sm:w-64"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <a
              href="/"
              className="flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-600 hover:text-red-500 hover:bg-gray-100 rounded transition-colors border border-gray-200 hover:border-red-400"
              title="Back to Store"
            >
              <span>←</span>
              <span className="font-medium hidden sm:inline">Back to Store</span>
            </a>
            <button
              onClick={toggleLanguage}
              className="flex items-center justify-center gap-0.5 sm:gap-1.5 px-1.5 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-600 hover:text-red-500 hover:bg-gray-100 rounded transition-colors"
              title={language === 'zh' ? 'Switch to English' : 'Switch to Chinese'}
            >
              <Globe size={18} />
              <span className="font-medium hidden sm:inline">{language === 'zh' ? 'EN' : 'ZH'}</span>
            </button>
            <button className="relative p-2 text-gray-500 hover:text-gray-700">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold text-sm">A</span>
              </div>
              <span className="text-sm font-medium text-gray-700">Admin</span>
            </div>
          </div>
        </header>
        <main className="p-2 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { language } = useLanguage();
  
  // 從後端 API 獲取真實數據
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: salesData = [], isLoading: salesLoading } = trpc.dashboard.salesData.useQuery();
  const { data: categoryData = [], isLoading: categoryLoading } = trpc.dashboard.categoryData.useQuery();
  const { data: recentOrders = [], isLoading: ordersLoading } = trpc.orders.list.useQuery();
  const { data: topProducts = [], isLoading: productsLoading } = trpc.products.list.useQuery({ limit: 6 });

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-green-100 text-green-700',
    paid: 'bg-blue-100 text-blue-700',
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{language === 'zh' ? '儀表板' : 'Dashboard'}</h1>
        <p className="text-gray-500 text-sm mt-1">{language === 'zh' ? '歡迎回來！以下是您商店的最新動態。' : 'Welcome back! Here\'s what\'s happening with your store.'}</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsLoading ? (
          <>
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title={language === 'zh' ? '總收入' : 'Total Revenue'}
              value={`$${((stats?.totalRevenue || 0) / 100).toFixed(2)}`}
              growth={(stats as any)?.revenueGrowth || 0}
              icon={DollarSign}
              color="bg-red-500"
            />
            <StatCard
              title={language === 'zh' ? '總訂單' : 'Total Orders'}
              value={(stats?.totalOrders || 0).toLocaleString()}
              growth={(stats as any)?.ordersGrowth || 0}
              icon={ShoppingBag}
              color="bg-blue-500"
            />
            <StatCard
              title={language === 'zh' ? '總用戶' : 'Total Users'}
              value={(stats?.totalUsers || 0).toLocaleString()}
              growth={(stats as any)?.usersGrowth || 0}
              icon={UserCheck}
              color="bg-green-500"
            />
            <StatCard
              title={language === 'zh' ? '總商品' : 'Total Products'}
              value={(stats?.totalProducts || 0).toLocaleString()}
              growth={(stats as any)?.productsGrowth || 0}
              icon={Box}
              color="bg-purple-500"
            />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">{language === 'zh' ? '收入概覽' : 'Revenue Overview'}</h3>
            <select className="text-xs border border-gray-200 rounded px-2 py-1 outline-none">
              <option>{language === 'zh' ? '今年' : 'This Year'}</option>
            </select>
          </div>
          {salesLoading ? (
            <div className="h-[220px] flex items-center justify-center text-gray-400">
              {language === 'zh' ? '加載中...' : 'Loading...'}
            </div>
          ) : salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E93323" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#E93323" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#E93323"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400">
              {language === 'zh' ? '暫無銷售數據' : 'No sales data yet'}
            </div>
          )}
        </div>

        {/* Category pie chart */}
        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">{language === 'zh' ? '按類別銷售' : 'Sales by Category'}</h3>
          {categoryLoading ? (
            <div className="h-[180px] flex items-center justify-center text-gray-400">
              {language === 'zh' ? '加載中...' : 'Loading...'}
            </div>
          ) : categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    dataKey="value"
                  >
                    {categoryData.map((entry: any, index: number) => (
                      <Cell key={index} fill={entry.color || ['#E93323', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {categoryData.map((item: any, index: number) => (
                  <div key={`cat-${index}`} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color || ['#E93323', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][index % 5] }} />
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-medium text-gray-700">{item.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-gray-400">
              {language === 'zh' ? '暫無分類數據' : 'No category data yet'}
            </div>
          )}
        </div>
      </div>

      {/* Orders chart + Recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Monthly orders bar chart */}
        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">{language === 'zh' ? '月度訂單' : 'Monthly Orders'}</h3>
          {salesLoading ? (
            <div className="h-[200px] flex items-center justify-center text-gray-400">
              {language === 'zh' ? '加載中...' : 'Loading...'}
            </div>
          ) : salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#E93323" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400">
              {language === 'zh' ? '暫無訂單數據' : 'No order data yet'}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-700">{language === 'zh' ? '最近訂單' : 'Recent Orders'}</h3>
            <Link href="/admin/orders" className="text-xs text-red-500 hover:underline flex items-center gap-1">
              {language === 'zh' ? '查看全部' : 'View all'} <ChevronRight size={12} />
            </Link>
          </div>
          {ordersLoading ? (
            <div className="p-8 text-center text-gray-400">
              {language === 'zh' ? '加載中...' : 'Loading...'}
            </div>
          ) : recentOrders.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {recentOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">#{order.id}</p>
                    <p className="text-xs text-gray-400">{order.userName || 'Guest'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">${(order.totalAmount / 100).toFixed(2)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">
              {language === 'zh' ? '暫無訂單' : 'No orders yet'}
            </div>
          )}
        </div>
      </div>

      {/* Top products */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">{language === 'zh' ? '熱銷商品' : 'Top Products'}</h3>
          <Link href="/admin/products" className="text-xs text-red-500 hover:underline flex items-center gap-1">
            {language === 'zh' ? '查看全部' : 'View all'} <ChevronRight size={12} />
          </Link>
        </div>
        {productsLoading ? (
          <div className="p-8 text-center text-gray-400">
            {language === 'zh' ? '加載中...' : 'Loading...'}
          </div>
        ) : topProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{language === 'zh' ? '商品' : 'Product'}</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{language === 'zh' ? '價格' : 'Price'}</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{language === 'zh' ? '已賣' : 'Sold'}</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{language === 'zh' ? '庫存' : 'Stock'}</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{language === 'zh' ? '狀態' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topProducts.map((product: any) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop'}
                          alt={product.name}
                          className="w-10 h-10 rounded object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop'; }}
                        />
                        <span className="text-sm text-gray-700 line-clamp-1 max-w-[180px]">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-red-500">${product.price.toFixed(2)}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{product.sold || 0}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{product.stock || 0}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        product.status === 'active' ? 'bg-green-100 text-green-700' :
                        product.status === 'inactive' ? 'bg-gray-100 text-gray-600' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400">
            {language === 'zh' ? '暫無商品' : 'No products yet'}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
