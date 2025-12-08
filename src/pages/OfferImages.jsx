// src/pages/OfferImages.jsx
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
  FaPercent
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import {
  createOfferImageAPI,
  getAllOfferImagesAPI,
  updateOfferImageAPI,
  updateOfferImageStatusAPI,
  deleteOfferImageAPI,
} from "../apis/offerImageApi";

const MySwal = withReactContent(Swal);

export default function OfferImages() {
  const { themeColors } = useTheme();

  const [offerImages, setOfferImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortByDate, setSortByDate] = useState("desc");
  const [actionLoading, setActionLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch all offer images
  const fetchOfferImages = async () => {
    try {
      setLoading(true);
      const res = await getAllOfferImagesAPI();
      setOfferImages(res?.data?.offerImages || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching offer images:", err);
      toast.error("Failed to load offer images");
      setOfferImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfferImages();
  }, []);

  // Filter and sort offer images
  const filteredOfferImages = (offerImages || [])
    .filter(offer => {
      if (!offer) return false;
      const query = search.toLowerCase();
      return (
        (offer._id && offer._id.toLowerCase().includes(query)) ||
        (offer.isActive ? "active" : "inactive").includes(query)
      );
    })
    .sort((a, b) => {
      if (!a || !b) return 0;
      if (sortByDate === "desc") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    });

  // helper to clear preview images inside SweetAlert modals (avoid stale previews)
  const clearSwalPreviews = () => {
    const p1 = document.getElementById('offer-image-preview');
    if (p1) {
      p1.src = "";
      p1.classList.add('hidden');
    }
    const p2 = document.getElementById('edit-offer-image-preview');
    if (p2) {
      p2.src = "";
      p2.classList.add('hidden');
    }
    // also clear inputs if exist
    const file1 = document.getElementById('swal-offerImage');
    if (file1) file1.value = "";
    const file2 = document.getElementById('swal-edit-offerImage');
    if (file2) file2.value = "";
  };

  // Show create offer image modal
  const showCreateModal = () => {
    clearSwalPreviews();

    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Upload Offer Image</div>,
      html: (
        <div className="space-y-4 text-left">
          <div className="mb-4">
            <p className="text-sm opacity-70 mb-2" style={{ color: themeColors.text }}>
              Upload an image for promotional offers, banners, or advertisements
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
              Offer Image *
            </label>
            <input
              id="swal-offerImage"
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
                    const img = document.getElementById('offer-image-preview');
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
                id="offer-image-preview"
                alt="Preview"
                className="w-full h-48 object-contain rounded-lg border hidden"
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
              <li>Recommended size: 1200x400 pixels</li>
              <li>Max file size: 5MB</li>
              <li>Formats: JPG, PNG, WebP</li>
              <li>Use high-quality images for best results</li>
            </ul>
          </div>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: 'Upload Offer Image',
      cancelButtonText: 'Cancel',
      confirmButtonColor: themeColors.primary || '#3B82F6',
      cancelButtonColor: themeColors.border || '#6B7280',
      background: themeColors.background,
      width: '600px',
      preConfirm: async () => {
        const isActive = document.getElementById('swal-isActive').value === 'true';
        const offerImage = document.getElementById('swal-offerImage').files[0];

        // Validation
        if (!offerImage) {
          Swal.showValidationMessage('Please select an image file');
          return false;
        }

        if (!offerImage.type.startsWith('image/')) {
          Swal.showValidationMessage('Please select a valid image file');
          return false;
        }

        if (offerImage.size > 5 * 1024 * 1024) {
          Swal.showValidationMessage('Image size should be less than 5MB');
          return false;
        }

        try {
          setActionLoading(true);
          const formData = new FormData();
          formData.append('isActive', isActive);
          formData.append('offerImage', offerImage);

          const res = await createOfferImageAPI(formData);
          // return server response (not used directly to update list — we'll refetch)
          return res.data;
        } catch (error) {
          Swal.showValidationMessage(`Upload failed: ${error.response?.data?.message || error.message}`);
          return false;
        } finally {
          setActionLoading(false);
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        // Ensure freshest data by refetching from server
        await fetchOfferImages();
        clearSwalPreviews();
        toast.success('Offer image uploaded successfully!');
      }
    });
  };

  // Show edit offer image modal
  const showEditModal = (offerImage) => {
    if (!offerImage) return;

    clearSwalPreviews();

    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Edit Offer Image</div>,
      html: (
        <div className="space-y-4 text-left">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: themeColors.text }}>Current Image</label>
            {offerImage?.imageUrl ? (
              <img
                src={offerImage.imageUrl}
                alt="Offer"
                className="w-full h-48 object-contain rounded-lg border"
                style={{ borderColor: themeColors.border }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/400x200?text=No+Image";
                }}
              />
            ) : (
              <div className="w-full h-48 flex items-center justify-center rounded-lg border" style={{ borderColor: themeColors.border }}>
                <FaImage className="text-4xl opacity-30" style={{ color: themeColors.text }} />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>New Image (Optional)</label>
            <input
              id="swal-edit-offerImage"
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
                    const img = document.getElementById('edit-offer-image-preview');
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
                id="edit-offer-image-preview"
                alt="Preview"
                className="w-full h-32 object-contain rounded-lg border hidden"
                style={{ borderColor: themeColors.border }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Status</label>
            <select
              id="swal-edit-isActive"
              className="w-full p-2 rounded-lg border"
              defaultValue={offerImage?.isActive ? "true" : "false"}
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
      confirmButtonText: 'Update Offer Image',
      cancelButtonText: 'Cancel',
      confirmButtonColor: themeColors.primary || '#3B82F6',
      cancelButtonColor: themeColors.border || '#6B7280',
      background: themeColors.background,
      width: '600px',
      preConfirm: async () => {
        const isActive = document.getElementById('swal-edit-isActive').value === 'true';
        const offerImageFile = document.getElementById('swal-edit-offerImage').files[0];

        try {
          setActionLoading(true);
          const formData = new FormData();
          formData.append('isActive', isActive);
          if (offerImageFile) {
            formData.append('offerImage', offerImageFile);
          }

          const res = await updateOfferImageAPI(offerImage?._id, formData);
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
        // refetch list to ensure UI consistency
        await fetchOfferImages();
        clearSwalPreviews();
        toast.success('Offer image updated successfully!');
      }
    });
  };

  // Toggle offer image status
  const toggleOfferImageStatus = async (offerImage) => {
    if (!offerImage) return;

    const newStatus = !offerImage.isActive;

    const result = await MySwal.fire({
      title: <div style={{ color: themeColors.text }}>
        {newStatus ? 'Activate Offer Image' : 'Deactivate Offer Image'}
      </div>,
      html: <div style={{ color: themeColors.text }}>
        Are you sure you want to {newStatus ? 'activate' : 'deactivate'} this offer image?
        <div className="my-3 p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
          <img
            src={offerImage?.imageUrl}
            alt="Offer"
            className="w-full h-32 object-contain rounded"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/400x200?text=No+Image";
            }}
          />
        </div>
      </div>,
      icon: newStatus ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonText: `Yes, ${newStatus ? 'Activate' : 'Deactivate'}`,
      cancelButtonText: 'Cancel',
      confirmButtonColor: newStatus ? '#10B981' : '#F59E0B',
      cancelButtonColor: themeColors.border,
      background: themeColors.background,
    });

    if (result.isConfirmed) {
      try {
        setActionLoading(true);
        await updateOfferImageStatusAPI(offerImage?._id, newStatus);
        // refetch fresh list (keeps UI consistent if backend changes anything else)
        await fetchOfferImages();
        toast.success(`Offer image ${newStatus ? 'activated' : 'deactivated'} successfully`);
      } catch (err) {
        console.error("Error updating offer image status:", err);
        toast.error("Failed to update offer image status");
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Delete offer image
  const handleDelete = async (offerImage) => {
    if (!offerImage) return;

    const result = await MySwal.fire({
      title: <div style={{ color: themeColors.text }}>Delete Offer Image</div>,
      html: <div style={{ color: themeColors.text }}>
        <div className="text-red-500 text-xl mb-3">
          <FaTrash className="inline mr-2" />
          Warning: This action cannot be undone!
        </div>
        <p>Are you sure you want to delete this offer image?</p>
        <div className="my-3 p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
          <img
            src={offerImage?.imageUrl}
            alt="Offer"
            className="w-full h-48 object-contain rounded"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/400x200?text=No+Image";
            }}
          />
          <div className="mt-2 text-center">
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
              offerImage?.isActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}>
              {offerImage?.isActive ? <FaCheckCircle /> : <FaTimesCircle />}
              {offerImage?.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
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
        await deleteOfferImageAPI(offerImage?._id);
        // refetch to ensure list is fresh
        await fetchOfferImages();
        toast.success("Offer image deleted successfully");
      } catch (err) {
        console.error("Error deleting offer image:", err);
        toast.error("Failed to delete offer image");
      } finally {
        setActionLoading(false);
      }
    }
  };

  // View offer image details
  const viewOfferImageDetails = (offerImage) => {
    if (!offerImage) return;

    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Offer Image Details</div>,
      html: (
        <div className="text-left space-y-4" style={{ color: themeColors.text }}>
          <div className="mb-4">
            <img
              src={offerImage?.imageUrl}
              alt="Offer"
              className="w-full h-64 object-contain rounded-lg border"
              style={{ borderColor: themeColors.border }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/600x300?text=Image+Not+Available";
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-70">Status</p>
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                offerImage?.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}>
                {offerImage?.isActive ? <FaCheckCircle /> : <FaTimesCircle />}
                {offerImage?.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div>
              <p className="text-sm opacity-70">Created</p>
              <p className="font-medium">
                {offerImage?.createdAt ? new Date(offerImage.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm opacity-70">Image URL</p>
            <a
              href={offerImage?.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline text-sm break-all"
            >
              {offerImage?.imageUrl || 'No URL available'}
            </a>
          </div>

          {offerImage?._id && (
            <div className="text-xs opacity-70 border-t pt-2" style={{ borderColor: themeColors.border }}>
              <p>ID: {offerImage._id}</p>
            </div>
          )}
        </div>
      ),
      showConfirmButton: false,
      showCloseButton: true,
      width: '600px',
      background: themeColors.background,
    });
  };

  // Stats
  const stats = {
    total: offerImages?.length || 0,
    active: (offerImages || []).filter(o => o?.isActive).length,
    inactive: (offerImages || []).filter(o => !o?.isActive).length,
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: themeColors.text }}>
            Offer Images
          </h2>
          <p className="text-sm opacity-75 mt-1" style={{ color: themeColors.text }}>
            Manage promotional banners and offer images
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" style={{ color: themeColors.text }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search offer images..."
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
            onClick={fetchOfferImages}
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
            <span className="hidden md:inline">New Offer Image</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Total Images</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{stats.total}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}>
              <FaImage size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Active Offers</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{stats.active}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#10B98120', color: '#10B981' }}>
              <FaPercent size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Inactive Offers</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{stats.inactive}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}>
              <FaTag size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Offer Images Grid */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: themeColors.primary }}></div>
          <p className="mt-2 opacity-70" style={{ color: themeColors.text }}>Loading offer images...</p>
        </div>
      ) : filteredOfferImages.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <FaImage className="text-6xl mx-auto mb-4 opacity-30" style={{ color: themeColors.text }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: themeColors.text }}>No Offer Images Found</h3>
          <p className="opacity-70 mb-6" style={{ color: themeColors.text }}>
            {search ? `No offer images match "${search}"` : "Upload your first promotional image"}
          </p>
          <button
            onClick={showCreateModal}
            className="px-6 py-3 rounded-xl inline-flex items-center gap-2"
            style={{ backgroundColor: themeColors.primary, color: 'white' }}
            disabled={actionLoading}
          >
            <FaPlus />
            Upload First Offer Image
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOfferImages.map((offerImage, index) => (
            <div
              key={offerImage?._id || `offer-image-${index}`}
              className="rounded-2xl border overflow-hidden group hover:shadow-lg transition-all"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                opacity: offerImage?.isActive ? 1 : 0.8
              }}
            >
              {/* Image */}
              <div
                className="relative h-48 overflow-hidden cursor-pointer"
                onClick={() => viewOfferImageDetails(offerImage)}
              >
                <img
                  src={offerImage?.imageUrl}
                  alt="Offer"
                  className="w-full h-full object-contain bg-gray-50 group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/400x200?text=No+Image";
                  }}
                />
                <div className="absolute top-2 right-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    offerImage?.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {offerImage?.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className="absolute bottom-2 left-2">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-black bg-opacity-50 text-white">
                    <FaCalendar className="text-xs" />
                    <span>{offerImage?.createdAt ? new Date(offerImage.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Image ID</p>
                    <p className="text-xs font-mono truncate" style={{ color: themeColors.text }}>
                      {offerImage?._id ? offerImage._id.substring(0, 12) + '...' : 'No ID'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Created</p>
                    <p className="text-xs" style={{ color: themeColors.text }}>
                      {offerImage?.createdAt ? new Date(offerImage.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: themeColors.border }}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => viewOfferImageDetails(offerImage)}
                      className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                      style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => showEditModal(offerImage)}
                      className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                      style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}
                      title="Edit Offer Image"
                      disabled={actionLoading}
                    >
                      <FaEdit />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleOfferImageStatus(offerImage)}
                      disabled={actionLoading}
                      className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                      style={{
                        backgroundColor: offerImage?.isActive ? '#F59E0B20' : '#10B98120',
                        color: offerImage?.isActive ? '#F59E0B' : '#10B981'
                      }}
                      title={offerImage?.isActive ? "Deactivate" : "Activate"}
                    >
                      {offerImage?.isActive ? <FaToggleOff /> : <FaToggleOn />}
                    </button>
                    <button
                      onClick={() => handleDelete(offerImage)}
                      disabled={actionLoading}
                      className="p-2 rounded-lg hover:bg-opacity-20 transition-colors text-red-500"
                      style={{ backgroundColor: '#EF444420' }}
                      title="Delete Offer Image"
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
          Showing {filteredOfferImages.length} of {offerImages.length} offer images •
          Sorted by: {sortByDate === "desc" ? "Newest First" : "Oldest First"} •
          Last updated: {lastUpdated ? lastUpdated.toLocaleString() : '—'}
        </p>
      </div>
    </div>
  );
}
