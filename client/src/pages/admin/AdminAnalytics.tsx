/**
 * ShopMart Admin - Analytics
 * Design: 深色側邊欄 + 白色內容區域
 * 數據來源: 完全從後端 API 獲取真實數據
 */

import { AdminLayout } from './Dashboard';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

export default function AdminAnalytics() {
  const { language } = useLanguage();
  
  // 從後端 API 獲取真實數據
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: salesData = [], isLoading: salesLoading } = trpc.dashboard.salesData.useQuery();
  const { data: categoryData = [], isLoading: categoryLoading } = trpc.dashboard.categoryData.useQuery();
  const { data: topProducts = [], isLoading: productsLoading } = trpc.products.list.useQuery({ limit: 5 });

  const totalRevenue = salesData.reduce((sum: number, d: any) => sum + (d.revenue || 0), 0);
  const totalOrders = salesData.reduce((sum: number, d: any) => sum + (d.orders || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{language === 'zh' ? '分析報告' : 'Analytics'}</h1>
        <p className="text-gray-500 text-sm mt-1">{language === 'zh' ? '商店業績概覽' : 'Store performance overview'}</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsLoading ? (
          [1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-16 mb-2"></div>
            </div>
          ))
        ) : (
          [
            { label: language === 'zh' ? '總收入' : 'Total Revenue', value: `$${(totalRevenue / 100).toFixed(2)}`, change: `${stats?.revenueGrowth || 0}%`, positive: (stats?.revenueGrowth || 0) >= 0 },
            { label: language === 'zh' ? '總訂單' : 'Total Orders', value: (stats?.totalOrders || 0).toLocaleString(), change: `${stats?.ordersGrowth || 0}%`, positive: (stats?.ordersGrowth || 0) >= 0 },
            { label: language === 'zh' ? '平均訂單金額' : 'Avg Order Value', value: `$${(avgOrderValue / 100).toFixed(2)}`, change: '0%', positive: true },
            { label: language === 'zh' ? '總商品' : 'Total Products', value: (stats?.totalProducts || 0).toLocaleString(), change: `${stats?.productsGrowth || 0}%`, positive: (stats?.productsGrowth || 0) >= 0 },
          ].map((metric) => (
            <div key={metric.label} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500">{metric.label}</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{metric.value}</p>
              <p className={`text-xs mt-1 font-medium ${metric.positive ? 'text-green-500' : 'text-red-500'}`}>
                {metric.change} vs last period
              </p>
            </div>
          ))
        )}
      </div>

      {/* Revenue + Orders combined chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-6">
        <h3 className="font-semibold text-gray-700 mb-4">{language === 'zh' ? '收入與訂單趨勢' : 'Revenue & Orders Trend'}</h3>
        {salesLoading ? (
          <div className="h-[280px] flex items-center justify-center text-gray-400">
            {language === 'zh' ? '加載中...' : 'Loading...'}
          </div>
        ) : salesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E93323" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#E93323" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOrd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#E93323" strokeWidth={2} fill="url(#colorRev)" />
              <Area yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#3B82F6" strokeWidth={2} fill="url(#colorOrd)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-gray-400">
            {language === 'zh' ? '暫無銷售數據' : 'No sales data yet'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Category distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">{language === 'zh' ? '按類別銷售' : 'Sales by Category'}</h3>
          {categoryLoading ? (
            <div className="h-[200px] flex items-center justify-center text-gray-400">
              {language === 'zh' ? '加載中...' : 'Loading...'}
            </div>
          ) : categoryData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                    {categoryData.map((entry: any, index: number) => (
                      <Cell key={index} fill={entry.color || ['#E93323', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {categoryData.map((item: any, index: number) => (
                  <div key={item.name}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-gray-600">{item.name}</span>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color || ['#E93323', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][index % 5] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400">
              {language === 'zh' ? '暫無分類數據' : 'No category data yet'}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">{language === 'zh' ? '熱銷商品' : 'Top Selling Products'}</h3>
          {productsLoading ? (
            <div className="h-[200px] flex items-center justify-center text-gray-400">
              {language === 'zh' ? '加載中...' : 'Loading...'}
            </div>
          ) : topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((product: any, idx: number) => (
                <div key={product.id} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                    idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-orange-400' : idx === 2 ? 'bg-yellow-500' : 'bg-gray-400'
                  }`}>
                    {idx + 1}
                  </span>
                  <img
                    src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop'}
                    alt={product.name}
                    className="w-10 h-10 rounded object-cover shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 line-clamp-1">{product.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-red-400 h-1.5 rounded-full"
                          style={{ width: `${topProducts[0]?.sold ? ((product.sold || 0) / topProducts[0].sold) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">{product.sold || 0} sold</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400">
              {language === 'zh' ? '暫無商品' : 'No products yet'}
            </div>
          )}
        </div>
      </div>

      {/* Monthly bar chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-700 mb-4">{language === 'zh' ? '月度收入對比' : 'Monthly Revenue Comparison'}</h3>
        {salesLoading ? (
          <div className="h-[250px] flex items-center justify-center text-gray-400">
            {language === 'zh' ? '加載中...' : 'Loading...'}
          </div>
        ) : salesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
              <Bar dataKey="revenue" name="Revenue" fill="#E93323" radius={[4, 4, 0, 0]}>
                {salesData.map((_: any, index: number) => (
                  <Cell key={index} fill={index === salesData.length - 1 ? '#c0392b' : '#E93323'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-gray-400">
            {language === 'zh' ? '暫無銷售數據' : 'No sales data yet'}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
