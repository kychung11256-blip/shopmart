/**
 * ShopMart Admin - Products Management
 * Design: 深色側邊欄 + 白色內容區域
 * API Integration: 使用 TRPC 實時同步商品數據
 */

import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import { AdminLayout } from './Dashboard';
import { products as defaultProducts, categories as defaultCategories } from '@/lib/data';
import ProductEditDialog from '@/components/ProductEditDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import type { Product } from '@/lib/data';
import { toast } from 'sonner';

// 轉換數據庫商品格式為前端格式
function convertDbProductToFrontend(dbProduct: any): Product {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    price: dbProduct.price / 100, // 從分轉換為元
    originalPrice: dbProduct.originalPrice ? dbProduct.originalPrice / 100 : undefined,
    image: dbProduct.image,
    categoryId: dbProduct.categoryId,
    sold: dbProduct.sold || 0,
    rating: dbProduct.rating ? dbProduct.rating / 100 : 0,
    description: dbProduct.description,
    stock: dbProduct.stock || 0,
    status: dbProduct.status || 'active',
    createdAt: dbProduct.createdAt,
    updatedAt: dbProduct.updatedAt,
  };
}

// 轉換數據庫分類格式為前端格式
function convertDbCategoryToFrontend(dbCategory: any): any {
  return {
    id: dbCategory.id,
    name: dbCategory.name,
    nameEn: dbCategory.nameEn,
    icon: dbCategory.icon || '📦',
    order: dbCategory.order || 0,
  };
}

export default function AdminProducts() {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // 使用 TRPC 獲取商品和分類數據
  const { data: apiProducts = [], isLoading: productsLoading, refetch: refetchProducts } = trpc.products.list.useQuery({ limit: 200 });
  const { data: apiCategories = [] } = trpc.categories.list.useQuery();

  // TRPC 變更操作
  const createProductMutation = trpc.products.create.useMutation();
  const updateProductMutation = trpc.products.update.useMutation();
  const deleteProductMutation = trpc.products.delete.useMutation();

  // 轉換 API 數據為前端格式
  const products = apiProducts.length > 0 
    ? apiProducts.map(convertDbProductToFrontend)
    : defaultProducts;

  const categories = apiCategories.length > 0
    ? apiCategories.map(convertDbCategoryToFrontend)
    : defaultCategories;

  // 過濾商品
  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = filterCategory === 'All' || (p.categoryId?.toString() === filterCategory);
      const matchStatus = filterStatus === 'All' || p.status === filterStatus;
      return matchSearch && matchCat && matchStatus;
    });
  }, [products, searchQuery, filterCategory, filterStatus]);

  const handleSave = async (formData: Product) => {
    try {
      if (formData.id && editingProduct) {
        // 更新現有商品
        await updateProductMutation.mutateAsync({
          id: formData.id,
          name: formData.name,
          description: formData.description || undefined,
          price: formData.price,
          originalPrice: formData.originalPrice || undefined,
          categoryId: formData.categoryId || undefined,
          image: formData.image || undefined,
          stock: formData.stock,
          status: formData.status as 'active' | 'inactive' | 'deleted',
        });
        toast.success(language === 'zh' ? '商品已成功更新' : 'Product updated successfully!');
      } else {
        // 創建新商品
        await createProductMutation.mutateAsync({
          name: formData.name,
          description: formData.description || undefined,
          price: formData.price,
          originalPrice: formData.originalPrice || undefined,
          categoryId: formData.categoryId || undefined,
          image: formData.image || undefined,
          stock: formData.stock,
        });
        toast.success(language === 'zh' ? '商品已成功添加' : 'Product added successfully!');
      }
      
      // 重新獲取商品列表
      await refetchProducts();
      setShowModal(false);
      setEditingProduct(null);
    } catch (error: any) {
      toast.error(error.message || (language === 'zh' ? '操作失敗' : 'Operation failed'));
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm(language === 'zh' ? '你確定要刪除此商品嗎？' : 'Are you sure you want to delete this product?')) {
      try {
        await deleteProductMutation.mutateAsync(id);
        toast.success(language === 'zh' ? '商品已刪除' : 'Product deleted.');
        await refetchProducts();
      } catch (error: any) {
        toast.error(error.message || (language === 'zh' ? '刪除失敗' : 'Delete failed'));
      }
    }
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-600',
    deleted: 'bg-red-100 text-red-700',
    out_of_stock: 'bg-red-100 text-red-700',
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{language === 'zh' ? '商品管理' : 'Products'}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {productsLoading ? (
              <span>{language === 'zh' ? '加載中...' : 'Loading...'}</span>
            ) : (
              <span>{products.length} {language === 'zh' ? '個商品' : 'products total'}</span>
            )}
          </p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setShowModal(true); }}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
          disabled={createProductMutation.isPending}
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
            {categories.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400"
          >
            <option value="All">{language === 'zh' ? '所有狀態' : 'All Status'}</option>
            <option value="active">{language === 'zh' ? '活躍' : 'Active'}</option>
            <option value="inactive">{language === 'zh' ? '非活躍' : 'Inactive'}</option>
            <option value="deleted">{language === 'zh' ? '已刪除' : 'Deleted'}</option>
          </select>
          <span className="text-sm text-gray-500">{filtered.length} {language === 'zh' ? '個結果' : 'results'}</span>
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
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '價格' : 'Price'}</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '庫存' : 'Stock'}</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '已賣' : 'Sold'}</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '狀態' : 'Status'}</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '操作' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {productsLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                    {language === 'zh' ? '加載商品中...' : 'Loading products...'}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <Package size={40} className="mx-auto mb-3 opacity-30 text-gray-400" />
                    <p className="text-gray-400">{language === 'zh' ? '未找到商品' : 'No products found'}</p>
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
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
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{product.categoryId || 'N/A'}</span>
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
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[product.status] || 'bg-gray-100 text-gray-600'}`}>
                        {product.status}
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
                          disabled={deleteProductMutation.isPending}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product edit dialog */}
      <ProductEditDialog
        isOpen={showModal}
        product={editingProduct}
        onClose={() => {
          setShowModal(false);
          setEditingProduct(null);
        }}
        onSave={handleSave}
      />
    </AdminLayout>
  );
}
