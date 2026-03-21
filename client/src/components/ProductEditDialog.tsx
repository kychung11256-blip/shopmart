/**
 * ShopMart - Product Edit Dialog
 * 商品編輯彈窗，支援圖片上傳和表單編輯
 */

import { useState } from 'react';
import * as React from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import type { Product } from '@/lib/data';
import { toast } from 'sonner';

interface ProductEditDialogProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSave: (product: Product) => Promise<void>;
}

interface FormData {
  id?: number;
  name: string;
  price: number;
  originalPrice?: number;
  categoryId?: number;
  stock: number;
  sold?: number;
  rating?: number;
  status: 'active' | 'inactive' | 'deleted';
  description?: string;
  image?: string;
  createdAt?: string;
}

export default function ProductEditDialog({ isOpen, product, onClose, onSave }: ProductEditDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    price: 0,
    stock: 0,
    status: 'active',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 當product改變時更新formData
  React.useEffect(() => {
    if (product) {
      setFormData({
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice || undefined,
        categoryId: product.categoryId || undefined,
        stock: product.stock || 0,
        sold: product.sold || undefined,
        rating: product.rating || undefined,
        status: (product.status as 'active' | 'inactive' | 'deleted') || 'active',
        description: product.description || undefined,
        image: product.image || undefined,
        createdAt: typeof product.createdAt === 'string' ? product.createdAt : undefined,
      });
      setImagePreview(product.image || null);
    } else {
      setFormData({
        name: '',
        price: 0,
        stock: 0,
        status: 'active',
      });
      setImagePreview(null);
    }
  }, [product, isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 檢查文件大小（限制 5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // 檢查文件類型
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setIsUploading(true);

    // 模擬上傳延遲
    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImagePreview(result);
        setFormData({ ...formData, image: result });
        setIsUploading(false);
        toast.success('Image uploaded successfully');
      };
      reader.readAsDataURL(file);
    }, 500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // 數字字段轉換
    if (['price', 'originalPrice', 'stock', 'sold', 'rating'].includes(name)) {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0,
      });
    } else if (name === 'categoryId') {
      setFormData({
        ...formData,
        [name]: value ? parseInt(value) : undefined,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSave = async () => {
    if (!formData) return;

    // 驗證必填欄位
    if (!formData.name || formData.price === undefined || formData.price < 0) {
      toast.error('Please fill in all required fields (Name and Price)');
      return;
    }

    setIsSaving(true);
    try {
      // 轉換為 Product 格式
      const productData: Product = {
        id: formData.id || 0,
        name: formData.name,
        price: formData.price,
        originalPrice: formData.originalPrice,
        categoryId: formData.categoryId,
        stock: formData.stock,
        sold: formData.sold || 0,
        rating: formData.rating || 0,
        status: formData.status,
        description: formData.description,
        image: formData.image,
        createdAt: formData.createdAt ? new Date(formData.createdAt) : new Date(),
      };

      // 等待異步保存完成
      await onSave(productData);
      toast.success(formData.id ? 'Product updated successfully' : 'Product created successfully');
      onClose();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {product?.id ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSaving}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image Upload Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Product Image</label>
            <div className="flex gap-4">
              {/* Image Preview */}
              <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden shrink-0">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <ImageIcon size={32} className="mx-auto text-gray-300 mb-1" />
                    <p className="text-xs text-gray-400">No image</p>
                  </div>
                )}
              </div>

              {/* Upload Area */}
              <div className="flex-1">
                <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors">
                  <div className="flex flex-col items-center gap-2">
                    <Upload size={24} className="text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Click to upload</p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading || isSaving}
                    className="hidden"
                  />
                </label>
                {isUploading && (
                  <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter product name"
                disabled={isSaving}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 disabled:bg-gray-100"
              />
            </div>

            {/* Category and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="categoryId"
                  value={formData.categoryId || ''}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 disabled:bg-gray-100"
                >
                  <option value="">Select category</option>
                  <option value="1">HOME PET</option>
                  <option value="2">OUTDOORS</option>
                  <option value="3">DIGITAL</option>
                  <option value="4">Apparel</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 disabled:bg-gray-100"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="deleted">Deleted</option>
                </select>
              </div>
            </div>

            {/* Price Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  disabled={isSaving}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Original Price</label>
                <input
                  type="number"
                  name="originalPrice"
                  value={formData.originalPrice || ''}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  disabled={isSaving}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 disabled:bg-gray-100"
                />
              </div>
            </div>

            {/* Stock and Sold */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  disabled={isSaving}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sold</label>
                <input
                  type="number"
                  name="sold"
                  value={formData.sold || ''}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  disabled={isSaving}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 disabled:bg-gray-100"
                />
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating (0-5)</label>
              <input
                type="number"
                name="rating"
                value={formData.rating || ''}
                onChange={handleInputChange}
                placeholder="5.0"
                min="0"
                max="5"
                step="0.1"
                disabled={isSaving}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 disabled:bg-gray-100"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                placeholder="Enter product description"
                rows={4}
                disabled={isSaving}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 disabled:bg-gray-100 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end border-t border-gray-200 pt-6">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
