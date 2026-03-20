/**
 * ShopMart Admin - Products Management
 * Design: 深色側邊欄 + 白色內容區域
 */

import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, Filter, Upload, X, Save, Package } from 'lucide-react';
import { AdminLayout } from './Dashboard';
import { products as initialProducts, categories } from '@/lib/data';
import type { Product } from '@/lib/data';
import { toast } from 'sonner';

function ProductModal({ product, onClose, onSave }: {
  product: Partial<Product> | null;
  onClose: () => void;
  onSave: (p: Partial<Product>) => void;
}) {
  const [form, setForm] = useState<Partial<Product>>(product || {
    name: '', price: 0, originalPrice: 0, category: 'Apparel',
    stock: 0, status: 'active', description: '', image: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {product?.id ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input
                type="text"
                value={form.name || ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-red-400"
                placeholder="Enter product name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
              <input
                type="number"
                step="0.01"
                value={form.price || ''}
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
                required
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-red-400"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Original Price</label>
              <input
                type="number"
                step="0.01"
                value={form.originalPrice || ''}
                onChange={(e) => setForm({ ...form, originalPrice: parseFloat(e.target.value) })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-red-400"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={form.category || ''}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-red-400"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
              <input
                type="number"
                value={form.stock || ''}
                onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) })}
                required
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-red-400"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status || 'active'}
                onChange={(e) => setForm({ ...form, status: e.target.value as Product['status'] })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-red-400"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input
                type="url"
                value={form.image || ''}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-red-400"
                placeholder="https://..."
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-red-400 resize-none"
                placeholder="Product description..."
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {product?.id ? 'Save Changes' : 'Add Product'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const [productList, setProductList] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const filtered = productList.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = filterCategory === 'All' || p.category === filterCategory;
    const matchStatus = filterStatus === 'All' || p.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const handleSave = (formData: Partial<Product>) => {
    if (formData.id) {
      setProductList(prev => prev.map(p => p.id === formData.id ? { ...p, ...formData } as Product : p));
      toast.success('Product updated successfully!');
    } else {
      const newProduct: Product = {
        ...formData,
        id: Date.now(),
        sold: 0,
        rating: 5.0,
        createdAt: new Date().toISOString().split('T')[0],
      } as Product;
      setProductList(prev => [newProduct, ...prev]);
      toast.success('Product added successfully!');
    }
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProductList(prev => prev.filter(p => p.id !== id));
      toast.success('Product deleted.');
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
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
          <p className="text-gray-500 text-sm mt-1">{productList.length} products total</p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setShowModal(true); }}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Add Product
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
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-red-400"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400"
          >
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400"
          >
            <option value="All">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
          <span className="text-sm text-gray-500">{filtered.length} results</span>
        </div>
      </div>

      {/* Products table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Product</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Category</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Price</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Stock</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Sold</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image}
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
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{product.category}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div>
                      <span className="text-sm font-semibold text-red-500">${product.price.toFixed(2)}</span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <p className="text-xs text-gray-400 line-through">${product.originalPrice.toFixed(2)}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-sm font-medium ${product.stock < 10 ? 'text-red-500' : 'text-gray-700'}`}>
                      {product.stock}
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

      {showModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => { setShowModal(false); setEditingProduct(null); }}
          onSave={handleSave}
        />
      )}
    </AdminLayout>
  );
}
