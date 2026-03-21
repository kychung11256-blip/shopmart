/**
 * ShopMart Admin - Analytics
 * Design: 深色側邊欄 + 白色內容區域
 */

import { AdminLayout } from './Dashboard';
import { salesData, categoryData, products, orders } from '@/lib/data';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

export default function AdminAnalytics() {
  const topProducts = [...products].sort((a, b) => b.sold - a.sold).slice(0, 5);
  const totalRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = salesData.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderValue = totalRevenue / totalOrders;

  const conversionData = salesData.map(d => ({
    ...d,
    conversion: ((d.orders / (d.orders * 8)) * 100).toFixed(1),
  }));

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Store performance overview for 2024</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Annual Revenue', value: `$${(totalRevenue / 1000).toFixed(1)}K`, change: '+12.5%', positive: true },
          { label: 'Total Orders', value: totalOrders.toLocaleString(), change: '+8.3%', positive: true },
          { label: 'Avg Order Value', value: `$${avgOrderValue.toFixed(2)}`, change: '+3.8%', positive: true },
          { label: 'Return Rate', value: '2.4%', change: '-0.5%', positive: true },
        ].map((metric) => (
          <div key={metric.label} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500">{metric.label}</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{metric.value}</p>
            <p className={`text-xs mt-1 font-medium ${metric.positive ? 'text-green-500' : 'text-red-500'}`}>
              {metric.change} vs last year
            </p>
          </div>
        ))}
      </div>

      {/* Revenue + Orders combined chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-6">
        <h3 className="font-semibold text-gray-700 mb-4">Revenue & Orders Trend</h3>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Category distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Sales by Category</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                  {categoryData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {categoryData.map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-600">{item.name}</span>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top products */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Top Selling Products</h3>
          <div className="space-y-3">
            {topProducts.map((product, idx) => (
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
                        style={{ width: `${(product.sold / topProducts[0].sold) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 shrink-0">{product.sold} sold</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly bar chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Monthly Revenue Comparison</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
            <Bar dataKey="revenue" name="Revenue" fill="#E93323" radius={[4, 4, 0, 0]}>
              {salesData.map((entry, index) => (
                <Cell key={index} fill={index === salesData.length - 1 ? '#c0392b' : '#E93323'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </AdminLayout>
  );
}
