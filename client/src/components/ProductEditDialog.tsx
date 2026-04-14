import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, X, ImagePlus, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import type { Product } from '@/lib/data';

interface ProductEditDialogProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSave: (product: Product) => Promise<void>;
}

export default function ProductEditDialog({ isOpen, product, onClose, onSave }: ProductEditDialogProps) {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    stock: 0,
    status: 'active',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImageMutation = trpc.products.uploadImage.useMutation();

  useEffect(() => {
    if (product) {
      setFormData({
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        categoryId: product.categoryId,
        stock: product.stock,
        sold: product.sold,
        rating: product.rating,
        status: product.status,
        description: product.description,
        image: product.image,
        createdAt: product.createdAt,
      });
    } else {
      setFormData({
        name: '',
        price: 0,
        stock: 0,
        status: 'active',
      });
    }
  }, [product, isOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    setIsUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64 = (event.target?.result as string).split(',')[1];
          const result = await uploadImageMutation.mutateAsync({
            base64,
            fileName: file.name,
            mimeType: file.type,
          });
          setFormData((prev) => ({ ...prev, image: result.url }));
          toast.success('Image uploaded successfully');
        } catch (error: any) {
          toast.error('Failed to upload image: ' + (error?.message || 'Unknown error'));
        } finally {
          setIsUploadingImage(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error('Failed to read file');
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image: '' }));
  };

  const handleSave = async () => {
    // 驗證必填欄位
    if (!formData.name || formData.price === undefined || formData.price < 0) {
      toast.error('Please fill in all required fields (Name and Price)');
      return;
    }

    setIsSaving(true);
    try {
      const productData: Product = {
        id: formData.id || 0,
        name: formData.name,
        price: formData.price,
        originalPrice: formData.originalPrice || 0,
        categoryId: formData.categoryId || 1,
        stock: formData.stock || 0,
        sold: formData.sold || 0,
        rating: formData.rating || 0,
        status: (formData.status as 'active' | 'inactive' | 'deleted') || 'active',
        description: formData.description || '',
        image: formData.image || '',
        createdAt: formData.createdAt || new Date(),
      };

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg w-full flex flex-col max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>{formData.id ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 py-2">

          {/* Product Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Product Image</label>
            {formData.image ? (
              <div className="relative w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50" style={{ aspectRatio: '4/3' }}>
                <img
                  src={formData.image}
                  alt="Product"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=400&h=300&fit=crop';
                  }}
                />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="bg-white text-gray-700 px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 hover:bg-gray-100 transition-colors"
                  >
                    <Upload size={12} />
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="bg-red-500 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 hover:bg-red-600 transition-colors"
                  >
                    <X size={12} />
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="w-full border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 py-8 text-gray-400 hover:border-purple-400 hover:text-purple-500 transition-colors bg-gray-50 hover:bg-purple-50"
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 size={28} className="animate-spin text-purple-500" />
                    <span className="text-sm">Uploading...</span>
                  </>
                ) : (
                  <>
                    <ImagePlus size={28} />
                    <span className="text-sm font-medium">Click to upload image</span>
                    <span className="text-xs">PNG, JPG, WEBP up to 5MB</span>
                  </>
                )}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            {/* Manual URL input */}
            <div className="mt-2">
              <Input
                placeholder="Or paste image URL directly"
                value={formData.image || ''}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Product Name *</label>
            <Input
              placeholder="Enter product name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Price *</label>
              <Input
                type="number"
                placeholder="0.00"
                step="0.01"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Original Price</label>
              <Input
                type="number"
                placeholder="0.00"
                step="0.01"
                value={formData.originalPrice || ''}
                onChange={(e) => setFormData({ ...formData, originalPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <Select value={String(formData.categoryId || 1)} onValueChange={(val) => setFormData({ ...formData, categoryId: parseInt(val) })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">HOME PET</SelectItem>
                  <SelectItem value="2">OUTDOORS</SelectItem>
                  <SelectItem value="3">DIGITAL</SelectItem>
                  <SelectItem value="4">Apparel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select value={formData.status || 'active'} onValueChange={(val) => setFormData({ ...formData, status: val as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stock & Sold */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                庫存數量
                <span className="ml-1 text-xs text-gray-400 font-normal">(0 = 售罄，自動變灰)</span>
              </label>
              <Input
                type="number"
                placeholder="例如：30"
                min="0"
                value={formData.stock ?? ''}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-gray-400 mt-1">付款成功後自動扣減庫存</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">已售數量</label>
              <Input
                type="number"
                placeholder="0"
                min="0"
                value={formData.sold ?? ''}
                onChange={(e) => setFormData({ ...formData, sold: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-gray-400 mt-1">付款成功後自動累加</p>
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium mb-1">Rating (0-5)</label>
            <Input
              type="number"
              placeholder="5.0"
              step="0.1"
              min="0"
              max="5"
              value={formData.rating || ''}
              onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              placeholder="Enter product description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="shrink-0 pt-2 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isUploadingImage}>
            {isSaving ? (
              <><Loader2 size={14} className="animate-spin mr-1" /> Saving...</>
            ) : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
