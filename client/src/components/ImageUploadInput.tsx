/**
 * ImageUploadInput — 可重用圖片上傳組件
 * 支援：拖拽上傳、點擊選擇、圖片預覽、上傳進度、CDN URL 自動回填
 *
 * Props:
 *   value       - 目前的圖片 URL（顯示預覽）
 *   onChange    - 上傳成功後回傳 CDN URL
 *   uploadFn    - 執行上傳的非同步函數，回傳 { url }
 *   disabled    - 是否禁用
 *   accept      - 接受的 MIME 類型（預設 image/*）
 *   maxSizeMB   - 最大檔案大小 MB（預設 5）
 *   className   - 額外的 CSS class
 */

import { useRef, useState, useCallback } from 'react';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ImageUploadInputProps {
  value?: string;
  onChange: (url: string) => void;
  uploadFn: (params: { base64: string; fileName: string; mimeType: string }) => Promise<{ url: string }>;
  disabled?: boolean;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

export default function ImageUploadInput({
  value,
  onChange,
  uploadFn,
  disabled = false,
  accept = 'image/*',
  maxSizeMB = 5,
  className,
}: ImageUploadInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const processFile = useCallback(
    async (file: File) => {
      // Validate MIME type
      if (!file.type.startsWith('image/')) {
        toast.error('請選擇圖片檔案（JPG、PNG、GIF、WebP 等）');
        return;
      }
      // Validate size
      const maxBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        toast.error(`圖片大小不能超過 ${maxSizeMB}MB`);
        return;
      }

      setIsUploading(true);
      setUploadProgress(10);

      try {
        // Read file as base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Strip data URL prefix: "data:image/jpeg;base64,..."
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        setUploadProgress(40);

        const { url } = await uploadFn({
          base64,
          fileName: file.name,
          mimeType: file.type,
        });

        setUploadProgress(100);
        onChange(url);
        toast.success('圖片上傳成功！');
      } catch (err: any) {
        toast.error(`上傳失敗：${err?.message || '請稍後再試'}`);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [uploadFn, onChange, maxSizeMB]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const handleClick = () => {
    if (!disabled && !isUploading) inputRef.current?.click();
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Upload zone */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-all cursor-pointer',
          'flex flex-col items-center justify-center gap-2 text-sm',
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border hover:border-primary/50 hover:bg-muted/30',
          (disabled || isUploading) && 'opacity-60 cursor-not-allowed pointer-events-none',
          value ? 'p-2 min-h-[120px]' : 'p-6 min-h-[120px]'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled || isUploading}
        />

        {/* Preview image */}
        {value && !isUploading && (
          <div className="relative w-full">
            <img
              src={value}
              alt="Banner preview"
              className="w-full max-h-48 object-contain rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/80 transition-colors shadow"
            >
              <X size={12} />
            </button>
            <div className="mt-2 text-center text-xs text-muted-foreground">
              點擊或拖拽以更換圖片
            </div>
          </div>
        )}

        {/* Uploading state */}
        {isUploading && (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 size={28} className="animate-spin text-primary" />
            <span className="text-muted-foreground">上傳中...</span>
            <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!value && !isUploading && (
          <>
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              {isDragging ? (
                <Upload size={20} className="text-primary" />
              ) : (
                <ImageIcon size={20} className="text-muted-foreground" />
              )}
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">
                {isDragging ? '放開以上傳' : '點擊或拖拽圖片至此'}
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                支援 JPG、PNG、GIF、WebP，最大 {maxSizeMB}MB
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
