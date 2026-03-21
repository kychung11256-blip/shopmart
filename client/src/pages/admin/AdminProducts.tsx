/**
 * ShopMart Admin - Products Management
 * Design: 深色側邊欄 + 白色內容區域
 */

import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import { AdminLayout } from './Dashboard';
import { products as initialProducts, categories } from '@/lib/data';
import ProductEditDialog from '@/components/ProductEditDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Product } from '@/lib/data';
import { toast } from 'sonner';

// 使用新的 ProductEditDialog 組件替代舊的 ProductModal

export default function AdminProducts() {
  const { language } = useLanguage();
  const [productList, setProductList] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filtered = productList.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = filterCategory === 'All' || p.category === filterCategory;
    const matchStatus = filterStatus === 'All' || p.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const handleSave = (formData: Product) => {
    if (formData.id) {
      setProductList(prev => prev.map(p => p.id === formData.id ? formData : p));
      toast.success(language === 'zh' ? '商品已成功更新' : 'Product updated successfully!');
    } else {
      const newProduct: Product = {
        ...formData,
        id: Date.now(),
        sold: formData.sold || 0,
        rating: formData.rating || 5.0,
        createdAt: formData.createdAt || new Date().toISOString().split('T')[0],
      };
      setProductList(prev => [newProduct, ...prev]);
      toast.success(language === 'zh' ? '商品已成功添加' : 'Product added successfully!');
    }
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleDelete = (id: number) => {
    if (confirm(language === 'zh' ? '你確定要刪除此商品吗？' : 'Are you sure you want to delete this product?')) {
      setProductList(prev => prev.filter(p => p.id !== id));
      toast.success(language === 'zh' ? '商品已刪除' : 'Product deleted.');
    }
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-600',
    out_of_stock: 'bg-red-100 text-red-700',
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{language === 'zh' ? '商品管理' : 'Products'}</h1>
          <p className="text-gray-500 text-sm mt-1">{productList.length} {language === 'zh' ? '个商品' : 'products total'}</p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setShowModal(true); }}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          {language === 'zh' ? '添加商品' : 'Add Product'}
        </button>
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
              placeholder={language === 'zh' ? '搜索商品...' : 'Search products...'}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-red-400"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400"
          >
            <option value="All">{language === 'zh' ? '所有分類' : 'All Categories'}</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400"
          >
            <option value="All">{language === 'zh' ? '所有狀态' : 'All Status'}</option>
            <option value="active">{language === 'zh' ? '活跃' : 'Active'}</option>
            <option value="inactive">{language === 'zh' ? '非活跃' : 'Inactive'}</option>
            <option value="out_of_stock">{language === 'zh' ? '缺貨' : 'Out of Stock'}</option>
          </select>
          <span className="text-sm text-gray-500">{filtered.length} {language === 'zh' ? '个结果' : 'results'}</span>
        </div>
      </div>

      {/* Products table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '商品' : 'Product'}</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '分類' : 'Category'}</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '价格' : 'Price'}</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '库存' : 'Stock'}</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '已賣' : 'Sold'}</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '狀态' : 'Status'}</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '操作' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop'}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-100"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop'; }}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-700 line-clamp-1 max-w-[200px]">{product.name}</p>
                        <p className="text-xs text-gray-400">ID: {product.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{product.category || 'Uncategorized'}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div>
                      <span className="text-sm font-semibold text-red-500">${(product.price || 0).toFixed(2)}</span>
                      {product.originalPrice && product.originalPrice > (product.price || 0) && (
                        <p className="text-xs text-gray-400 line-through">${(product.originalPrice || 0).toFixed(2)}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-sm font-medium ${(product.stock || 0) < 10 ? 'text-red-500' : 'text-gray-700'}`}>
                      {product.stock || 0}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{product.sold}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[product.status]}`}>
                      {product.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditingProduct(product); setShowModal(true); }}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p>No products found</p>
            </div>
          )}
        </div>
      </div>

      <ProductEditDialog
        isOpen={showModal}
        product={editingProduct as Product | null}
        onClose={() => { setShowModal(false); setEditingProduct(null); }}
        onSave={handleSave}
      />
    </AdminLayout>
  );
}
