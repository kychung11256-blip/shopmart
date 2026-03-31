import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Banner {
  id: number;
  title: string;
  titleEn?: string;
  subtitle?: string;
  subtitleEn?: string;
  image: string;
  link?: string;
  ctaText?: string;
  ctaTextEn?: string;
  order: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export default function BannerManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    titleEn: '',
    subtitle: '',
    subtitleEn: '',
    image: '',
    link: '',
    ctaText: '',
    ctaTextEn: '',
  });

  const { data: banners = [], isLoading, refetch } = trpc.banners.getAll.useQuery();
  const createMutation = trpc.banners.create.useMutation();
  const updateMutation = trpc.banners.update.useMutation();
  const deleteMutation = trpc.banners.delete.useMutation();
  const reorderMutation = trpc.banners.reorder.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          ...formData,
        });
        toast.success('Banner updated successfully');
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('Banner created successfully');
      }
      setFormData({
        title: '',
        titleEn: '',
        subtitle: '',
        subtitleEn: '',
        image: '',
        link: '',
        ctaText: '',
        ctaTextEn: '',
      });
      setEditingId(null);
      setIsOpen(false);
      refetch();
    } catch (error) {
      toast.error('Failed to save banner');
    }
  };

  const handleEdit = (banner: Banner) => {
    setFormData({
      title: banner.title,
      titleEn: banner.titleEn || '',
      subtitle: banner.subtitle || '',
      subtitleEn: banner.subtitleEn || '',
      image: banner.image,
      link: banner.link || '',
      ctaText: banner.ctaText || '',
      ctaTextEn: banner.ctaTextEn || '',
    });
    setEditingId(banner.id);
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this banner?')) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success('Banner deleted successfully');
        refetch();
      } catch (error) {
        toast.error('Failed to delete banner');
      }
    }
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingId(null);
    setFormData({
      title: '',
      titleEn: '',
      subtitle: '',
      subtitleEn: '',
      image: '',
      link: '',
      ctaText: '',
      ctaTextEn: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Banner Management</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleCloseDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Banner' : 'Create New Banner'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Title (Chinese)
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Banner title in Chinese"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Title (English)
                  </label>
                  <Input
                    value={formData.titleEn}
                    onChange={(e) =>
                      setFormData({ ...formData, titleEn: e.target.value })
                    }
                    placeholder="Banner title in English"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Subtitle (Chinese)
                  </label>
                  <Input
                    value={formData.subtitle}
                    onChange={(e) =>
                      setFormData({ ...formData, subtitle: e.target.value })
                    }
                    placeholder="Banner subtitle in Chinese"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Subtitle (English)
                  </label>
                  <Input
                    value={formData.subtitleEn}
                    onChange={(e) =>
                      setFormData({ ...formData, subtitleEn: e.target.value })
                    }
                    placeholder="Banner subtitle in English"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Image URL
                </label>
                <Input
                  value={formData.image}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                  type="url"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Link URL (optional)
                </label>
                <Input
                  value={formData.link}
                  onChange={(e) =>
                    setFormData({ ...formData, link: e.target.value })
                  }
                  placeholder="https://example.com/products"
                  type="url"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    CTA Text (Chinese)
                  </label>
                  <Input
                    value={formData.ctaText}
                    onChange={(e) =>
                      setFormData({ ...formData, ctaText: e.target.value })
                    }
                    placeholder="Call-to-action text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    CTA Text (English)
                  </label>
                  <Input
                    value={formData.ctaTextEn}
                    onChange={(e) =>
                      setFormData({ ...formData, ctaTextEn: e.target.value })
                    }
                    placeholder="Call-to-action text"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {editingId ? 'Update' : 'Create'} Banner
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading banners...</div>
      ) : banners.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No banners yet. Create your first banner to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {banners.map((banner: Banner) => (
            <Card key={banner.id}>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="w-24 h-24 object-cover rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{banner.title}</h3>
                    {banner.titleEn && (
                      <p className="text-sm text-gray-500">{banner.titleEn}</p>
                    )}
                    {banner.subtitle && (
                      <p className="text-sm text-gray-600 mt-1">
                        {banner.subtitle}
                      </p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          banner.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {banner.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        Order: {banner.order}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(banner)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(banner.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
