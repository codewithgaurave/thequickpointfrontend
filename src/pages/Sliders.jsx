// src/pages/Sliders.jsx
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
  FaSort,
  FaImage,
  FaLink,
  FaCalendar,
  FaSearch,
  FaSync,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowUp,
  FaArrowDown
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import {
  createSliderAPI,
  getAllSlidersAPI,
  updateSliderAPI,
  updateSliderStatusAPI,
  deleteSliderAPI,
} from "../apis/sliderApi";

const MySwal = withReactContent(Swal);

export default function Sliders() {
  const { themeColors } = useTheme();

  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedSlider, setSelectedSlider] = useState(null);
  const [viewMode, setViewMode] = useState("card"); // "card" | "table"

  // Fetch all sliders
  const fetchSliders = async () => {
    try {
      setLoading(true);
      const res = await getAllSlidersAPI();
      setSliders(res?.data?.sliders || []);
    } catch (err) {
      console.error("Error fetching sliders:", err);
      toast.error("Failed to load sliders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSliders();
  }, []);

  // Filter and sort sliders
  const filteredSliders = sliders
    .filter(slider => {
      const query = search.toLowerCase();
      return (
        slider.title?.toLowerCase().includes(query) ||
        slider.subtitle?.toLowerCase().includes(query) ||
        slider.redirectUrl?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (sortOrder === "asc") {
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      }
      return (b.sortOrder || 0) - (a.sortOrder || 0);
    });

  // Show create slider modal
  const showCreateModal = () => {
    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Create New Slider</div>,
      html: (
        <div className="space-y-4 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Title *</label>
              <input
                id="swal-title"
                type="text"
                className="w-full p-2 rounded-lg border"
                placeholder="Enter slider title"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Subtitle *</label>
              <input
                id="swal-subtitle"
                type="text"
                className="w-full p-2 rounded-lg border"
                placeholder="Enter slider subtitle"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Redirect URL *</label>
            <input
              id="swal-redirectUrl"
              type="url"
              className="w-full p-2 rounded-lg border"
              placeholder="https://example.com/path"
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Sort Order</label>
              <input
                id="swal-sortOrder"
                type="number"
                min="0"
                className="w-full p-2 rounded-lg border"
                placeholder="1"
                defaultValue="1"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
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
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Slider Image *</label>
            <input
              id="swal-sliderImage"
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
                    const img = document.getElementById('image-preview');
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
                id="image-preview"
                alt="Preview"
                className="w-full h-32 object-cover rounded-lg border hidden"
                style={{ borderColor: themeColors.border }}
              />
            </div>
          </div>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: 'Create Slider',
      cancelButtonText: 'Cancel',
      confirmButtonColor: themeColors.primary || '#3B82F6',
      cancelButtonColor: themeColors.border || '#6B7280',
      background: themeColors.background,
      width: '700px',
      preConfirm: async () => {
        const title = document.getElementById('swal-title').value;
        const subtitle = document.getElementById('swal-subtitle').value;
        const redirectUrl = document.getElementById('swal-redirectUrl').value;
        const sortOrder = document.getElementById('swal-sortOrder').value;
        const isActive = document.getElementById('swal-isActive').value === 'true';
        const sliderImage = document.getElementById('swal-sliderImage').files[0];

        // Validation
        if (!title || !subtitle || !redirectUrl || !sliderImage) {
          Swal.showValidationMessage('Please fill all required fields');
          return false;
        }

        if (!sliderImage.type.startsWith('image/')) {
          Swal.showValidationMessage('Please select a valid image file');
          return false;
        }

        try {
          setActionLoading(true);
          const formData = new FormData();
          formData.append('title', title);
          formData.append('subtitle', subtitle);
          formData.append('redirectUrl', redirectUrl);
          formData.append('sortOrder', parseInt(sortOrder));
          formData.append('isActive', isActive);
          formData.append('sliderImage', sliderImage);

          const res = await createSliderAPI(formData);
          return res.data;
        } catch (error) {
          Swal.showValidationMessage(`Creation failed: ${error.response?.data?.message || error.message}`);
          return false;
        } finally {
          setActionLoading(false);
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const newSlider = result.value;
        setSliders(prev => [...prev, newSlider]);
        toast.success('Slider created successfully!');
      }
    });
  };

  // Show edit slider modal
  const showEditModal = (slider) => {
    setSelectedSlider(slider);
    
    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Edit Slider</div>,
      html: (
        <div className="space-y-4 text-left">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: themeColors.text }}>Current Image</label>
            {slider.imageUrl ? (
              <img
                src={slider.imageUrl}
                alt={slider.title}
                className="w-full h-48 object-cover rounded-lg border"
                style={{ borderColor: themeColors.border }}
              />
            ) : (
              <div className="w-full h-48 flex items-center justify-center rounded-lg border" style={{ borderColor: themeColors.border }}>
                <FaImage className="text-4xl opacity-30" style={{ color: themeColors.text }} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Title *</label>
              <input
                id="swal-edit-title"
                type="text"
                className="w-full p-2 rounded-lg border"
                defaultValue={slider.title}
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Subtitle *</label>
              <input
                id="swal-edit-subtitle"
                type="text"
                className="w-full p-2 rounded-lg border"
                defaultValue={slider.subtitle}
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Redirect URL *</label>
            <input
              id="swal-edit-redirectUrl"
              type="url"
              className="w-full p-2 rounded-lg border"
              defaultValue={slider.redirectUrl}
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Sort Order</label>
              <input
                id="swal-edit-sortOrder"
                type="number"
                min="0"
                className="w-full p-2 rounded-lg border"
                defaultValue={slider.sortOrder || 1}
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Status</label>
              <select
                id="swal-edit-isActive"
                className="w-full p-2 rounded-lg border"
                defaultValue={slider.isActive ? "true" : "false"}
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>New Image (Optional)</label>
            <input
              id="swal-edit-sliderImage"
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
                    const img = document.getElementById('edit-image-preview');
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
                id="edit-image-preview"
                alt="Preview"
                className="w-full h-32 object-cover rounded-lg border hidden"
                style={{ borderColor: themeColors.border }}
              />
            </div>
          </div>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: 'Update Slider',
      cancelButtonText: 'Cancel',
      confirmButtonColor: themeColors.primary || '#3B82F6',
      cancelButtonColor: themeColors.border || '#6B7280',
      background: themeColors.background,
      width: '700px',
      preConfirm: async () => {
        const title = document.getElementById('swal-edit-title').value;
        const subtitle = document.getElementById('swal-edit-subtitle').value;
        const redirectUrl = document.getElementById('swal-edit-redirectUrl').value;
        const sortOrder = document.getElementById('swal-edit-sortOrder').value;
        const isActive = document.getElementById('swal-edit-isActive').value === 'true';
        const sliderImage = document.getElementById('swal-edit-sliderImage').files[0];

        // Validation
        if (!title || !subtitle || !redirectUrl) {
          Swal.showValidationMessage('Please fill all required fields');
          return false;
        }

        try {
          setActionLoading(true);
          const formData = new FormData();
          formData.append('title', title);
          formData.append('subtitle', subtitle);
          formData.append('redirectUrl', redirectUrl);
          formData.append('sortOrder', parseInt(sortOrder));
          formData.append('isActive', isActive);
          if (sliderImage) {
            formData.append('sliderImage', sliderImage);
          }

          const res = await updateSliderAPI(slider._id, formData);
          return res.data;
        } catch (error) {
          Swal.showValidationMessage(`Update failed: ${error.response?.data?.message || error.message}`);
          return false;
        } finally {
          setActionLoading(false);
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedSlider = result.value;
        setSliders(prev => prev.map(s => s._id === updatedSlider._id ? updatedSlider : s));
        toast.success('Slider updated successfully!');
      }
    });
  };

  // Toggle slider status
  const toggleSliderStatus = async (slider) => {
    const newStatus = !slider.isActive;
    
    const result = await MySwal.fire({
      title: <div style={{ color: themeColors.text }}>
        {newStatus ? 'Activate Slider' : 'Deactivate Slider'}
      </div>,
      html: <div style={{ color: themeColors.text }}>
        Are you sure you want to {newStatus ? 'activate' : 'deactivate'} slider:
        <div className="my-3 p-3 rounded-lg" style={{ backgroundColor: themeColors.background + '50' }}>
          <p className="font-bold">{slider.title}</p>
          <p className="text-sm opacity-70">{slider.subtitle}</p>
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
        await updateSliderStatusAPI(slider._id, newStatus);
        setSliders(prev => prev.map(s => 
          s._id === slider._id ? { ...s, isActive: newStatus } : s
        ));
        toast.success(`Slider ${newStatus ? 'activated' : 'deactivated'} successfully`);
      } catch (err) {
        console.error("Error updating slider status:", err);
        toast.error("Failed to update slider status");
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Delete slider
  const handleDelete = async (slider) => {
    const result = await MySwal.fire({
      title: <div style={{ color: themeColors.text }}>Delete Slider</div>,
      html: <div style={{ color: themeColors.text }}>
        <div className="text-red-500 text-xl mb-3">
          <FaTrash className="inline mr-2" />
          Warning: This action cannot be undone!
        </div>
        <p>Are you sure you want to delete this slider?</p>
        <div className="my-3 p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
          <img 
            src={slider.imageUrl} 
            alt={slider.title}
            className="w-full h-32 object-cover rounded mb-2"
          />
          <p className="font-bold">{slider.title}</p>
          <p className="text-sm">{slider.subtitle}</p>
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
        await deleteSliderAPI(slider._id);
        setSliders(prev => prev.filter(s => s._id !== slider._id));
        toast.success("Slider deleted successfully");
      } catch (err) {
        console.error("Error deleting slider:", err);
        toast.error("Failed to delete slider");
      } finally {
        setActionLoading(false);
      }
    }
  };

  // View slider details
  const viewSliderDetails = (slider) => {
    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Slider Details</div>,
      html: (
        <div className="text-left space-y-4" style={{ color: themeColors.text }}>
          <div className="mb-4">
            <img 
              src={slider.imageUrl} 
              alt={slider.title}
              className="w-full h-64 object-cover rounded-lg border"
              style={{ borderColor: themeColors.border }}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-70">Title</p>
              <p className="font-bold text-lg">{slider.title}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">Subtitle</p>
              <p className="font-medium">{slider.subtitle}</p>
            </div>
          </div>

          <div>
            <p className="text-sm opacity-70">Redirect URL</p>
            <a 
              href={slider.redirectUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline flex items-center gap-1"
            >
              <FaLink className="text-sm" />
              {slider.redirectUrl}
            </a>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm opacity-70">Sort Order</p>
              <p className="font-bold text-xl">{slider.sortOrder || 0}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">Status</p>
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                slider.isActive 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }`}>
                {slider.isActive ? <FaCheckCircle /> : <FaTimesCircle />}
                {slider.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div>
              <p className="text-sm opacity-70">Created</p>
              <p className="text-sm">{new Date(slider.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {slider._id && (
            <div className="text-xs opacity-70 border-t pt-2" style={{ borderColor: themeColors.border }}>
              <p>Slider ID: {slider._id}</p>
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
    total: sliders.length,
    active: sliders.filter(s => s.isActive).length,
    inactive: sliders.filter(s => !s.isActive).length,
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: themeColors.text }}>
            Slider Management
          </h2>
          <p className="text-sm opacity-75 mt-1" style={{ color: themeColors.text }}>
            Manage homepage banners and promotional sliders
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" style={{ color: themeColors.text }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sliders..."
              className="pl-10 pr-4 py-2 rounded-xl border w-full md:w-64"
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text,
              }}
            />
          </div>

          {/* View Toggle Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("card")}
              className={`px-3 py-2 rounded-lg border flex items-center gap-2 ${
                viewMode === "card" ? "bg-blue-600 text-white" : ""
              }`}
              title="Card View"
              style={{
                borderColor: themeColors.border,
                backgroundColor: viewMode === "card" ? undefined : themeColors.background,
                color: viewMode === "card" ? undefined : themeColors.text
              }}
            >
              <FaImage />
              <span className="hidden md:inline">Card</span>
            </button>

            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-2 rounded-lg border flex items-center gap-2 ${
                viewMode === "table" ? "bg-blue-600 text-white" : ""
              }`}
              title="Table View"
              style={{
                borderColor: themeColors.border,
                backgroundColor: viewMode === "table" ? undefined : themeColors.background,
                color: viewMode === "table" ? undefined : themeColors.text
              }}
            >
              <FaSort />
              <span className="hidden md:inline">Table</span>
            </button>
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="p-2 rounded-xl border flex items-center gap-2"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text,
            }}
            title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
          >
            <FaSort />
            <span className="hidden md:inline">Sort</span>
            {sortOrder === "asc" ? <FaArrowDown /> : <FaArrowUp />}
          </button>
          
          <button
            onClick={fetchSliders}
            className="p-2 rounded-xl border flex items-center gap-2"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text,
            }}
            title="Refresh"
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
          >
            <FaPlus />
            <span className="hidden md:inline">New Slider</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Total Sliders</p>
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
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Active Sliders</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{stats.active}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#10B98120', color: '#10B981' }}>
              <FaToggleOn size={24} />
            </div>
          </div>
        </div>
        
        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Inactive Sliders</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{stats.inactive}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}>
              <FaToggleOff size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Sliders Grid or Table */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: themeColors.primary }}></div>
          <p className="mt-2 opacity-70" style={{ color: themeColors.text }}>Loading sliders...</p>
        </div>
      ) : filteredSliders.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <FaImage className="text-6xl mx-auto mb-4 opacity-30" style={{ color: themeColors.text }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: themeColors.text }}>No Sliders Found</h3>
          <p className="opacity-70 mb-6" style={{ color: themeColors.text }}>
            {search ? `No sliders match "${search}"` : "Get started by creating your first slider"}
          </p>
          <button
            onClick={showCreateModal}
            className="px-6 py-3 rounded-xl inline-flex items-center gap-2"
            style={{ backgroundColor: themeColors.primary, color: 'white' }}
          >
            <FaPlus />
            Create First Slider
          </button>
        </div>
      ) : (
        <>
          {viewMode === "table" ? (
            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: themeColors.border }}>
              <table className="min-w-full text-left">
                <thead style={{ background: themeColors.surface }}>
                  <tr>
                    <th className="p-3 border-b">Image</th>
                    <th className="p-3 border-b">Title</th>
                    <th className="p-3 border-b">Subtitle</th>
                    <th className="p-3 border-b">Redirect URL</th>
                    <th className="p-3 border-b">Order</th>
                    <th className="p-3 border-b">Status</th>
                    <th className="p-3 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSliders.map((slider) => (
                    <tr key={slider._id} className="border-b">
                      <td className="p-3 align-middle">
                        <img src={slider.imageUrl} className="w-28 h-16 object-cover rounded" alt={slider.title} />
                      </td>
                      <td className="p-3 align-middle" style={{ color: themeColors.text }}>{slider.title}</td>
                      <td className="p-3 align-middle" style={{ color: themeColors.text }}>{slider.subtitle}</td>
                      <td className="p-3 align-middle truncate max-w-[200px]" style={{ color: themeColors.text }}>
                        <a href={slider.redirectUrl} target="_blank" rel="noreferrer" className="underline">
                          {slider.redirectUrl}
                        </a>
                      </td>
                      <td className="p-3 align-middle" style={{ color: themeColors.text }}>{slider.sortOrder}</td>
                      <td className="p-3 align-middle">
                        {slider.isActive ? (
                          <span className="text-green-600 font-bold">Active</span>
                        ) : (
                          <span className="text-red-600 font-bold">Inactive</span>
                        )}
                      </td>
                      <td className="p-3 align-middle">
                        <div className="flex items-center gap-2">
                          <button onClick={() => viewSliderDetails(slider)} className="p-2 rounded bg-blue-100 text-blue-600" title="View">
                            <FaEye />
                          </button>
                          <button onClick={() => showEditModal(slider)} className="p-2 rounded bg-yellow-100 text-yellow-600" title="Edit">
                            <FaEdit />
                          </button>
                          <button onClick={() => toggleSliderStatus(slider)} disabled={actionLoading} className="p-2 rounded bg-green-100 text-green-600" title={slider.isActive ? "Deactivate" : "Activate"}>
                            {slider.isActive ? <FaToggleOff /> : <FaToggleOn />}
                          </button>
                          <button onClick={() => handleDelete(slider)} disabled={actionLoading} className="p-2 rounded bg-red-100 text-red-600" title="Delete">
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSliders.map((slider) => (
                <div 
                  key={slider._id} 
                  className="rounded-2xl border overflow-hidden group hover:shadow-lg transition-all"
                  style={{ 
                    backgroundColor: themeColors.surface, 
                    borderColor: themeColors.border,
                    opacity: slider.isActive ? 1 : 0.8
                  }}
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={slider.imageUrl}
                      alt={slider.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        slider.isActive 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {slider.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <div className="absolute top-2 left-2">
                      <div className="px-2 py-1 rounded-full text-xs font-medium bg-black bg-opacity-50 text-white">
                        Order: {slider.sortOrder || 0}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-lg truncate" style={{ color: themeColors.text }}>
                        {slider.title}
                      </h3>
                      <p className="text-sm opacity-80 truncate" style={{ color: themeColors.text }}>
                        {slider.subtitle}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 opacity-70" style={{ color: themeColors.text }}>
                        <FaLink className="text-xs" />
                        <span className="truncate max-w-[150px]">{slider.redirectUrl}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-70" style={{ color: themeColors.text }}>
                        <FaCalendar className="text-xs" />
                        <span>{new Date(slider.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: themeColors.border }}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewSliderDetails(slider)}
                          className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                          style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => showEditModal(slider)}
                          className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                          style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}
                          title="Edit Slider"
                        >
                          <FaEdit />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleSliderStatus(slider)}
                          disabled={actionLoading}
                          className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                          style={{ 
                            backgroundColor: slider.isActive ? '#F59E0B20' : '#10B98120', 
                            color: slider.isActive ? '#F59E0B' : '#10B981' 
                          }}
                          title={slider.isActive ? "Deactivate" : "Activate"}
                        >
                          {slider.isActive ? <FaToggleOff /> : <FaToggleOn />}
                        </button>
                        <button
                          onClick={() => handleDelete(slider)}
                          disabled={actionLoading}
                          className="p-2 rounded-lg hover:bg-opacity-20 transition-colors text-red-500"
                          style={{ backgroundColor: '#EF444420' }}
                          title="Delete Slider"
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
        </>
      )}

      {/* Footer Info */}
      <div className="text-center text-sm opacity-70" style={{ color: themeColors.text }}>
        <p>
          Showing {filteredSliders.length} of {sliders.length} sliders • 
          Sort Order: {sortOrder === "asc" ? "Ascending" : "Descending"} • 
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
