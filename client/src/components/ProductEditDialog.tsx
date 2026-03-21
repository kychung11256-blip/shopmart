import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
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

  const handleSave = async () => {
    window.alert('[ProductEditDialog] handleSave called!');
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

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{formData.id ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
              <label className="block text-sm font-medium mb-1">Stock</label>
              <Input
                type="number"
                placeholder="0"
                value={formData.stock || ''}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sold</label>
              <Input
                type="number"
                placeholder="0"
                value={formData.sold || ''}
                onChange={(e) => setFormData({ ...formData, sold: parseInt(e.target.value) || 0 })}
              />
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
