import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { AdminLayout } from './Dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Edit2, Trash2, Plus, Save, X, AlertTriangle } from 'lucide-react';

type DeleteTarget =
  | { type: 'single'; id: number; name: string }
  | { type: 'batch'; ids: number[]; count: number };

export default function AdminCategories() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newOrder, setNewOrder] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [showForceConfirm, setShowForceConfirm] = useState(false);

  // Queries
  const { data: categories = [], isLoading, refetch } = trpc.categories.listAll.useQuery();

  // Mutations
  const createMutation = trpc.categories.create.useMutation({
    onSuccess: () => {
      toast.success('品類建立成功');
      setNewName('');
      setNewDescription('');
      setNewOrder(0);
      refetch();
    },
    onError: (error) => {
      toast.error(`建立失敗：${error.message}`);
    },
  });

  const updateMutation = trpc.categories.update.useMutation({
    onSuccess: () => {
      toast.success('品類更新成功');
      setEditingId(null);
      setEditingData(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`);
    },
  });

  const deleteMutation = trpc.categories.delete.useMutation({
    onSuccess: () => {
      toast.success('品類已刪除');
      setDeleteTarget(null);
      setShowForceConfirm(false);
      refetch();
    },
    onError: (error) => {
      if (error.message === 'CATEGORY_HAS_PRODUCTS') {
        // Show force confirm dialog
        setShowForceConfirm(true);
      } else {
        toast.error(`刪除失敗：${error.message}`);
        setDeleteTarget(null);
      }
    },
  });

  const batchDeleteMutation = trpc.categories.batchDelete.useMutation({
    onSuccess: (data) => {
      toast.success(`已刪除 ${data.deletedCount} 個品類`);
      setSelectedIds(new Set());
      setDeleteTarget(null);
      setShowForceConfirm(false);
      refetch();
    },
    onError: (error) => {
      if (error.message === 'CATEGORY_HAS_PRODUCTS') {
        setShowForceConfirm(true);
      } else {
        toast.error(`批量刪除失敗：${error.message}`);
        setDeleteTarget(null);
      }
    },
  });

  const handleSave = async () => {
    if (!editingData?.name) {
      toast.error('品類名稱為必填');
      return;
    }
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        id: editingId!,
        name: editingData.name,
        description: editingData.description,
        order: editingData.order,
        status: editingData.status,
      });
    } catch (error) {
      console.error('[AdminCategories] Error saving category:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData(null);
  };

  // Trigger delete: open confirm dialog
  const handleDeleteClick = (id: number, name: string) => {
    setShowForceConfirm(false);
    setDeleteTarget({ type: 'single', id, name });
  };

  // Confirm delete (first attempt, no force)
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'single') {
      await deleteMutation.mutateAsync({ id: deleteTarget.id, force: false });
    } else {
      await batchDeleteMutation.mutateAsync({ ids: deleteTarget.ids, force: false });
    }
  };

  // Force delete (second attempt, with force)
  const handleForceDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'single') {
      await deleteMutation.mutateAsync({ id: deleteTarget.id, force: true });
    } else {
      await batchDeleteMutation.mutateAsync({ ids: deleteTarget.ids, force: true });
    }
  };

  const handleAddNew = async () => {
    if (!newName.trim()) {
      toast.error('品類名稱為必填');
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: newName,
        description: newDescription || undefined,
        order: newOrder,
      });
    } catch (error) {
      console.error('[AdminCategories] Error creating category:', error);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === categories.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(categories.map((c) => c.id)));
    }
  };

  const handleSelectCategory = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBatchDeleteClick = () => {
    if (selectedIds.size === 0) {
      toast.error('請先選擇要刪除的品類');
      return;
    }
    setShowForceConfirm(false);
    setDeleteTarget({ type: 'batch', ids: Array.from(selectedIds), count: selectedIds.size });
  };

  const isDeletePending = deleteMutation.isPending || batchDeleteMutation.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">品類管理</h1>
          {selectedIds.size > 0 && (
            <Button
              onClick={handleBatchDeleteClick}
              disabled={isDeletePending}
              variant="destructive"
            >
              <Trash2 size={16} className="mr-2" />
              刪除已選 {selectedIds.size} 個
            </Button>
          )}
        </div>

        {/* Add New Category Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">新增品類</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              type="text"
              placeholder="品類名稱"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddNew()}
            />
            <Input
              type="text"
              placeholder="說明（選填）"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            <Input
              type="number"
              placeholder="排序"
              value={newOrder}
              onChange={(e) => setNewOrder(parseInt(e.target.value) || 0)}
            />
            <Button
              onClick={handleAddNew}
              disabled={createMutation.isPending}
              className="w-full"
            >
              <Plus size={16} className="mr-2" />
              新增品類
            </Button>
          </div>
        </div>

        {/* Categories Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === categories.length && categories.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">名稱</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">說明</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">排序</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">狀態</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">操作</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      載入中...
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      尚無品類
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr
                      key={category.id}
                      className={`border-b hover:bg-gray-50 ${selectedIds.has(category.id) ? 'bg-blue-50' : ''}`}
                    >
                      {editingId === category.id ? (
                        <>
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(category.id)}
                              onChange={() => handleSelectCategory(category.id)}
                              className="w-4 h-4 rounded"
                            />
                          </td>
                          <td className="px-6 py-4">{category.id}</td>
                          <td className="px-6 py-4">
                            <Input
                              type="text"
                              value={editingData.name}
                              onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                              className="w-full"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <Input
                              type="text"
                              value={editingData.description || ''}
                              onChange={(e) => setEditingData({ ...editingData, description: e.target.value })}
                              className="w-full"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <Input
                              type="number"
                              value={editingData.order || 0}
                              onChange={(e) => setEditingData({ ...editingData, order: parseInt(e.target.value) })}
                              className="w-full"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={editingData.status}
                              onChange={(e) => setEditingData({ ...editingData, status: e.target.value })}
                              className="border rounded px-2 py-1 text-sm"
                            >
                              <option value="active">啟用</option>
                              <option value="inactive">停用</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={isSaving}
                                variant="default"
                              >
                                <Save size={16} />
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleCancel}
                                variant="outline"
                              >
                                <X size={16} />
                              </Button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(category.id)}
                              onChange={() => handleSelectCategory(category.id)}
                              className="w-4 h-4 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{category.id}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{category.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{category.description || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{category.order}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              category.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {category.status === 'active' ? '啟用' : '停用'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setEditingId(category.id);
                                  setEditingData({ ...category });
                                }}
                                variant="outline"
                                title="編輯"
                              >
                                <Edit2 size={16} />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDeleteClick(category.id, category.name)}
                                variant="destructive"
                                disabled={isDeletePending}
                                title="刪除"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!deleteTarget && !showForceConfirm}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 size={20} className="text-red-500" />
              確認刪除品類
            </DialogTitle>
            <DialogDescription>
              {deleteTarget?.type === 'single'
                ? `確定要刪除品類「${(deleteTarget as any).name}」嗎？此操作無法復原。`
                : `確定要刪除已選的 ${(deleteTarget as any)?.count} 個品類嗎？此操作無法復原。`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeletePending}
            >
              {isDeletePending ? '刪除中...' : '確認刪除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Force Delete Dialog (when category has products) */}
      <Dialog
        open={showForceConfirm}
        onOpenChange={(open) => { if (!open) { setShowForceConfirm(false); setDeleteTarget(null); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle size={20} />
              此品類下有商品
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                {deleteTarget?.type === 'single'
                  ? `品類「${(deleteTarget as any).name}」下仍有商品關聯。`
                  : `所選品類中有商品關聯。`}
              </p>
              <p className="font-medium text-gray-700">
                若繼續刪除，這些商品將變為「未分類」狀態。確定要強制刪除嗎？
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowForceConfirm(false); setDeleteTarget(null); }}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleForceDelete}
              disabled={isDeletePending}
            >
              {isDeletePending ? '刪除中...' : '強制刪除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
