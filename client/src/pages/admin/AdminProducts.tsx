import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Edit2, Trash2, Plus, Save, X, Upload } from "lucide-react";
import ProductEditDialog from "@/components/ProductEditDialog";
import type { Product } from "@/lib/data";

export default function AdminProducts() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Product> | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Queries
  const {
    data: products = [],
    isLoading,
    refetch,
  } = trpc.products.list.useQuery({ limit: 100 });
  const { data: categories = [] } = trpc.categories.list.useQuery();

  // Mutations
  const updateMutation = trpc.products.update.useMutation({
    onSuccess: () => {
      toast.success("Product updated successfully");
      setEditingId(null);
      setEditingData(null);
      refetch();
    },
    onError: error => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("Product created successfully");
      setEditingId(null);
      setEditingData(null);
      refetch();
    },
    onError: error => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const uploadImageMutation = trpc.products.uploadImage.useMutation();

  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      toast.success("Product deleted successfully");
      refetch();
    },
    onError: error => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const batchDeleteMutation = trpc.products.batchDelete.useMutation({
    onSuccess: () => {
      toast.success("Products deleted successfully");
      setSelectedIds(new Set());
      refetch();
    },
    onError: error => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setShowEditDialog(true);
  };

  const handleSave = async () => {
    if (!editingData || !editingId) return;

    setIsSaving(true);
    try {
      console.log("[AdminProducts] Saving product:", editingData);

      if (editingId === "new") {
        // Create new product
        await createMutation.mutateAsync({
          name: editingData.name || "",
          price: editingData.price || 0,
          stock: editingData.stock || 0,
          categoryId: editingData.categoryId || 0,
          image: editingData.image ?? undefined,
          description: editingData.description ?? undefined,
        });
      } else {
        // Update existing product
        await updateMutation.mutateAsync({
          id: parseInt(editingId),
          name: editingData.name || "",
          price: editingData.price || 0,
          stock: editingData.stock || 0,
          categoryId: editingData.categoryId || 0,
          image: editingData.image ?? undefined,
          description: editingData.description ?? undefined,
          status: (editingData.status || "active") as
            | "active"
            | "inactive"
            | "deleted",
        });
      }
    } catch (error) {
      console.error("[AdminProducts] Error saving product:", error);
      toast.error("Failed to save product");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData(null);
    setShowEditDialog(false);
    setSelectedProduct(null);
  };

  const handleEditDialogSave = async (product: Product) => {
    try {
      await updateMutation.mutateAsync({
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        categoryId: product.categoryId || 0,
        image: product.image ?? undefined,
        description: product.description ?? undefined,
        status: (product.status || "active") as
          | "active"
          | "inactive"
          | "deleted",
      });
      setShowEditDialog(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error saving product:", error);
      throw error;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async event => {
        try {
          const base64 = (event.target?.result as string).split(",")[1];
          const result = await uploadImageMutation.mutateAsync({
            base64,
            fileName: file.name,
            mimeType: file.type,
          });
          setEditingData({ ...editingData, image: result.url });
          toast.success("Image uploaded successfully");
        } catch (error) {
          console.error("[AdminProducts] Error uploading image:", error);
          toast.error("Failed to upload image");
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("[AdminProducts] Error reading file:", error);
      toast.error("Failed to read file");
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteMutation.mutateAsync(parseInt(id));
      } catch (error) {
        console.error("[AdminProducts] Error deleting product:", error);
      }
    }
  };

  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one product");
      return;
    }

    if (
      confirm(`Are you sure you want to delete ${selectedIds.size} product(s)?`)
    ) {
      setIsDeleting(true);
      try {
        await batchDeleteMutation.mutateAsync({
          ids: Array.from(selectedIds),
        });
      } catch (error) {
        console.error("[AdminProducts] Error batch deleting:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleAddNew = () => {
    setEditingId("new");
    setEditingData({
      name: "",
      price: 0,
      stock: 0,
      categoryId: 0,
      image: null,
      description: null,
      status: "active",
    });
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      String(product.categoryId) === selectedCategory;
    const matchesStatus =
      selectedStatus === "all" || String(product.status) === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">商品管理</h1>
            <div className="flex gap-2">
              {selectedIds.size > 0 && (
                <button
                  onClick={handleBatchDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  刪除 ({selectedIds.size})
                </button>
              )}
              <button
                onClick={handleAddNew}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2"
              >
                <Plus size={18} />
                添加商品
              </button>
              <ProductEditDialog
                isOpen={showEditDialog}
                product={selectedProduct}
                onClose={handleCancel}
                onSave={handleEditDialogSave}
              />
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            <Input
              placeholder="搜索商品..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有分類</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有狀態</SelectItem>
                <SelectItem value="active">活躍</SelectItem>
                <SelectItem value="inactive">非活躍</SelectItem>
                <SelectItem value="deleted">已刪除</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.size === filteredProducts.length &&
                      filteredProducts.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  商品
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  分類
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  價格
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  庫存
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  圖片
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  狀態
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {editingId === "new" && editingData && (
                <tr className="border-b bg-yellow-50">
                  <td className="px-6 py-4">{/* Checkbox for new row */}</td>
                  <td className="px-6 py-4">
                    <Input
                      value={editingData.name || ""}
                      onChange={e =>
                        setEditingData({ ...editingData, name: e.target.value })
                      }
                      placeholder="Product name"
                      className="w-full"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Select
                      value={String(editingData.categoryId || "")}
                      onValueChange={value =>
                        setEditingData({
                          ...editingData,
                          categoryId: parseInt(value) || 0,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4">
                    <Input
                      type="number"
                      value={editingData.price || 0}
                      onChange={e =>
                        setEditingData({
                          ...editingData,
                          price: parseFloat(e.target.value),
                        })
                      }
                      placeholder="0.00"
                      step="0.01"
                      className="w-full"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Input
                      type="number"
                      value={editingData.stock || 0}
                      onChange={e =>
                        setEditingData({
                          ...editingData,
                          stock: parseInt(e.target.value),
                        })
                      }
                      placeholder="0"
                      className="w-full"
                    />
                  </td>
                  <td className="px-6 py-4 col-span-2">
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                          className="flex-1"
                        />
                        {isUploading && (
                          <span className="text-sm text-gray-500">
                            Uploading...
                          </span>
                        )}
                      </div>
                      {editingData.image && (
                        <div className="w-16 h-16 rounded border border-gray-200 overflow-hidden">
                          <img
                            src={editingData.image}
                            alt="preview"
                            className="w-full h-full object-cover"
                            onError={e =>
                              (e.currentTarget.src =
                                "https://via.placeholder.com/64")
                            }
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Select
                      value={String(editingData.status || "active")}
                      onValueChange={value =>
                        setEditingData({ ...editingData, status: value as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="deleted">Deleted</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                        title="Save"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {filteredProducts.map(product =>
                editingId === String(product.id) && editingData ? (
                  <tr
                    key={String(product.id)}
                    className="border-b bg-yellow-50"
                  >
                    <td className="px-6 py-4">
                      {/* Checkbox for editing row */}
                    </td>
                    <td className="px-6 py-4">
                      <Input
                        value={editingData.name || ""}
                        onChange={e =>
                          setEditingData({
                            ...editingData,
                            name: e.target.value,
                          })
                        }
                        placeholder="Product name"
                        className="w-full"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Select
                        value={String(editingData.categoryId || 0)}
                        onValueChange={value =>
                          setEditingData({
                            ...editingData,
                            categoryId: parseInt(value) || 0,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={String(cat.id)}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4">
                      <Input
                        type="number"
                        value={editingData.price || 0}
                        onChange={e =>
                          setEditingData({
                            ...editingData,
                            price: parseFloat(e.target.value),
                          })
                        }
                        placeholder="0.00"
                        step="0.01"
                        className="w-full"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Input
                        type="number"
                        value={editingData.stock || 0}
                        onChange={e =>
                          setEditingData({
                            ...editingData,
                            stock: parseInt(e.target.value),
                          })
                        }
                        placeholder="0"
                        className="w-full"
                      />
                    </td>
                    <td className="px-6 py-4 col-span-2">
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={isUploading}
                            className="flex-1"
                          />
                          {isUploading && (
                            <span className="text-sm text-gray-500">
                              Uploading...
                            </span>
                          )}
                        </div>
                        {editingData.image && (
                          <div className="w-16 h-16 rounded border border-gray-200 overflow-hidden">
                            <img
                              src={editingData.image}
                              alt="preview"
                              className="w-full h-full object-cover"
                              onError={e =>
                                (e.currentTarget.src =
                                  "https://via.placeholder.com/64")
                              }
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Select
                        value={String(editingData.status || "active")}
                        onValueChange={value =>
                          setEditingData({
                            ...editingData,
                            status: value as any,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="deleted">Deleted</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={isSaving}
                          className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={String(product.id)}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleSelection(product.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm">{product.name}</td>
                    <td className="px-6 py-4 text-sm">
                      {String(product.categoryId) || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600 font-semibold">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm">{product.stock}</td>
                    <td className="px-6 py-4">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 rounded object-cover"
                          onError={e =>
                            (e.currentTarget.src =
                              "https://via.placeholder.com/48")
                          }
                        />
                      ) : (
                        <span className="text-xs text-gray-400">No image</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          product.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(String(product.id))}
                          className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
