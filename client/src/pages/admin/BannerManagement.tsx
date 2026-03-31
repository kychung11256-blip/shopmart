import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import ImageUploadInput from '@/components/ImageUploadInput';

interface Banner {
  id: number;
  title: string;
  titleEn?: string | null;
  subtitle?: string | null;
  subtitleEn?: string | null;
  image: string;
  link?: string | null;
  ctaText?: string | null;
  ctaTextEn?: string | null;
  order: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

const emptyForm = {
  title: '',
  titleEn: '',
  subtitle: '',
  subtitleEn: '',
  image: '',
  link: '',
  ctaText: '',
  ctaTextEn: '',
};

export default function BannerManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const { data: banners = [], isLoading, refetch } = trpc.banners.getAll.useQuery();
  const createMutation = trpc.banners.create.useMutation();
  const updateMutation = trpc.banners.update.useMutation();
  const deleteMutation = trpc.banners.delete.useMutation();
  const uploadImageMutation = trpc.banners.uploadImage.useMutation();

  // Upload function passed to ImageUploadInput
  const handleUploadImage = async (params: {
    base64: string;
    fileName: string;
    mimeType: string;
  }) => {
    return await uploadImageMutation.mutateAsync(params);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.image) {
      toast.error('請上傳 Banner 圖片');
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...formData });
        toast.success('Banner 更新成功');
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('Banner 建立成功');
      }
      setFormData(emptyForm);
      setEditingId(null);
      setIsOpen(false);
      refetch();
    } catch (error) {
      toast.error('儲存 Banner 失敗，請稍後再試');
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
    if (!confirm('確定要刪除此 Banner 嗎？')) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success('Banner 已刪除');
      refetch();
    } catch {
      toast.error('刪除失敗，請稍後再試');
    }
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Banner 管理</h1>
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCloseDialog(); else setIsOpen(true); }}>
          <DialogTrigger asChild>
            <Button onClick={handleCloseDialog}>
              <Plus className="w-4 h-4 mr-2" />
              新增 Banner
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? '編輯 Banner' : '新增 Banner'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Banner 圖片
                  <span className="text-destructive ml-1">*</span>
                </label>
                <ImageUploadInput
                  value={formData.image}
                  onChange={(url) => setFormData({ ...formData, image: url })}
                  uploadFn={handleUploadImage}
                  maxSizeMB={5}
                />
                {/* Fallback: manual URL input */}
                <div className="mt-2">
                  <label className="block text-xs text-muted-foreground mb-1">
                    或直接輸入圖片網址
                  </label>
                  <Input
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://example.com/banner.jpg"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Title */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    標題（中文）<span className="text-destructive ml-1">*</span>
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Banner 中文標題"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    標題（英文）
                  </label>
                  <Input
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    placeholder="Banner English title"
                  />
                </div>
              </div>

              {/* Subtitle */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    副標題（中文）
                  </label>
                  <Input
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="Banner 中文副標題"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    副標題（英文）
                  </label>
                  <Input
                    value={formData.subtitleEn}
                    onChange={(e) => setFormData({ ...formData, subtitleEn: e.target.value })}
                    placeholder="Banner English subtitle"
                  />
                </div>
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  連結網址（選填）
                </label>
                <Input
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://example.com/products"
                />
              </div>

              {/* CTA */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    按鈕文字（中文）
                  </label>
                  <Input
                    value={formData.ctaText}
                    onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                    placeholder="立即購買"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    按鈕文字（英文）
                  </label>
                  <Input
                    value={formData.ctaTextEn}
                    onChange={(e) => setFormData({ ...formData, ctaTextEn: e.target.value })}
                    placeholder="Shop Now"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-2 border-t">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending ||
                    updateMutation.isPending ||
                    uploadImageMutation.isPending
                  }
                >
                  {editingId ? '更新' : '建立'} Banner
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Banner list */}
      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">載入中...</div>
      ) : banners.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-lg font-medium mb-1">尚無 Banner</p>
            <p className="text-sm">點擊「新增 Banner」開始建立首頁輪播圖。</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {banners.map((banner: Banner) => (
            <Card key={banner.id}>
              <CardContent className="pt-5 pb-5">
                <div className="flex gap-4 items-start">
                  {/* Thumbnail */}
                  <div className="shrink-0 w-28 h-20 rounded overflow-hidden bg-muted border">
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="112" height="80" viewBox="0 0 112 80"><rect fill="%23f3f4f6" width="112" height="80"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="11">No Image</text></svg>';
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">{banner.title}</h3>
                    {banner.titleEn && (
                      <p className="text-sm text-muted-foreground truncate">{banner.titleEn}</p>
                    )}
                    {banner.subtitle && (
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">{banner.subtitle}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          banner.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {banner.status === 'active' ? '顯示中' : '已停用'}
                      </span>
                      <span className="text-xs text-muted-foreground">排序：{banner.order}</span>
                    </div>
                    {/* CDN URL display */}
                    <p className="text-xs text-muted-foreground mt-1.5 truncate max-w-xs" title={banner.image}>
                      {banner.image}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(banner)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(banner.id)}
                      disabled={deleteMutation.isPending}
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
