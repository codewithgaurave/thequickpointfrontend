// src/pages/Categories.jsx
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaToggleOn,
  FaToggleOff,
  FaSearch,
  FaSync,
  FaCheckCircle,
  FaTimesCircle,
  FaImage,
  FaCalendar,
  FaSortAmountDown,
  FaSortAmountUp,
  FaTag,
  FaList,
  FaBox,
  FaFolder,
  FaCopy,
  FaClipboard
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import {
  createCategoryAPI,
  getAllCategoriesAPI,
  updateCategoryAPI,
  updateCategoryStatusAPI,
  deleteCategoryAPI,
} from "../apis/categoryApi";

const MySwal = withReactContent(Swal);

export default function Categories() {
  const { themeColors } = useTheme();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortByDate, setSortByDate] = useState("desc");
  const [actionLoading, setActionLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch all categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await getAllCategoriesAPI();
      setCategories(res?.data?.categories || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching categories:", err);
      toast.error("Failed to load categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter and sort categories
  const filteredCategories = (categories || [])
    .filter(category => {
      if (!category) return false;
      const query = search.toLowerCase();
      return (
        (category._id && category._id.toLowerCase().includes(query)) ||
        (category.title && category.title.toLowerCase().includes(query)) ||
        (category.isActive ? "active" : "inactive").includes(query)
      );
    })
    .sort((a, b) => {
      if (!a || !b) return 0;
      if (sortByDate === "desc") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    });

  // Helper to clear preview images in SweetAlert modals
  const clearSwalPreviews = () => {
    const p1 = document.getElementById('category-image-preview');
    if (p1) {
      p1.src = "";
      p1.classList.add('hidden');
    }
    const p2 = document.getElementById('edit-category-image-preview');
    if (p2) {
      p2.src = "";
      p2.classList.add('hidden');
    }
    // Clear file inputs
    const file1 = document.getElementById('swal-categoryImage');
    if (file1) file1.value = "";
    const file2 = document.getElementById('swal-edit-categoryImage');
    if (file2) file2.value = "";
  };

  // Show create category modal
  const showCreateModal = () => {
    clearSwalPreviews();

    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Create New Category</div>,
      html: (
        <div className="space-y-4 text-left">
          <div className="mb-4">
            <p className="text-sm opacity-70 mb-2" style={{ color: themeColors.text }}>
              Create a new category for organizing services or products
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
              Category Title *
            </label>
            <input
              id="swal-title"
              type="text"
              className="w-full p-2 rounded-lg border"
              placeholder="e.g., Electrician, Plumber, Milk, etc."
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
              Category Image *
            </label>
            <input
              id="swal-categoryImage"
              type="file"
              accept="image/*"
              className="w-full p-2 rounded-lg border"
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
              onChange={(e) => {
                if (e.target.files[0]) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const img = document.getElementById('category-image-preview');
                    if (img) {
                      img.src = event.target.result;
                      img.classList.remove('hidden');
                    }
                  };
                  reader.readAsDataURL(e.target.files[0]);
                }
              }}
            />
            <div className="mt-3">
              <img
                id="category-image-preview"
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg border hidden"
                style={{ borderColor: themeColors.border }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Status</label>
            <select
              id="swal-isActive"
              className="w-full p-2 rounded-lg border"
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
              defaultValue="true"
            >
              <option value="true">Active (Visible to users)</option>
              <option value="false">Inactive (Hidden from users)</option>
            </select>
          </div>

          <div className="text-xs opacity-70 p-3 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background + '50' }}>
            <p className="font-medium mb-1">Image Guidelines:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Recommended size: 400x400 pixels (square)</li>
              <li>Max file size: 5MB</li>
              <li>Formats: JPG, PNG, WebP</li>
              <li>Use clear, recognizable icons or images</li>
            </ul>
          </div>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: 'Create Category',
      cancelButtonText: 'Cancel',
      confirmButtonColor: themeColors.primary || '#3B82F6',
      cancelButtonColor: themeColors.border || '#6B7280',
      background: themeColors.background,
      width: '600px',
      preConfirm: async () => {
        const title = document.getElementById('swal-title').value.trim();
        const isActive = document.getElementById('swal-isActive').value === 'true';
        const categoryImage = document.getElementById('swal-categoryImage').files[0];

        // Validation
        if (!title) {
          Swal.showValidationMessage('Please enter category title');
          return false;
        }

        if (title.length < 2) {
          Swal.showValidationMessage('Category title should be at least 2 characters');
          return false;
        }

        if (!categoryImage) {
          Swal.showValidationMessage('Please select a category image');
          return false;
        }

        if (!categoryImage.type.startsWith('image/')) {
          Swal.showValidationMessage('Please select a valid image file');
          return false;
        }

        if (categoryImage.size > 5 * 1024 * 1024) {
          Swal.showValidationMessage('Image size should be less than 5MB');
          return false;
        }

        try {
          setActionLoading(true);
          const formData = new FormData();
          formData.append('title', title);
          formData.append('isActive', isActive);
          formData.append('categoryImage', categoryImage);

          const res = await createCategoryAPI(formData);
          return res.data;
        } catch (error) {
          Swal.showValidationMessage(`Creation failed: ${error.response?.data?.message || error.message}`);
          return false;
        } finally {
          setActionLoading(false);
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        await fetchCategories();
        clearSwalPreviews();
        toast.success('Category created successfully!');
      }
    });
  };

  // Show edit category modal
  const showEditModal = (category) => {
    if (!category) return;

    clearSwalPreviews();

    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Edit Category</div>,
      html: (
        <div className="space-y-4 text-left">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: themeColors.text }}>Current Image</label>
            {category?.imageUrl ? (
              <img
                src={category.imageUrl}
                alt={category.title}
                className="w-full h-48 object-cover rounded-lg border"
                style={{ borderColor: themeColors.border }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/400x400?text=No+Image";
                }}
              />
            ) : (
              <div className="w-full h-48 flex items-center justify-center rounded-lg border" style={{ borderColor: themeColors.border }}>
                <FaImage className="text-4xl opacity-30" style={{ color: themeColors.text }} />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
              Category Title *
            </label>
            <input
              id="swal-edit-title"
              type="text"
              className="w-full p-2 rounded-lg border"
              defaultValue={category?.title || ''}
              placeholder="e.g., Electrician, Plumber, Milk, etc."
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>New Image (Optional)</label>
            <input
              id="swal-edit-categoryImage"
              type="file"
              accept="image/*"
              className="w-full p-2 rounded-lg border"
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
              onChange={(e) => {
                if (e.target.files[0]) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const img = document.getElementById('edit-category-image-preview');
                    if (img) {
                      img.src = event.target.result;
                      img.classList.remove('hidden');
                    }
                  };
                  reader.readAsDataURL(e.target.files[0]);
                }
              }}
            />
            <div className="mt-2">
              <img
                id="edit-category-image-preview"
                alt="Preview"
                className="w-full h-32 object-cover rounded-lg border hidden"
                style={{ borderColor: themeColors.border }}
              />
            </div>
            <p className="text-xs opacity-70 mt-1">Leave empty to keep current image</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Status</label>
            <select
              id="swal-edit-isActive"
              className="w-full p-2 rounded-lg border"
              defaultValue={category?.isActive ? "true" : "false"}
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
            >
              <option value="true">Active (Visible to users)</option>
              <option value="false">Inactive (Hidden from users)</option>
            </select>
          </div>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: 'Update Category',
      cancelButtonText: 'Cancel',
      confirmButtonColor: themeColors.primary || '#3B82F6',
      cancelButtonColor: themeColors.border || '#6B7280',
      background: themeColors.background,
      width: '600px',
      preConfirm: async () => {
        const title = document.getElementById('swal-edit-title').value.trim();
        const isActive = document.getElementById('swal-edit-isActive').value === 'true';
        const categoryImage = document.getElementById('swal-edit-categoryImage').files[0];

        // Validation
        if (!title) {
          Swal.showValidationMessage('Please enter category title');
          return false;
        }

        if (title.length < 2) {
          Swal.showValidationMessage('Category title should be at least 2 characters');
          return false;
        }

        try {
          setActionLoading(true);
          const formData = new FormData();
          formData.append('title', title);
          formData.append('isActive', isActive);
          if (categoryImage) {
            formData.append('categoryImage', categoryImage);
            if (!categoryImage.type.startsWith('image/')) {
              Swal.showValidationMessage('Please select a valid image file');
              return false;
            }
            if (categoryImage.size > 5 * 1024 * 1024) {
              Swal.showValidationMessage('Image size should be less than 5MB');
              return false;
            }
          }

          const res = await updateCategoryAPI(category?._id, formData);
          return res.data;
        } catch (error) {
          Swal.showValidationMessage(`Update failed: ${error.response?.data?.message || error.message}`);
          return false;
        } finally {
          setActionLoading(false);
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        await fetchCategories();
        clearSwalPreviews();
        toast.success('Category updated successfully!');
      }
    });
  };

  // Toggle category status
  const toggleCategoryStatus = async (category) => {
    if (!category) return;

    const newStatus = !category.isActive;
    const action = newStatus ? 'activate' : 'deactivate';

    const result = await MySwal.fire({
      title: <div style={{ color: themeColors.text }}>
        {newStatus ? 'Activate Category' : 'Deactivate Category'}
      </div>,
      html: <div style={{ color: themeColors.text }}>
        Are you sure you want to {action} this category?
        <div className="my-3 p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={category?.imageUrl}
                alt={category.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/100?text=No+Image";
                }}
              />
            </div>
            <div>
              <p className="font-bold text-lg">{category?.title}</p>
              <p className="text-sm opacity-70">ID: {category?._id?.substring(0, 8)}...</p>
            </div>
          </div>
        </div>
        <p className="text-sm opacity-70">
          {newStatus 
            ? 'This category will become visible to users.' 
            : 'This category will be hidden from users.'}
        </p>
      </div>,
      icon: newStatus ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonText: `Yes, ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      cancelButtonText: 'Cancel',
      confirmButtonColor: newStatus ? '#10B981' : '#F59E0B',
      cancelButtonColor: themeColors.border,
      background: themeColors.background,
    });

    if (result.isConfirmed) {
      try {
        setActionLoading(true);
        await updateCategoryStatusAPI(category?._id, newStatus);
        await fetchCategories();
        toast.success(`Category ${action}d successfully`);
      } catch (err) {
        console.error("Error updating category status:", err);
        toast.error("Failed to update category status");
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Delete category
  const handleDelete = async (category) => {
    if (!category) return;

    const result = await MySwal.fire({
      title: <div style={{ color: themeColors.text }}>Delete Category</div>,
      html: <div style={{ color: themeColors.text }}>
        <div className="text-red-500 text-xl mb-3">
          <FaTrash className="inline mr-2" />
          Warning: This action cannot be undone!
        </div>
        <p>Are you sure you want to delete this category?</p>
        <div className="my-3 p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={category?.imageUrl}
                alt={category.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/100?text=No+Image";
                }}
              />
            </div>
            <div className="flex-1">
              <p className="font-bold text-xl">{category?.title}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                  category?.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {category?.isActive ? <FaCheckCircle /> : <FaTimesCircle />}
                  {category?.isActive ? 'Active' : 'Inactive'}
                </div>
                <div className="text-xs opacity-70">
                  Created: {category?.createdAt ? new Date(category.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm text-red-500 mt-2">
          ⚠️ Warning: Deleting this category may affect related services or products.
        </p>
      </div>,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete Permanently',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: themeColors.border,
      background: themeColors.background,
    });

    if (result.isConfirmed) {
      try {
        setActionLoading(true);
        await deleteCategoryAPI(category?._id);
        await fetchCategories();
        toast.success("Category deleted successfully");
      } catch (err) {
        console.error("Error deleting category:", err);
        toast.error("Failed to delete category");
      } finally {
        setActionLoading(false);
      }
    }
  };

  // View category details
  const viewCategoryDetails = (category) => {
    if (!category) return;

    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Category Details</div>,
      html: (
        <div className="text-left space-y-4" style={{ color: themeColors.text }}>
          <div className="mb-4">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 mb-3" style={{ borderColor: themeColors.primary }}>
                <img
                  src={category?.imageUrl}
                  alt={category.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/300?text=No+Image";
                  }}
                />
              </div>
              <h3 className="text-2xl font-bold">{category?.title}</h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-70">Status</p>
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                category?.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}>
                {category?.isActive ? <FaCheckCircle /> : <FaTimesCircle />}
                {category?.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div>
              <p className="text-sm opacity-70">Created</p>
              <p className="font-medium">
                {category?.createdAt ? new Date(category.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-70">Last Updated</p>
              <p className="font-medium">
                {category?.updatedAt ? new Date(category.updatedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-70">Category ID</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm truncate">{category?._id}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(category?._id).then(() => {
                      toast.success("Category ID copied!");
                    });
                  }}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                  title="Copy ID"
                >
                  <FaCopy className="text-xs" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm opacity-70">Image URL</p>
            <a
              href={category?.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline text-sm break-all"
            >
              {category?.imageUrl || 'No URL available'}
            </a>
          </div>
        </div>
      ),
      showConfirmButton: false,
      showCloseButton: true,
      width: '500px',
      background: themeColors.background,
    });
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied to clipboard!");
    }).catch(err => {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy text");
    });
  };

  // Stats
  const stats = {
    total: categories?.length || 0,
    active: (categories || []).filter(c => c?.isActive).length,
    inactive: (categories || []).filter(c => !c?.isActive).length,
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: themeColors.text }}>
            Categories
          </h2>
          <p className="text-sm opacity-75 mt-1" style={{ color: themeColors.text }}>
            Manage product/service categories with images
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" style={{ color: themeColors.text }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="pl-10 pr-4 py-2 rounded-xl border w-full md:w-64"
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text,
              }}
            />
          </div>

          <button
            onClick={() => setSortByDate(sortByDate === "desc" ? "asc" : "desc")}
            className="p-2 rounded-xl border flex items-center gap-2"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text,
            }}
            title={`Sort ${sortByDate === "desc" ? "Oldest First" : "Newest First"}`}
          >
            {sortByDate === "desc" ? <FaSortAmountDown /> : <FaSortAmountUp />}
          </button>

          <button
            onClick={fetchCategories}
            className="p-2 rounded-xl border flex items-center gap-2"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text,
            }}
            title="Refresh"
            disabled={loading}
          >
            <FaSync className={loading ? "animate-spin" : ""} />
          </button>

          <button
            onClick={showCreateModal}
            className="px-4 py-2 rounded-xl flex items-center gap-2 transition-all hover:scale-105"
            style={{
              backgroundColor: themeColors.primary,
              color: 'white'
            }}
            disabled={actionLoading}
          >
            <FaPlus />
            <span className="hidden md:inline">New Category</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Total Categories</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{stats.total}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}>
              <FaFolder size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Active Categories</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{stats.active}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#10B98120', color: '#10B981' }}>
              <FaList size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Inactive Categories</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{stats.inactive}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}>
              <FaBox size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: themeColors.primary }}></div>
          <p className="mt-2 opacity-70" style={{ color: themeColors.text }}>Loading categories...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <FaFolder className="text-6xl mx-auto mb-4 opacity-30" style={{ color: themeColors.text }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: themeColors.text }}>No Categories Found</h3>
          <p className="opacity-70 mb-6" style={{ color: themeColors.text }}>
            {search ? `No categories match "${search}"` : "Create your first category"}
          </p>
          <button
            onClick={showCreateModal}
            className="px-6 py-3 rounded-xl inline-flex items-center gap-2"
            style={{ backgroundColor: themeColors.primary, color: 'white' }}
            disabled={actionLoading}
          >
            <FaPlus />
            Create First Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCategories.map((category, index) => (
            <div
              key={category?._id || `category-${index}`}
              className="rounded-2xl border overflow-hidden group hover:shadow-lg transition-all"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                opacity: category?.isActive ? 1 : 0.8
              }}
            >
              {/* Image */}
              <div
                className="relative h-48 overflow-hidden cursor-pointer bg-gray-50"
                onClick={() => viewCategoryDetails(category)}
              >
                <img
                  src={category?.imageUrl}
                  alt={category?.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/400x400?text=No+Image";
                  }}
                />
                <div className="absolute top-2 right-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    category?.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {category?.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-white font-bold text-lg truncate">{category?.title}</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Created</p>
                    <p className="text-xs" style={{ color: themeColors.text }}>
                      {category?.createdAt ? new Date(category.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      }) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm opacity-70" style={{ color: themeColors.text }}>ID</p>
                    <p className="text-xs font-mono truncate" style={{ color: themeColors.text }}>
                      {category?._id ? category._id.substring(0, 8) + '...' : 'No ID'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: themeColors.border }}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => viewCategoryDetails(category)}
                      className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                      style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => copyToClipboard(category?._id)}
                      className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                      style={{ backgroundColor: '#8B5CF620', color: '#8B5CF6' }}
                      title="Copy ID"
                    >
                      <FaClipboard />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => showEditModal(category)}
                      className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                      style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}
                      title="Edit Category"
                      disabled={actionLoading}
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => toggleCategoryStatus(category)}
                      disabled={actionLoading}
                      className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                      style={{
                        backgroundColor: category?.isActive ? '#F59E0B20' : '#10B98120',
                        color: category?.isActive ? '#F59E0B' : '#10B981'
                      }}
                      title={category?.isActive ? "Deactivate" : "Activate"}
                    >
                      {category?.isActive ? <FaToggleOff /> : <FaToggleOn />}
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      disabled={actionLoading}
                      className="p-2 rounded-lg hover:bg-opacity-20 transition-colors text-red-500"
                      style={{ backgroundColor: '#EF444420' }}
                      title="Delete Category"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Info */}
      <div className="text-center text-sm opacity-70" style={{ color: themeColors.text }}>
        <p>
          Showing {filteredCategories.length} of {categories.length} categories •
          Sorted by: {sortByDate === "desc" ? "Newest First" : "Oldest First"} •
          Last updated: {lastUpdated ? lastUpdated.toLocaleString() : '—'}
        </p>
      </div>
    </div>
  );
}