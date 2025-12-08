// src/pages/Products.jsx
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
  FaBox,
  FaShoppingCart,
  FaRupeeSign,
  FaPercentage,
  FaCopy,
  FaClipboard,
  FaFilter,
  FaWarehouse,
  FaWeight
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import {
  createProductAPI,
  getAllProductsAPI,
  updateProductAPI,
  updateProductStatusAPI,
  deleteProductAPI,
} from "../apis/productApi";
import { getAllCategoriesAPI } from "../apis/categoryApi";

const MySwal = withReactContent(Swal);

export default function Products() {
  const { themeColors } = useTheme();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortByDate, setSortByDate] = useState("desc");
  const [actionLoading, setActionLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [imagePreviews, setImagePreviews] = useState([]); // kept for internal tracking if needed

  // Fetch all products and categories
  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        getAllProductsAPI(),
        getAllCategoriesAPI()
      ]);
      setProducts(productsRes?.data?.products || []);
      setCategories(categoriesRes?.data?.categories || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load data");
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter and sort products
  const filteredProducts = (products || [])
    .filter(product => {
      if (!product) return false;

      // Category filter
      if (selectedCategory !== "all" && product.category?._id !== selectedCategory) {
        return false;
      }

      // Search filter
      const query = search.toLowerCase();
      return (
        (product._id && product._id.toLowerCase().includes(query)) ||
        (product.name && product.name.toLowerCase().includes(query)) ||
        (product.description && product.description.toLowerCase().includes(query)) ||
        (product.category?.title && product.category.title.toLowerCase().includes(query)) ||
        (product.isActive ? "active" : "inactive").includes(query)
      );
    })
    .sort((a, b) => {
      if (!a || !b) return 0;
      if (sortByDate === "desc") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    });

  // handleImagePreview writes preview immediately into modal DOM and also updates state
  // mode: 'create' or 'edit' (used to pick correct preview element ids)
  const handleImagePreview = (event, index, mode = 'create') => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size/type quickly
    if (!file.type.startsWith('image/')) {
      toast.error("Please select a valid image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Each image must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      // Update React state (kept for potential use)
      setImagePreviews(prev => {
        const next = [...(prev || [])];
        while (next.length < 3) next.push(null);
        next[index] = e.target.result;
        return next;
      });

      // Also update modal DOM if present
      const imgId = `${mode}-preview-${index}`;
      const imgEl = document.getElementById(imgId);
      if (imgEl) {
        imgEl.src = e.target.result;
        imgEl.classList.remove('hidden');
      }
    };
    reader.readAsDataURL(file);
  };

  // Clear image previews and file inputs (both create & edit IDs)
  const clearImagePreviews = () => {
    setImagePreviews([]);
    // Clear file inputs for create modal
    for (let i = 0; i < 3; i++) {
      const fileInput = document.getElementById(`productImage-${i}`);
      if (fileInput) fileInput.value = "";
      const createImg = document.getElementById(`create-preview-${i}`);
      if (createImg) {
        createImg.src = "https://via.placeholder.com/300x200?text=Preview";
        // don't remove hidden: we show placeholder
        createImg.classList.remove('hidden');
      }
      const editImg = document.getElementById(`edit-preview-${i}`);
      if (editImg) {
        editImg.src = "https://via.placeholder.com/300x200?text=New+Preview";
        editImg.classList.remove('hidden');
      }
      const editInput = document.getElementById(`editProductImage-${i}`);
      if (editInput) editInput.value = "";
    }
  };

  // Calculate percentage off
  const calculatePercentageOff = (price, offerPrice) => {
    if (!price || !offerPrice || price <= 0) return 0;
    return Math.round(((price - offerPrice) / price) * 100);
  };

  // --- UNIT OPTIONS (enum) ---
  const UNIT_OPTIONS = [
    "piece",
    "pcs",
    "kg",
    "g",
    "mg",
    "litre",
    "ml",
    "dozen",
    "packet",
    "box",
    "meter",
    "cm",
    "set",
    "pair",
    "bottle",
    "bag",
    "roll",
    "unit",
  ];

  // Show create product modal
  const showCreateModal = () => {
    // initialize placeholders in state
    setImagePreviews([null, null, null]);

    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Create New Product</div>,
      html: (
        <div className="space-y-4 text-left max-h-[70vh] overflow-y-auto pr-2">
          <div className="mb-4">
            <p className="text-sm opacity-70 mb-2" style={{ color: themeColors.text }}>
              Create a new product for your store
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Product Name *
              </label>
              <input
                id="swal-name"
                type="text"
                className="w-full p-2 rounded-lg border"
                placeholder="e.g., Premium Milk, Electric Repair Kit"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Category *
              </label>
              <select
                id="swal-categoryId"
                className="w-full p-2 rounded-lg border"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
                defaultValue=""
              >
                <option value="">Select Category</option>
                {categories
                  .filter(cat => cat.isActive)
                  .map(category => (
                    <option key={category._id} value={category._id}>
                      {category.title}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Price (₹) *
              </label>
              <input
                id="swal-price"
                type="number"
                min="0"
                step="0.01"
                className="w-full p-2 rounded-lg border"
                placeholder="1000"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Offer Price (₹)
              </label>
              <input
                id="swal-offerPrice"
                type="number"
                min="0"
                step="0.01"
                className="w-full p-2 rounded-lg border"
                placeholder="800"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Stock Quantity *
              </label>
              <input
                id="swal-stockQuantity"
                type="number"
                min="0"
                className="w-full p-2 rounded-lg border"
                placeholder="50"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Unit *
              </label>
              <select
                id="swal-unit"
                className="w-full p-2 rounded-lg border"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
                defaultValue="piece"
              >
                {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Status
              </label>
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
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
              Description *
            </label>
            <textarea
              id="swal-description"
              rows="3"
              className="w-full p-2 rounded-lg border"
              placeholder="Product description..."
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
              Product Images (Max 3) *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0, 1, 2].map((index) => (
                <div key={index}>
                  <input
                    id={`productImage-${index}`}
                    type="file"
                    accept="image/*"
                    className="w-full p-2 rounded-lg border text-sm"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background,
                      color: themeColors.text
                    }}
                    onChange={(e) => handleImagePreview(e, index, 'create')}
                  />
                  <div className="mt-2">
                    <img
                      id={`create-preview-${index}`}
                      src={"https://via.placeholder.com/300x200?text=Preview"}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                      style={{ borderColor: themeColors.border }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs opacity-70 mt-2">First image will be used as thumbnail</p>
          </div>

          <div className="text-xs opacity-70 p-3 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background + '50' }}>
            <p className="font-medium mb-1">Guidelines:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>All fields marked with * are required</li>
              <li>Images: Max 3 images, 5MB each, JPG/PNG/WebP</li>
              <li>Offer price should be less than regular price</li>
              <li>Stock quantity cannot be negative</li>
            </ul>
          </div>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: 'Create Product',
      cancelButtonText: 'Cancel',
      confirmButtonColor: themeColors.primary || '#3B82F6',
      cancelButtonColor: themeColors.border || '#6B7280',
      background: themeColors.background,
      width: '800px',
      didOpen: () => {
        // ensure placeholders are visible inside modal
        for (let i = 0; i < 3; i++) {
          const imgEl = document.getElementById(`create-preview-${i}`);
          if (imgEl && (!imagePreviews[i])) {
            imgEl.src = "https://via.placeholder.com/300x200?text=Preview";
            imgEl.classList.remove('hidden');
          } else if (imgEl && imagePreviews[i]) {
            imgEl.src = imagePreviews[i];
            imgEl.classList.remove('hidden');
          }
        }
      },
      preConfirm: async () => {
        const name = document.getElementById('swal-name').value.trim();
        const categoryId = document.getElementById('swal-categoryId').value;
        const price = document.getElementById('swal-price').value;
        const offerPrice = document.getElementById('swal-offerPrice').value || price;
        const stockQuantity = document.getElementById('swal-stockQuantity').value;
        const unit = document.getElementById('swal-unit').value;
        const description = document.getElementById('swal-description').value.trim();
        const isActive = document.getElementById('swal-isActive').value === 'true';

        // Get image files (max 3)
        const productImages = [];
        for (let i = 0; i < 3; i++) {
          const fileInput = document.getElementById(`productImage-${i}`);
          if (fileInput && fileInput.files[0]) {
            productImages.push(fileInput.files[0]);
          }
        }

        // Validation
        if (!name) {
          Swal.showValidationMessage('Please enter product name');
          return false;
        }

        if (!categoryId) {
          Swal.showValidationMessage('Please select a category');
          return false;
        }

        if (!price || parseFloat(price) <= 0) {
          Swal.showValidationMessage('Please enter valid price');
          return false;
        }

        if (offerPrice && parseFloat(offerPrice) > parseFloat(price)) {
          Swal.showValidationMessage('Offer price cannot be greater than regular price');
          return false;
        }

        if (!stockQuantity || parseInt(stockQuantity) < 0) {
          Swal.showValidationMessage('Please enter valid stock quantity');
          return false;
        }

        if (!unit) {
          Swal.showValidationMessage('Please select unit');
          return false;
        }

        if (!description) {
          Swal.showValidationMessage('Please enter description');
          return false;
        }

        if (productImages.length === 0) {
          Swal.showValidationMessage('Please upload at least one image');
          return false;
        }

        // Validate images
        for (const image of productImages) {
          if (!image.type.startsWith('image/')) {
            Swal.showValidationMessage('Please select valid image files');
            return false;
          }
          if (image.size > 5 * 1024 * 1024) {
            Swal.showValidationMessage('Each image should be less than 5MB');
            return false;
          }
        }

        try {
          setActionLoading(true);
          const formData = new FormData();
          formData.append('name', name);
          formData.append('categoryId', categoryId);
          formData.append('price', price);
          formData.append('offerPrice', offerPrice);
          formData.append('stockQuantity', stockQuantity);
          formData.append('unit', unit);
          formData.append('description', description);
          formData.append('isActive', isActive);

          productImages.forEach((image) => {
            formData.append('productImages', image);
          });

          const res = await createProductAPI(formData);
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
        await fetchData();
        clearImagePreviews();
        toast.success('Product created successfully!');
      } else {
        // if cancelled, clear previews to avoid leaking between modals
        clearImagePreviews();
      }
    });
  };

  // Show edit product modal
  const showEditModal = (product) => {
    if (!product) return;

    // Preload previews with existing images (up to 3)
    const preloaded = (product.images || []).slice(0, 3);
    while (preloaded.length < 3) preloaded.push(null);
    setImagePreviews(preloaded);

    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Edit Product</div>,
      html: (
        <div className="space-y-4 text-left max-h-[70vh] overflow-y-auto pr-2">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: themeColors.text }}>Current Images</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(product.images || []).slice(0, 3).map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Product ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border"
                  style={{ borderColor: themeColors.border }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/300x200?text=No+Image";
                  }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Product Name *
              </label>
              <input
                id="swal-edit-name"
                type="text"
                className="w-full p-2 rounded-lg border"
                defaultValue={product?.name || ''}
                placeholder="e.g., Premium Milk, Electric Repair Kit"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Category *
              </label>
              <select
                id="swal-edit-categoryId"
                className="w-full p-2 rounded-lg border"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
                defaultValue={product?.category?._id || ''}
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Price (₹) *
              </label>
              <input
                id="swal-edit-price"
                type="number"
                min="0"
                step="0.01"
                className="w-full p-2 rounded-lg border"
                defaultValue={product?.price || ''}
                placeholder="1000"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Offer Price (₹)
              </label>
              <input
                id="swal-edit-offerPrice"
                type="number"
                min="0"
                step="0.01"
                className="w-full p-2 rounded-lg border"
                defaultValue={product?.offerPrice || ''}
                placeholder="800"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Stock Quantity *
              </label>
              <input
                id="swal-edit-stockQuantity"
                type="number"
                min="0"
                className="w-full p-2 rounded-lg border"
                defaultValue={product?.stockQuantity || ''}
                placeholder="50"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Unit *
              </label>
              <select
                id="swal-edit-unit"
                className="w-full p-2 rounded-lg border"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
                defaultValue={product?.unit || 'piece'}
              >
                {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Status
              </label>
              <select
                id="swal-edit-isActive"
                className="w-full p-2 rounded-lg border"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
                defaultValue={product?.isActive ? "true" : "false"}
              >
                <option value="true">Active (Visible to users)</option>
                <option value="false">Inactive (Hidden from users)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
              Description *
            </label>
            <textarea
              id="swal-edit-description"
              rows="3"
              className="w-full p-2 rounded-lg border"
              defaultValue={product?.description || ''}
              placeholder="Product description..."
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
              New Images (Optional, Max 3)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0, 1, 2].map((index) => (
                <div key={index}>
                  <input
                    id={`editProductImage-${index}`}
                    type="file"
                    accept="image/*"
                    className="w-full p-2 rounded-lg border text-sm"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background,
                      color: themeColors.text
                    }}
                    onChange={(e) => handleImagePreview(e, index, 'edit')}
                  />
                  <div className="mt-2">
                    <img
                      id={`edit-preview-${index}`}
                      src={(product.images && product.images[index]) || "https://via.placeholder.com/300x200?text=New+Preview"}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                      style={{ borderColor: themeColors.border }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs opacity-70 mt-2">Leave empty to keep current images</p>
          </div>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: 'Update Product',
      cancelButtonText: 'Cancel',
      confirmButtonColor: themeColors.primary || '#3B82F6',
      cancelButtonColor: themeColors.border || '#6B7280',
      background: themeColors.background,
      width: '800px',
      didOpen: () => {
        // populate edit previews with current images if any (preloaded above in state)
        for (let i = 0; i < 3; i++) {
          const imgEl = document.getElementById(`edit-preview-${i}`);
          if (imgEl) {
            const src = (product.images && product.images[i]) || "https://via.placeholder.com/300x200?text=New+Preview";
            imgEl.src = src;
            imgEl.classList.remove('hidden');
          }
        }
      },
      preConfirm: async () => {
        const name = document.getElementById('swal-edit-name').value.trim();
        const categoryId = document.getElementById('swal-edit-categoryId').value;
        const price = document.getElementById('swal-edit-price').value;
        const offerPrice = document.getElementById('swal-edit-offerPrice').value || price;
        const stockQuantity = document.getElementById('swal-edit-stockQuantity').value;
        const unit = document.getElementById('swal-edit-unit').value;
        const description = document.getElementById('swal-edit-description').value.trim();
        const isActive = document.getElementById('swal-edit-isActive').value === 'true';

        // Get new image files (max 3)
        const productImages = [];
        for (let i = 0; i < 3; i++) {
          const fileInput = document.getElementById(`editProductImage-${i}`);
          if (fileInput && fileInput.files[0]) {
            productImages.push(fileInput.files[0]);
          }
        }

        // Validation
        if (!name) {
          Swal.showValidationMessage('Please enter product name');
          return false;
        }

        if (!categoryId) {
          Swal.showValidationMessage('Please select a category');
          return false;
        }

        if (!price || parseFloat(price) <= 0) {
          Swal.showValidationMessage('Please enter valid price');
          return false;
        }

        if (offerPrice && parseFloat(offerPrice) > parseFloat(price)) {
          Swal.showValidationMessage('Offer price cannot be greater than regular price');
          return false;
        }

        if (!stockQuantity || parseInt(stockQuantity) < 0) {
          Swal.showValidationMessage('Please enter valid stock quantity');
          return false;
        }

        if (!unit) {
          Swal.showValidationMessage('Please select unit');
          return false;
        }

        if (!description) {
          Swal.showValidationMessage('Please enter description');
          return false;
        }

        try {
          setActionLoading(true);
          const formData = new FormData();
          formData.append('name', name);
          formData.append('categoryId', categoryId);
          formData.append('price', price);
          formData.append('offerPrice', offerPrice);
          formData.append('stockQuantity', stockQuantity);
          formData.append('unit', unit);
          formData.append('description', description);
          formData.append('isActive', isActive);

          productImages.forEach((image) => {
            formData.append('productImages', image);
          });

          const res = await updateProductAPI(product?._id, formData);
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
        await fetchData();
        clearImagePreviews();
        toast.success('Product updated successfully!');
      } else {
        // cancelled
        clearImagePreviews();
      }
    });
  };

  // Toggle product status
  const toggleProductStatus = async (product) => {
    if (!product) return;

    const newStatus = !product.isActive;
    const action = newStatus ? 'activate' : 'deactivate';

    const result = await MySwal.fire({
      title: <div style={{ color: themeColors.text }}>
        {newStatus ? 'Activate Product' : 'Deactivate Product'}
      </div>,
      html: <div style={{ color: themeColors.text }}>
        Are you sure you want to {action} this product?
        <div className="my-3 p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={product?.images?.[0]}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/100?text=No+Image";
                }}
              />
            </div>
            <div>
              <p className="font-bold text-lg">{product?.name}</p>
              <p className="text-sm opacity-70">₹{product?.price} • Stock: {product?.stockQuantity} {product?.unit}</p>
              <p className="text-xs opacity-70">ID: {product?._id?.substring(0, 8)}...</p>
            </div>
          </div>
        </div>
        <p className="text-sm opacity-70">
          {newStatus
            ? 'This product will become visible to users.'
            : 'This product will be hidden from users.'}
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
        await updateProductStatusAPI(product?._id, newStatus);
        await fetchData();
        toast.success(`Product ${action}d successfully`);
      } catch (err) {
        console.error("Error updating product status:", err);
        toast.error("Failed to update product status");
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Delete product
  const handleDelete = async (product) => {
    if (!product) return;

    const result = await MySwal.fire({
      title: <div style={{ color: themeColors.text }}>Delete Product</div>,
      html: <div style={{ color: themeColors.text }}>
        <div className="text-red-500 text-xl mb-3">
          <FaTrash className="inline mr-2" />
          Warning: This action cannot be undone!
        </div>
        <p>Are you sure you want to delete this product?</p>
        <div className="my-3 p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={product?.images?.[0]}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/100?text=No+Image";
                }}
              />
            </div>
            <div className="flex-1">
              <p className="font-bold text-xl">{product?.name}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                  product?.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {product?.isActive ? <FaCheckCircle /> : <FaTimesCircle />}
                  {product?.isActive ? 'Active' : 'Inactive'}
                </div>
                <div className="text-xs opacity-70">
                  Price: ₹{product?.price} • Stock: {product?.stockQuantity}
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm text-red-500 mt-2">
          ⚠️ Warning: Deleting this product will remove it permanently.
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
        await deleteProductAPI(product?._id);
        await fetchData();
        toast.success("Product deleted successfully");
      } catch (err) {
        console.error("Error deleting product:", err);
        toast.error("Failed to delete product");
      } finally {
        setActionLoading(false);
      }
    }
  };

  // View product details
  const viewProductDetails = (product) => {
    if (!product) return;

    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Product Details</div>,
      html: (
        <div className="text-left space-y-4" style={{ color: themeColors.text }}>
          <div className="mb-4">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 mb-3" style={{ borderColor: themeColors.primary }}>
                <img
                  src={product?.images?.[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/300?text=No+Image";
                  }}
                />
              </div>
              <h3 className="text-2xl font-bold">{product?.name}</h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-70">Status</p>
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                product?.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}>
                {product?.isActive ? <FaCheckCircle /> : <FaTimesCircle />}
                {product?.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div>
              <p className="text-sm opacity-70">Created</p>
              <p className="font-medium">
                {product?.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-70">Last Updated</p>
              <p className="font-medium">
                {product?.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-70">Category</p>
              <p className="font-medium">
                {product?.category?.title || 'No Category'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm opacity-70">Price</p>
              <p className="font-bold text-lg">₹{product?.price}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">Offer Price</p>
              <p className="font-bold text-lg text-green-600">₹{product?.offerPrice || product?.price}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">Discount</p>
              <p className="font-bold text-lg text-red-500">
                {calculatePercentageOff(product?.price, product?.offerPrice)}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-70">Stock Quantity</p>
              <p className="font-medium text-lg">{product?.stockQuantity} {product?.unit}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">Product ID</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm truncate">{product?._id}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(product?._id).then(() => {
                      toast.success("Product ID copied!");
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
            <p className="text-sm opacity-70">Description</p>
            <p className="p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
              {product?.description || 'No description'}
            </p>
          </div>

          <div>
            <p className="text-sm opacity-70">Images</p>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {product?.images?.map((img, index) => (
                <a
                  key={index}
                  href={img}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={img}
                    alt={`Product ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg border hover:opacity-80"
                    style={{ borderColor: themeColors.border }}
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      ),
      showConfirmButton: false,
      showCloseButton: true,
      width: '600px',
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
    total: products?.length || 0,
    active: (products || []).filter(p => p?.isActive).length,
    inactive: (products || []).filter(p => !p?.isActive).length,
    outOfStock: (products || []).filter(p => (p?.stockQuantity || 0) <= 0).length,
  };

  // Total inventory value
  const totalInventoryValue = products.reduce((total, product) => {
    return total + (product?.price || 0) * (product?.stockQuantity || 0);
  }, 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: themeColors.text }}>
            Products
          </h2>
          <p className="text-sm opacity-75 mt-1" style={{ color: themeColors.text }}>
            Manage products with images, pricing, and inventory
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" style={{ color: themeColors.text }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-10 pr-4 py-2 rounded-xl border w-full md:w-64"
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text,
              }}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 rounded-xl border"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text,
            }}
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>
                {category.title}
              </option>
            ))}
          </select>

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
            onClick={fetchData}
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
            <span className="hidden md:inline">New Product</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Total Products</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{stats.total}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}>
              <FaBox size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Active Products</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{stats.active}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#10B98120', color: '#10B981' }}>
              <FaCheckCircle size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Out of Stock</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{stats.outOfStock}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}>
              <FaTimesCircle size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Inventory Value</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>
                ₹{totalInventoryValue.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#8B5CF620', color: '#8B5CF6' }}>
              <FaRupeeSign size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: themeColors.primary }}></div>
          <p className="mt-2 opacity-70" style={{ color: themeColors.text }}>Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <FaBox className="text-6xl mx-auto mb-4 opacity-30" style={{ color: themeColors.text }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: themeColors.text }}>No Products Found</h3>
          <p className="opacity-70 mb-6" style={{ color: themeColors.text }}>
            {search ? `No products match "${search}"` : "Create your first product"}
          </p>
          <button
            onClick={showCreateModal}
            className="px-6 py-3 rounded-xl inline-flex items-center gap-2"
            style={{ backgroundColor: themeColors.primary, color: 'white' }}
            disabled={actionLoading}
          >
            <FaPlus />
            Create First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <div
              key={product?._id || `product-${index}`}
              className="rounded-2xl border overflow-hidden group hover:shadow-lg transition-all"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                opacity: product?.isActive ? 1 : 0.8
              }}
            >
              {/* Image with discount badge */}
              <div
                className="relative h-48 overflow-hidden cursor-pointer bg-gray-50"
                onClick={() => viewProductDetails(product)}
              >
                <img
                  src={product?.images?.[0]}
                  alt={product?.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/400x400?text=No+Image";
                  }}
                />

                {/* Discount Badge */}
                {product?.offerPrice && product?.offerPrice < product?.price && (
                  <div className="absolute top-2 left-2">
                    <div className="px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
                      {calculatePercentageOff(product.price, product.offerPrice)}% OFF
                    </div>
                  </div>
                )}

                <div className="absolute top-2 right-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product?.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {product?.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>

                {/* Stock Status */}
                <div className={`absolute bottom-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                  (product?.stockQuantity || 0) <= 0
                    ? 'bg-red-100 text-red-800'
                    : (product?.stockQuantity || 0) < 10
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                }`}>
                  {product?.stockQuantity <= 0 ? 'Out of Stock' : `${product?.stockQuantity} in stock`}
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-white font-bold text-lg truncate">{product?.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {product?.offerPrice && product?.offerPrice < product?.price ? (
                      <>
                        <span className="text-white line-through text-sm">₹{product?.price}</span>
                        <span className="text-green-300 font-bold">₹{product?.offerPrice}</span>
                      </>
                    ) : (
                      <span className="text-white font-bold">₹{product?.price}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Category</p>
                    <p className="text-xs font-medium" style={{ color: themeColors.text }}>
                      {product?.category?.title || 'No Category'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Unit</p>
                    <p className="text-xs font-medium" style={{ color: themeColors.text }}>
                      {product?.unit || 'piece'}
                    </p>
                  </div>
                </div>

                <div className="text-sm" style={{ color: themeColors.text }}>
                  <p className="truncate">{product?.description || 'No description'}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: themeColors.border }}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => viewProductDetails(product)}
                      className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                      style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => copyToClipboard(product?._id)}
                      className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                      style={{ backgroundColor: '#8B5CF620', color: '#8B5CF6' }}
                      title="Copy ID"
                    >
                      <FaClipboard />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => showEditModal(product)}
                      className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                      style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}
                      title="Edit Product"
                      disabled={actionLoading}
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => toggleProductStatus(product)}
                      disabled={actionLoading}
                      className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                      style={{
                        backgroundColor: product?.isActive ? '#F59E0B20' : '#10B98120',
                        color: product?.isActive ? '#F59E0B' : '#10B981'
                      }}
                      title={product?.isActive ? "Deactivate" : "Activate"}
                    >
                      {product?.isActive ? <FaToggleOff /> : <FaToggleOn />}
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      disabled={actionLoading}
                      className="p-2 rounded-lg hover:bg-opacity-20 transition-colors text-red-500"
                      style={{ backgroundColor: '#EF444420' }}
                      title="Delete Product"
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
          Showing {filteredProducts.length} of {products.length} products •
          Category: {selectedCategory === "all" ? "All" : categories.find(c => c._id === selectedCategory)?.title} •
          Sorted by: {sortByDate === "desc" ? "Newest First" : "Oldest First"} •
          Last updated: {lastUpdated ? lastUpdated.toLocaleString() : '—'}
        </p>
      </div>
    </div>
  );
}
