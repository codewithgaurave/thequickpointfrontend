// src/pages/Stores.jsx
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
  FaStore,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaMapPin,
  FaCity,
  FaGlobe,
  FaUserTie,
  FaCopy,
  FaClipboard,
  FaIdCard,
  FaRegBuilding,
  FaBox,
  FaShoppingCart,
  FaList,
  FaEye as FaEyeIcon,
  FaExternalLinkAlt
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import {
  createStoreAPI,
  getAllStoresAPI,
  updateStoreAPI,
  updateStoreStatusAPI,
  deleteStoreAPI,
  getStoreProductsAPI
} from "../apis/storeApi";

const MySwal = withReactContent(Swal);

export default function Stores() {
  const { themeColors } = useTheme();

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortByDate, setSortByDate] = useState("desc");
  const [actionLoading, setActionLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [createImagePreview, setCreateImagePreview] = useState("");
  const [editImagePreview, setEditImagePreview] = useState("");
  const [storeProducts, setStoreProducts] = useState({}); // storeId -> products data

  // Fetch all stores
  const fetchStores = async () => {
    try {
      setLoading(true);
      const res = await getAllStoresAPI();
      const storesData = res?.data?.stores || [];
      setStores(storesData);
      
      // Fetch products for each store
      await fetchStoreProductsData(storesData);
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching stores:", err);
      toast.error("Failed to load stores");
      setStores([]);
      setStoreProducts({});
    } finally {
      setLoading(false);
    }
  };

  // Fetch products for each store
  const fetchStoreProductsData = async (storesList) => {
    const productsMap = {};
    
    for (const store of storesList) {
      try {
        const response = await getStoreProductsAPI(store._id);
        const storeData = response?.data;
        
        if (storeData && storeData.products) {
          productsMap[store._id] = {
            count: storeData.products.length,
            products: storeData.products.slice(0, 5), // Keep only first 5 for preview
            storeInfo: storeData.store
          };
        } else {
          productsMap[store._id] = {
            count: 0,
            products: [],
            storeInfo: store
          };
        }
      } catch (error) {
        console.error(`Error fetching products for store ${store._id}:`, error);
        productsMap[store._id] = {
          count: 0,
          products: [],
          storeInfo: store
        };
      }
    }
    
    setStoreProducts(productsMap);
  };

  // Refresh products for a single store
  const refreshStoreProducts = async (storeId) => {
    try {
      const response = await getStoreProductsAPI(storeId);
      const storeData = response?.data;
      
      if (storeData) {
        setStoreProducts(prev => ({
          ...prev,
          [storeId]: {
            count: storeData.products?.length || 0,
            products: storeData.products?.slice(0, 5) || [],
            storeInfo: storeData.store
          }
        }));
      }
    } catch (error) {
      console.error(`Error refreshing products for store ${storeId}:`, error);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // Filter and sort stores
  const filteredStores = (stores || [])
    .filter(store => {
      if (!store) return false;
      const query = search.toLowerCase();
      const productCount = storeProducts[store._id]?.count || 0;
      
      return (
        (store._id && store._id.toLowerCase().includes(query)) ||
        (store.storeName && store.storeName.toLowerCase().includes(query)) ||
        (store.storeCode && store.storeCode.toLowerCase().includes(query)) ||
        (store.managerName && store.managerName.toLowerCase().includes(query)) ||
        (store.managerPhone && store.managerPhone.includes(query)) ||
        (store.location?.city && store.location.city.toLowerCase().includes(query)) ||
        (store.location?.address && store.location.address.toLowerCase().includes(query)) ||
        (productCount.toString().includes(query)) ||
        (store.isActive ? "active" : "inactive").includes(query)
      );
    })
    .sort((a, b) => {
      if (!a || !b) return 0;
      if (sortByDate === "desc") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    });

  // Handle create image preview
  const handleCreateImagePreview = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCreateImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle edit image preview
  const handleEditImagePreview = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear all image previews
  const clearAllImagePreviews = () => {
    setCreateImagePreview("");
    setEditImagePreview("");
    
    // Clear file inputs
    const createFileInput = document.getElementById('swal-storeImage');
    if (createFileInput) createFileInput.value = "";
    
    const editFileInput = document.getElementById('swal-edit-storeImage');
    if (editFileInput) editFileInput.value = "";
  };

  // Show store products modal
  const showStoreProductsModal = async (store) => {
    if (!store) return;

    // Get current products data
    let productsData = storeProducts[store._id];
    if (!productsData) {
      // Fetch if not already loaded
      try {
        const response = await getStoreProductsAPI(store._id);
        productsData = {
          count: response?.data?.products?.length || 0,
          products: response?.data?.products || [],
          storeInfo: response?.data?.store || store
        };
      } catch (error) {
        console.error(`Error fetching products for modal:`, error);
        productsData = {
          count: 0,
          products: [],
          storeInfo: store
        };
      }
    }

    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Store Products</div>,
      html: (
        <div className="text-left space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden">
                <img
                  src={store?.storeImageUrl}
                  alt={store.storeName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/100?text=Store";
                  }}
                />
              </div>
              <div>
                <h3 className="font-bold text-lg">{store?.storeName}</h3>
                <p className="text-sm opacity-70">{store?.storeCode}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    store?.isActive 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {store?.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    {productsData.count} Products
                  </span>
                </div>
              </div>
            </div>
          </div>

          {productsData.count === 0 ? (
            <div className="text-center py-8">
              <FaBox className="text-4xl opacity-30 mx-auto mb-3" style={{ color: themeColors.text }} />
              <p className="opacity-70 mb-2" style={{ color: themeColors.text }}>No products assigned to this store</p>
              <p className="text-xs opacity-70" style={{ color: themeColors.text }}>
                Assign products from the Products page
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold" style={{ color: themeColors.text }}>Assigned Products</h4>
                <span className="text-sm opacity-70" style={{ color: themeColors.text }}>
                  Showing {productsData.products.length} of {productsData.count}
                </span>
              </div>
              
              <div className="space-y-2">
                {productsData.products.map((product, index) => (
                  <div
                    key={product._id || index}
                    className="p-3 rounded-lg border flex items-center gap-3 hover:bg-opacity-10 transition-colors"
                    style={{ 
                      borderColor: themeColors.border,
                      backgroundColor: product?.isActive ? 'transparent' : themeColors.background + '30'
                    }}
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium truncate" style={{ color: themeColors.text }}>
                            {product.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-bold" style={{ color: themeColors.text }}>
                              ₹{product.price}
                            </span>
                            {product.offerPrice && product.offerPrice < product.price && (
                              <>
                                <span className="text-sm line-through opacity-70" style={{ color: themeColors.text }}>
                                  ₹{product.price}
                                </span>
                                <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
                                  {product.percentageOff}% OFF
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            product?.isActive 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-xs opacity-70">
                            Stock: {product.stockQuantity} {product.unit}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs opacity-70 bg-gray-100 px-2 py-0.5 rounded">
                          {product.category?.title || 'No Category'}
                        </span>
                        <span className="text-xs opacity-70">
                          ID: {product._id?.substring(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {productsData.count > productsData.products.length && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => {
                      // Close current modal and open full products page or bigger modal
                      Swal.close();
                      toast.info(`Total ${productsData.count} products. View all in Products page.`);
                    }}
                    className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                    style={{ color: themeColors.primary }}
                  >
                    View all {productsData.count} products →
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="text-xs opacity-70 p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
            <p className="font-medium mb-1">Note:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Products are shared across multiple stores</li>
              <li>Inactive products are shown with reduced opacity</li>
              <li>Stock quantity is per store inventory</li>
              <li>To manage assignments, go to Products page</li>
            </ul>
          </div>
        </div>
      ),
      showConfirmButton: false,
      showCloseButton: true,
      width: '600px',
      background: themeColors.background,
    });
  };

  // Show create store modal
  const showCreateModal = () => {
    clearAllImagePreviews();

    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Create New Store</div>,
      html: (
        <div className="space-y-4 text-left max-h-[80vh] overflow-y-auto pr-2">
          <div className="mb-4">
            <p className="text-sm opacity-70 mb-2" style={{ color: themeColors.text }}>
              Add a new physical store location
            </p>
          </div>

          {/* Basic Information */}
          <div className="p-3 rounded-lg border mb-4" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background + '20' }}>
            <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: themeColors.text }}>
              <FaStore /> Basic Information
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Store Name *
              </label>
              <input
                id="swal-storeName"
                type="text"
                className="w-full p-2 rounded-lg border"
                placeholder="e.g., Main City Store, Downtown Branch"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Store Code *
              </label>
              <input
                id="swal-storeCode"
                type="text"
                className="w-full p-2 rounded-lg border"
                placeholder="e.g., STORE-001, BRANCH-002"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>
          </div>

          {/* Location Information */}
          <div className="p-3 rounded-lg border mb-4 mt-6" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background + '20' }}>
            <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: themeColors.text }}>
              <FaMapMarkerAlt /> Location Details
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Latitude *
              </label>
              <input
                id="swal-latitude"
                type="number"
                step="any"
                className="w-full p-2 rounded-lg border"
                placeholder="e.g., 19.0760"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Longitude *
              </label>
              <input
                id="swal-longitude"
                type="number"
                step="any"
                className="w-full p-2 rounded-lg border"
                placeholder="e.g., 72.8777"
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
                Address *
              </label>
              <input
                id="swal-address"
                type="text"
                className="w-full p-2 rounded-lg border"
                placeholder="e.g., Andheri West, Street Name"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                City *
              </label>
              <input
                id="swal-city"
                type="text"
                className="w-full p-2 rounded-lg border"
                placeholder="e.g., Mumbai"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                State *
              </label>
              <input
                id="swal-state"
                type="text"
                className="w-full p-2 rounded-lg border"
                placeholder="e.g., Maharashtra"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Pincode *
              </label>
              <input
                id="swal-pincode"
                type="text"
                className="w-full p-2 rounded-lg border"
                placeholder="e.g., 400053"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Country *
              </label>
              <input
                id="swal-country"
                type="text"
                className="w-full p-2 rounded-lg border"
                placeholder="e.g., India"
                defaultValue="India"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>
          </div>

          {/* Manager Information */}
          <div className="p-3 rounded-lg border mb-4 mt-6" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background + '20' }}>
            <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: themeColors.text }}>
              <FaUserTie /> Manager Details
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Manager Name *
              </label>
              <input
                id="swal-managerName"
                type="text"
                className="w-full p-2 rounded-lg border"
                placeholder="e.g., Rohit Kumar"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Manager Phone *
              </label>
              <input
                id="swal-managerPhone"
                type="tel"
                className="w-full p-2 rounded-lg border"
                placeholder="e.g., 9876543210"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Manager Email
              </label>
              <input
                id="swal-managerEmail"
                type="email"
                className="w-full p-2 rounded-lg border"
                placeholder="e.g., manager@example.com"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>
          </div>

          {/* Store Details */}
          <div className="p-3 rounded-lg border mb-4 mt-6" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background + '20' }}>
            <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: themeColors.text }}>
              <FaRegBuilding /> Store Details
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Opening Hours *
              </label>
              <input
                id="swal-openingHours"
                type="text"
                className="w-full p-2 rounded-lg border"
                placeholder="e.g., Mon-Sun 9:00 AM - 9:00 PM"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
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
                <option value="true">Active (Operational)</option>
                <option value="false">Inactive (Closed/Temporary)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
              Notes / Additional Information
            </label>
            <textarea
              id="swal-notes"
              rows="3"
              className="w-full p-2 rounded-lg border"
              placeholder="e.g., Main flagship store, Near metro station, Parking available"
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
            />
          </div>

          {/* Store Image */}
          <div className="p-3 rounded-lg border mb-4 mt-6" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background + '20' }}>
            <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: themeColors.text }}>
              <FaImage /> Store Image
            </h3>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
              Store Image *
            </label>
            <input
              id="swal-storeImage"
              type="file"
              accept="image/*"
              className="w-full p-2 rounded-lg border"
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
              onChange={handleCreateImagePreview}
            />
            <div className="mt-3">
              <img
                src={createImagePreview || "https://via.placeholder.com/600x300?text=Store+Preview"}
                alt="Store Preview"
                className="w-full h-48 object-cover rounded-lg border"
                style={{ borderColor: themeColors.border }}
              />
            </div>
            <p className="text-xs opacity-70 mt-1">Recommended size: 1200x600 pixels (landscape)</p>
          </div>

          <div className="text-xs opacity-70 p-3 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background + '50' }}>
            <p className="font-medium mb-1">Important Notes:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>All fields marked with * are required</li>
              <li>Store code must be unique</li>
              <li>Phone number should be 10 digits</li>
              <li>Image: Max 5MB, JPG/PNG/WebP format</li>
              <li>Coordinates can be obtained from Google Maps</li>
            </ul>
          </div>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: 'Create Store',
      cancelButtonText: 'Cancel',
      confirmButtonColor: themeColors.primary || '#3B82F6',
      cancelButtonColor: themeColors.border || '#6B7280',
      background: themeColors.background,
      width: '900px',
      preConfirm: async () => {
        const storeName = document.getElementById('swal-storeName').value.trim();
        const storeCode = document.getElementById('swal-storeCode').value.trim();
        const latitude = document.getElementById('swal-latitude').value;
        const longitude = document.getElementById('swal-longitude').value;
        const address = document.getElementById('swal-address').value.trim();
        const city = document.getElementById('swal-city').value.trim();
        const state = document.getElementById('swal-state').value.trim();
        const pincode = document.getElementById('swal-pincode').value.trim();
        const country = document.getElementById('swal-country').value.trim();
        const managerName = document.getElementById('swal-managerName').value.trim();
        const managerPhone = document.getElementById('swal-managerPhone').value.trim();
        const managerEmail = document.getElementById('swal-managerEmail').value.trim();
        const openingHours = document.getElementById('swal-openingHours').value.trim();
        const notes = document.getElementById('swal-notes').value.trim();
        const isActive = document.getElementById('swal-isActive').value === 'true';
        const storeImage = document.getElementById('swal-storeImage').files[0];

        // Validation
        if (!storeName) {
          Swal.showValidationMessage('Please enter store name');
          return false;
        }

        if (!storeCode) {
          Swal.showValidationMessage('Please enter store code');
          return false;
        }

        if (!latitude || isNaN(parseFloat(latitude))) {
          Swal.showValidationMessage('Please enter valid latitude');
          return false;
        }

        if (!longitude || isNaN(parseFloat(longitude))) {
          Swal.showValidationMessage('Please enter valid longitude');
          return false;
        }

        if (!address) {
          Swal.showValidationMessage('Please enter address');
          return false;
        }

        if (!city) {
          Swal.showValidationMessage('Please enter city');
          return false;
        }

        if (!state) {
          Swal.showValidationMessage('Please enter state');
          return false;
        }

        if (!pincode || pincode.length !== 6 || isNaN(pincode)) {
          Swal.showValidationMessage('Please enter valid 6-digit pincode');
          return false;
        }

        if (!country) {
          Swal.showValidationMessage('Please enter country');
          return false;
        }

        if (!managerName) {
          Swal.showValidationMessage('Please enter manager name');
          return false;
        }

        if (!managerPhone || managerPhone.length !== 10 || isNaN(managerPhone)) {
          Swal.showValidationMessage('Please enter valid 10-digit phone number');
          return false;
        }

        if (!openingHours) {
          Swal.showValidationMessage('Please enter opening hours');
          return false;
        }

        if (!storeImage) {
          Swal.showValidationMessage('Please select a store image');
          return false;
        }

        if (!storeImage.type.startsWith('image/')) {
          Swal.showValidationMessage('Please select a valid image file');
          return false;
        }

        if (storeImage.size > 5 * 1024 * 1024) {
          Swal.showValidationMessage('Image size should be less than 5MB');
          return false;
        }

        try {
          setActionLoading(true);
          const formData = new FormData();
          formData.append('storeName', storeName);
          formData.append('storeCode', storeCode);
          formData.append('latitude', latitude);
          formData.append('longitude', longitude);
          formData.append('address', address);
          formData.append('city', city);
          formData.append('state', state);
          formData.append('pincode', pincode);
          formData.append('country', country);
          formData.append('managerName', managerName);
          formData.append('managerPhone', managerPhone);
          if (managerEmail) formData.append('managerEmail', managerEmail);
          formData.append('openingHours', openingHours);
          if (notes) formData.append('notes', notes);
          formData.append('isActive', isActive);
          formData.append('storeImage', storeImage);

          const res = await createStoreAPI(formData);
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
        await fetchStores();
        clearAllImagePreviews();
        toast.success('Store created successfully!');
      }
    });
  };

  // Show edit store modal
  const showEditModal = (store) => {
    if (!store) return;

    setEditImagePreview("");

    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Edit Store</div>,
      html: (
        <div className="space-y-4 text-left max-h-[80vh] overflow-y-auto pr-2">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: themeColors.text }}>Current Store Image</label>
            <img
              src={store?.storeImageUrl}
              alt={store.storeName}
              className="w-full h-48 object-cover rounded-lg border mb-2"
              style={{ borderColor: themeColors.border }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/600x300?text=Store+Image";
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Store Name *
              </label>
              <input
                id="swal-edit-storeName"
                type="text"
                className="w-full p-2 rounded-lg border"
                defaultValue={store?.storeName || ''}
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Store Code *
              </label>
              <input
                id="swal-edit-storeCode"
                type="text"
                className="w-full p-2 rounded-lg border"
                defaultValue={store?.storeCode || ''}
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
                Address *
              </label>
              <input
                id="swal-edit-address"
                type="text"
                className="w-full p-2 rounded-lg border"
                defaultValue={store?.location?.address || ''}
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Opening Hours *
              </label>
              <input
                id="swal-edit-openingHours"
                type="text"
                className="w-full p-2 rounded-lg border"
                defaultValue={store?.openingHours || ''}
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
                Manager Phone *
              </label>
              <input
                id="swal-edit-managerPhone"
                type="tel"
                className="w-full p-2 rounded-lg border"
                defaultValue={store?.managerPhone || ''}
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
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
                defaultValue={store?.isActive ? "true" : "false"}
              >
                <option value="true">Active (Operational)</option>
                <option value="false">Inactive (Closed/Temporary)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
              Notes / Additional Information
            </label>
            <textarea
              id="swal-edit-notes"
              rows="3"
              className="w-full p-2 rounded-lg border"
              defaultValue={store?.notes || ''}
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
              New Store Image (Optional)
            </label>
            <input
              id="swal-edit-storeImage"
              type="file"
              accept="image/*"
              className="w-full p-2 rounded-lg border"
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
              onChange={handleEditImagePreview}
            />
            <div className="mt-2">
              <img
                src={editImagePreview || "https://via.placeholder.com/600x300?text=New+Preview"}
                alt="Store Preview"
                className="w-full h-32 object-cover rounded-lg border"
                style={{ borderColor: themeColors.border }}
              />
            </div>
            <p className="text-xs opacity-70 mt-1">Leave empty to keep current image</p>
          </div>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: 'Update Store',
      cancelButtonText: 'Cancel',
      confirmButtonColor: themeColors.primary || '#3B82F6',
      cancelButtonColor: themeColors.border || '#6B7280',
      background: themeColors.background,
      width: '700px',
      preConfirm: async () => {
        const storeName = document.getElementById('swal-edit-storeName').value.trim();
        const storeCode = document.getElementById('swal-edit-storeCode').value.trim();
        const address = document.getElementById('swal-edit-address').value.trim();
        const openingHours = document.getElementById('swal-edit-openingHours').value.trim();
        const managerPhone = document.getElementById('swal-edit-managerPhone').value.trim();
        const notes = document.getElementById('swal-edit-notes').value.trim();
        const isActive = document.getElementById('swal-edit-isActive').value === 'true';
        const storeImage = document.getElementById('swal-edit-storeImage').files[0];

        // Validation
        if (!storeName) {
          Swal.showValidationMessage('Please enter store name');
          return false;
        }

        if (!storeCode) {
          Swal.showValidationMessage('Please enter store code');
          return false;
        }

        if (!address) {
          Swal.showValidationMessage('Please enter address');
          return false;
        }

        if (!openingHours) {
          Swal.showValidationMessage('Please enter opening hours');
          return false;
        }

        if (!managerPhone || managerPhone.length !== 10 || isNaN(managerPhone)) {
          Swal.showValidationMessage('Please enter valid 10-digit phone number');
          return false;
        }

        try {
          setActionLoading(true);
          const formData = new FormData();
          formData.append('storeName', storeName);
          formData.append('storeCode', storeCode);
          formData.append('address', address);
          formData.append('openingHours', openingHours);
          formData.append('managerPhone', managerPhone);
          if (notes) formData.append('notes', notes);
          formData.append('isActive', isActive);
          if (storeImage) {
            formData.append('storeImage', storeImage);
            if (!storeImage.type.startsWith('image/')) {
              Swal.showValidationMessage('Please select a valid image file');
              return false;
            }
            if (storeImage.size > 5 * 1024 * 1024) {
              Swal.showValidationMessage('Image size should be less than 5MB');
              return false;
            }
          }

          const res = await updateStoreAPI(store?._id, formData);
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
        await fetchStores();
        setEditImagePreview("");
        const editFileInput = document.getElementById('swal-edit-storeImage');
        if (editFileInput) editFileInput.value = "";
        toast.success('Store updated successfully!');
      }
    });
  };

  // Toggle store status
  const toggleStoreStatus = async (store) => {
    if (!store) return;

    const newStatus = !store.isActive;
    const action = newStatus ? 'activate' : 'deactivate';

    const result = await MySwal.fire({
      title: <div style={{ color: themeColors.text }}>
        {newStatus ? 'Activate Store' : 'Deactivate Store'}
      </div>,
      html: <div style={{ color: themeColors.text }}>
        Are you sure you want to {action} this store?
        <div className="my-3 p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={store?.storeImageUrl}
                alt={store.storeName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/100?text=No+Image";
                }}
              />
            </div>
            <div>
              <p className="font-bold text-lg">{store?.storeName}</p>
              <p className="text-sm opacity-70">{store?.storeCode}</p>
              <p className="text-xs opacity-70">{store?.location?.address}</p>
              <p className="text-xs opacity-70">ID: {store?._id?.substring(0, 8)}...</p>
            </div>
          </div>
        </div>
        <p className="text-sm opacity-70">
          {newStatus 
            ? 'This store will become operational and visible to users.' 
            : 'This store will be marked as closed/temporary closed.'}
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
        await updateStoreStatusAPI(store?._id, newStatus);
        await fetchStores();
        toast.success(`Store ${action}d successfully`);
      } catch (err) {
        console.error("Error updating store status:", err);
        toast.error("Failed to update store status");
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Delete store
  const handleDelete = async (store) => {
    if (!store) return;

    const result = await MySwal.fire({
      title: <div style={{ color: themeColors.text }}>Delete Store</div>,
      html: <div style={{ color: themeColors.text }}>
        <div className="text-red-500 text-xl mb-3">
          <FaTrash className="inline mr-2" />
          Warning: This action cannot be undone!
        </div>
        <p>Are you sure you want to delete this store?</p>
        <div className="my-3 p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={store?.storeImageUrl}
                alt={store.storeName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/100?text=No+Image";
                }}
              />
            </div>
            <div className="flex-1">
              <p className="font-bold text-xl">{store?.storeName}</p>
              <p className="text-lg">{store?.storeCode}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                  store?.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {store?.isActive ? <FaCheckCircle /> : <FaTimesCircle />}
                  {store?.isActive ? 'Active' : 'Inactive'}
                </div>
                <div className="text-xs opacity-70">
                  {store?.location?.city}, {store?.location?.state}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-sm text-red-500 mt-2 p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
          <p className="font-bold mb-1">⚠️ Critical Warning:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>This will permanently delete the store</li>
            <li>All store data will be lost</li>
            <li>Associated products may be affected</li>
            <li>Store mapping will be removed</li>
          </ul>
        </div>
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
        await deleteStoreAPI(store?._id);
        await fetchStores();
        toast.success("Store deleted successfully");
      } catch (err) {
        console.error("Error deleting store:", err);
        toast.error("Failed to delete store");
      } finally {
        setActionLoading(false);
      }
    }
  };

  // View store details
  const viewStoreDetails = (store) => {
    if (!store) return;

    const productsData = storeProducts[store._id] || { count: 0, products: [] };

    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Store Details</div>,
      html: (
        <div className="text-left space-y-4" style={{ color: themeColors.text }}>
          <div className="mb-4">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 mb-3" style={{ borderColor: themeColors.primary }}>
                <img
                  src={store?.storeImageUrl}
                  alt={store.storeName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/300?text=No+Image";
                  }}
                />
              </div>
              <h3 className="text-2xl font-bold">{store?.storeName}</h3>
              <p className="text-lg opacity-70">{store?.storeCode}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-70">Status</p>
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                store?.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}>
                {store?.isActive ? <FaCheckCircle /> : <FaTimesCircle />}
                {store?.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div>
              <p className="text-sm opacity-70">Assigned Products</p>
              <button
                onClick={() => {
                  Swal.close();
                  showStoreProductsModal(store);
                }}
                className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors flex items-center gap-1"
              >
                <FaBox className="text-xs" />
                {productsData.count} products
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-70">Created</p>
              <p className="font-medium">
                {store?.createdAt ? new Date(store.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-70">Last Updated</p>
              <p className="font-medium">
                {store?.updatedAt ? new Date(store.updatedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          {/* Location Details */}
          <div className="p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
            <h4 className="font-bold mb-2 flex items-center gap-2">
              <FaMapMarkerAlt /> Location
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs opacity-70">Address</p>
                <p className="font-medium">{store?.location?.address}</p>
              </div>
              <div>
                <p className="text-xs opacity-70">City</p>
                <p className="font-medium">{store?.location?.city}</p>
              </div>
              <div>
                <p className="text-xs opacity-70">State</p>
                <p className="font-medium">{store?.location?.state}</p>
              </div>
              <div>
                <p className="text-xs opacity-70">Pincode</p>
                <p className="font-medium">{store?.location?.pincode}</p>
              </div>
              <div>
                <p className="text-xs opacity-70">Coordinates</p>
                <p className="font-medium text-sm">
                  {store?.location?.latitude}, {store?.location?.longitude}
                </p>
              </div>
            </div>
          </div>

          {/* Manager Details */}
          <div className="p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
            <h4 className="font-bold mb-2 flex items-center gap-2">
              <FaUserTie /> Manager
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs opacity-70">Name</p>
                <p className="font-medium">{store?.managerName}</p>
              </div>
              <div>
                <p className="text-xs opacity-70">Phone</p>
                <p className="font-medium">{store?.managerPhone}</p>
              </div>
              <div>
                <p className="text-xs opacity-70">Email</p>
                <p className="font-medium">{store?.managerEmail || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Store Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-70">Opening Hours</p>
              <p className="font-medium">{store?.openingHours}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">Store ID</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm truncate">{store?._id}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(store?._id).then(() => {
                      toast.success("Store ID copied!");
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

          {store?.notes && (
            <div>
              <p className="text-sm opacity-70">Notes</p>
              <p className="p-3 rounded-lg border mt-1" style={{ borderColor: themeColors.border }}>
                {store?.notes}
              </p>
            </div>
          )}

          <div>
            <p className="text-sm opacity-70">Store Image URL</p>
            <a
              href={store?.storeImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline text-sm break-all"
            >
              {store?.storeImageUrl || 'No URL available'}
            </a>
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
    total: stores?.length || 0,
    active: (stores || []).filter(s => s?.isActive).length,
    inactive: (stores || []).filter(s => !s?.isActive).length,
  };

  // Get unique cities count
  const uniqueCities = [...new Set(stores.map(store => store?.location?.city).filter(Boolean))].length;

  // Calculate total products assigned to all stores
  const totalProductsAssigned = Object.values(storeProducts).reduce(
    (total, data) => total + (data.count || 0), 0
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: themeColors.text }}>
            Stores
          </h2>
          <p className="text-sm opacity-75 mt-1" style={{ color: themeColors.text }}>
            Manage physical store locations and details
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" style={{ color: themeColors.text }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stores or products..."
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
            onClick={fetchStores}
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
            <span className="hidden md:inline">New Store</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Total Stores</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{stats.total}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}>
              <FaStore size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Active Stores</p>
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
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Total Products</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{totalProductsAssigned}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#8B5CF620', color: '#8B5CF6' }}>
              <FaBox size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Inactive Stores</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{stats.inactive}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}>
              <FaTimesCircle size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Cities</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{uniqueCities}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#8B5CF620', color: '#8B5CF6' }}>
              <FaCity size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Stores Grid */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: themeColors.primary }}></div>
          <p className="mt-2 opacity-70" style={{ color: themeColors.text }}>Loading stores...</p>
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <FaStore className="text-6xl mx-auto mb-4 opacity-30" style={{ color: themeColors.text }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: themeColors.text }}>No Stores Found</h3>
          <p className="opacity-70 mb-6" style={{ color: themeColors.text }}>
            {search ? `No stores match "${search}"` : "Create your first store"}
          </p>
          <button
            onClick={showCreateModal}
            className="px-6 py-3 rounded-xl inline-flex items-center gap-2"
            style={{ backgroundColor: themeColors.primary, color: 'white' }}
            disabled={actionLoading}
          >
            <FaPlus />
            Create First Store
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store, index) => {
            const productsData = storeProducts[store._id] || { count: 0, products: [] };
            
            return (
              <div
                key={store?._id || `store-${index}`}
                className="rounded-2xl border overflow-hidden group hover:shadow-lg transition-all"
                style={{
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                  opacity: store?.isActive ? 1 : 0.8
                }}
              >
                {/* Store Image */}
                <div
                  className="relative h-48 overflow-hidden cursor-pointer bg-gray-50"
                  onClick={() => viewStoreDetails(store)}
                >
                  <img
                    src={store?.storeImageUrl}
                    alt={store?.storeName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/600x300?text=Store+Image";
                    }}
                  />
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      store?.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {store?.isActive ? 'Active' : 'Inactive'}
                    </div>
                    {productsData.count > 0 && (
                      <div 
                        className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          showStoreProductsModal(store);
                        }}
                      >
                        <FaBox className="inline mr-1" /> {productsData.count} products
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <div className="px-2 py-1 rounded-full bg-black/70 text-white text-xs font-medium">
                      <FaIdCard className="inline mr-1" /> {store?.storeCode}
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <p className="text-white font-bold text-lg truncate">{store?.storeName}</p>
                    <p className="text-white text-sm truncate">
                      <FaMapPin className="inline mr-1" /> {store?.location?.city}, {store?.location?.state}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm opacity-70 flex items-center gap-1" style={{ color: themeColors.text }}>
                        <FaMapMarkerAlt /> Address
                      </p>
                      <p className="text-xs font-medium truncate" style={{ color: themeColors.text }}>
                        {store?.location?.address || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm opacity-70 flex items-center gap-1" style={{ color: themeColors.text }}>
                        <FaPhone /> Phone
                      </p>
                      <p className="text-xs font-medium" style={{ color: themeColors.text }}>
                        {store?.managerPhone || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm opacity-70 flex items-center gap-1" style={{ color: themeColors.text }}>
                        <FaUserTie /> Manager
                      </p>
                      <p className="text-xs font-medium truncate" style={{ color: themeColors.text }}>
                        {store?.managerName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm opacity-70 flex items-center gap-1" style={{ color: themeColors.text }}>
                        <FaClock /> Hours
                      </p>
                      <p className="text-xs font-medium truncate" style={{ color: themeColors.text }}>
                        {store?.openingHours || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Products Preview */}
                  {productsData.count > 0 && productsData.products.length > 0 && (
                    <div className="border-t pt-3" style={{ borderColor: themeColors.border }}>
                      <p className="text-sm opacity-70 mb-2 flex items-center justify-between" style={{ color: themeColors.text }}>
                        <span className="flex items-center gap-1">
                          <FaBox /> Products Preview
                        </span>
                        <button
                          onClick={() => showStoreProductsModal(store)}
                          className="text-xs opacity-70 hover:opacity-100 transition-opacity"
                          style={{ color: themeColors.primary }}
                        >
                          View all →
                        </button>
                      </p>
                      <div className="flex -space-x-2">
                        {productsData.products.slice(0, 4).map((product, idx) => (
                          <div
                            key={product._id || idx}
                            className="w-8 h-8 rounded-full border-2 overflow-hidden"
                            style={{ 
                              borderColor: themeColors.background,
                              backgroundColor: themeColors.background,
                              zIndex: 5 - idx
                            }}
                            title={`${product.name} (₹${product.price})`}
                          >
                            <img
                              src={product.images?.[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/50?text=P";
                              }}
                            />
                          </div>
                        ))}
                        {productsData.count > 4 && (
                          <div 
                            className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium"
                            style={{ 
                              borderColor: themeColors.background,
                              backgroundColor: themeColors.background + '90',
                              color: themeColors.text,
                              zIndex: 1
                            }}
                            title={`${productsData.count - 4} more products`}
                          >
                            +{productsData.count - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: themeColors.border }}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => viewStoreDetails(store)}
                        className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                        style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}
                        title="View Details"
                      >
                        <FaEyeIcon />
                      </button>
                      <button
                        onClick={() => copyToClipboard(store?._id)}
                        className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                        style={{ backgroundColor: '#8B5CF620', color: '#8B5CF6' }}
                        title="Copy ID"
                      >
                        <FaClipboard />
                      </button>
                      <button
                        onClick={() => showStoreProductsModal(store)}
                        className={`p-2 rounded-lg hover:bg-opacity-20 transition-colors ${
                          productsData.count > 0 ? 'bg-blue-100 text-blue-700' : ''
                        }`}
                        style={{ 
                          backgroundColor: productsData.count > 0 ? '#3B82F620' : '#8B5CF620',
                          color: productsData.count > 0 ? '#3B82F6' : '#8B5CF6'
                        }}
                        title={productsData.count > 0 ? "View Products" : "No Products"}
                        disabled={productsData.count === 0}
                      >
                        <FaBox />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => showEditModal(store)}
                        className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                        style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}
                        title="Edit Store"
                        disabled={actionLoading}
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => toggleStoreStatus(store)}
                        disabled={actionLoading}
                        className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                        style={{
                          backgroundColor: store?.isActive ? '#F59E0B20' : '#10B98120',
                          color: store?.isActive ? '#F59E0B' : '#10B981'
                        }}
                        title={store?.isActive ? "Deactivate" : "Activate"}
                      >
                        {store?.isActive ? <FaToggleOff /> : <FaToggleOn />}
                      </button>
                      <button
                        onClick={() => handleDelete(store)}
                        disabled={actionLoading}
                        className="p-2 rounded-lg hover:bg-opacity-20 transition-colors text-red-500"
                        style={{ backgroundColor: '#EF444420' }}
                        title="Delete Store"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <div className="text-center text-sm opacity-70" style={{ color: themeColors.text }}>
        <p>
          Showing {filteredStores.length} of {stores.length} stores •
          Total Products: {totalProductsAssigned} assigned •
          Sorted by: {sortByDate === "desc" ? "Newest First" : "Oldest First"} •
          Last updated: {lastUpdated ? lastUpdated.toLocaleString() : '—'}
        </p>
      </div>
    </div>
  );
}