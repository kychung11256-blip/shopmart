import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { AdminLayout } from './Dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Edit2, Trash2, Plus, Save, X } from 'lucide-react';

export default function AdminCategories() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newOrder, setNewOrder] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Queries
  const { data: categories = [], isLoading, refetch } = trpc.categories.listAll.useQuery();

  // Mutations
  const createMutation = trpc.categories.create.useMutation({
    onSuccess: () => {
      toast.success('Category created successfully');
      setNewName('');
      setNewDescription('');
      setNewOrder(0);
      refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const updateMutation = trpc.categories.update.useMutation({
    onSuccess: () => {
      toast.success('Category updated successfully');
      setEditingId(null);
      setEditingData(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteMutation = trpc.categories.delete.useMutation({
    onSuccess: () => {
      toast.success('Category deleted successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const batchDeleteMutation = trpc.categories.batchDelete.useMutation({
    onSuccess: () => {
      toast.success('Categories deleted successfully');
      setSelectedIds(new Set());
      refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleSave = async () => {
    if (!editingData?.name) {
      toast.error('Category name is required');
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

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('[AdminCategories] Error deleting category:', error);
      }
    }
  };

  const handleAddNew = async () => {
    if (!newName.trim()) {
      toast.error('Category name is required');
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

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select categories to delete');
      return;
    }

    if (confirm(`Are you sure you want to delete ${selectedIds.size} categories? This action cannot be undone.`)) {
      setIsDeleting(true);
      try {
        await batchDeleteMutation.mutateAsync(Array.from(selectedIds));
      } catch (error) {
        console.error('[AdminCategories] Error batch deleting categories:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Category Management</h1>
          {selectedIds.size > 0 && (
            <Button
              onClick={handleBatchDelete}
              disabled={isDeleting || batchDeleteMutation.isPending}
              variant="destructive"
            >
              <Trash2 size={16} className="mr-2" />
              Delete {selectedIds.size} Selected
            </Button>
          )}
        </div>

        {/* Add New Category Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Add New Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              type="text"
              placeholder="Category Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Input
              type="text"
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Order"
              value={newOrder}
              onChange={(e) => setNewOrder(parseInt(e.target.value) || 0)}
            />
            <Button
              onClick={handleAddNew}
              disabled={createMutation.isPending}
              className="w-full"
            >
              <Plus size={16} className="mr-2" />
              Add Category
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
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Order</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No categories found
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id} className={`border-b hover:bg-gray-50 ${selectedIds.has(category.id) ? 'bg-blue-50' : ''}`}>
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
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              editingData.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {editingData.status}
                            </span>
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
                          <td className="px-6 py-4 text-sm text-gray-900">{category.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{category.description || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{category.order}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              category.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {category.status}
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
                              >
                                <Edit2 size={16} />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDelete(category.id)}
                                variant="destructive"
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
    </AdminLayout>
  );
}
