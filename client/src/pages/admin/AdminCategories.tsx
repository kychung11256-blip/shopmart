/**
 * ShopMart Admin - Categories Management
 * Design: 深色側邊欄 + 白色內容區域
 */

import { useState } from 'react';
import { Plus, Edit2, Trash2, Tag, X, Save } from 'lucide-react';
import { AdminLayout } from './Dashboard';
import { categories as initialCategories } from '@/lib/data';
import type { Category } from '@/lib/data';
import { toast } from 'sonner';

function CategoryModal({ category, onClose, onSave }: {
  category: Partial<Category> | null;
  onClose: () => void;
  onSave: (c: Partial<Category>) => void;
}) {
  const [form, setForm] = useState<Partial<Category>>(category || { name: '', icon: '📦', count: 0 });

  const emojiOptions = ['🏠', '🌿', '💻', '👗', '🧸', '💄', '🍷', '⚽', '📱', '🎮', '🎨', '📚', '🔧', '🌸', '🎵'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {category?.id ? 'Edit Category' : 'Add Category'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
            <input
              type="text"
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-red-400"
              placeholder="Enter category name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
            <div className="grid grid-cols-8 gap-2">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm({ ...form, icon: emoji })}
                  className={`w-9 h-9 text-xl rounded border transition-colors ${
                    form.icon === emoji ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => onSave(form)}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {category?.id ? 'Save Changes' : 'Add Category'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCategories() {
  const [categoryList, setCategoryList] = useState(initialCategories);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  const handleSave = (formData: Partial<Category>) => {
    if (formData.id) {
      setCategoryList(prev => prev.map(c => c.id === formData.id ? { ...c, ...formData } as Category : c));
      toast.success('Category updated!');
    } else {
      const newCat: Category = { ...formData, id: Date.now(), count: 0 } as Category;
      setCategoryList(prev => [...prev, newCat]);
      toast.success('Category added!');
    }
    setShowModal(false);
    setEditingCategory(null);
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this category?')) {
      setCategoryList(prev => prev.filter(c => c.id !== id));
      toast.success('Category deleted.');
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
          <p className="text-gray-500 text-sm mt-1">{categoryList.length} categories</p>
        </div>
        <button
          onClick={() => { setEditingCategory(null); setShowModal(true); }}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categoryList.map((category) => (
          <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center text-2xl">
                {category.icon}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => { setEditingCategory(category); setShowModal(true); }}
                  className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <h3 className="font-semibold text-gray-700">{category.name}</h3>
            <p className="text-sm text-gray-400 mt-1">{category.count} products</p>
            <div className="mt-3 bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-red-400 h-1.5 rounded-full"
                style={{ width: `${Math.min((category.count / 150) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => { setShowModal(false); setEditingCategory(null); }}
          onSave={handleSave}
        />
      )}
    </AdminLayout>
  );
}
