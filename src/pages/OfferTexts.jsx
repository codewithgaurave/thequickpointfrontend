// src/pages/OfferTexts.jsx
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
  FaCalendar,
  FaSortAmountDown,
  FaSortAmountUp,
  FaTag,
  FaFont,
  FaCopy,
  FaClipboard,
  FaTextHeight
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import {
  createOfferTextAPI,
  getAllOfferTextsAPI,
  updateOfferTextAPI,
  updateOfferTextStatusAPI,
  deleteOfferTextAPI,
} from "../apis/offerTextApi";

const MySwal = withReactContent(Swal);

export default function OfferTexts() {
  const { themeColors } = useTheme();

  const [offerTexts, setOfferTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortByDate, setSortByDate] = useState("desc");
  const [actionLoading, setActionLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch all offer texts
  const fetchOfferTexts = async () => {
    try {
      setLoading(true);
      const res = await getAllOfferTextsAPI();
      setOfferTexts(res?.data?.offerTexts || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching offer texts:", err);
      toast.error("Failed to load offer texts");
      setOfferTexts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfferTexts();
  }, []);

  // Filter and sort offer texts
  const filteredOfferTexts = (offerTexts || [])
    .filter(offerText => {
      if (!offerText) return false;
      const query = search.toLowerCase();
      return (
        (offerText._id && offerText._id.toLowerCase().includes(query)) ||
        (offerText.text && offerText.text.toLowerCase().includes(query)) ||
        (offerText.isActive ? "active" : "inactive").includes(query)
      );
    })
    .sort((a, b) => {
      if (!a || !b) return 0;
      if (sortByDate === "desc") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    });

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied to clipboard!");
    }).catch(err => {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy text");
    });
  };

  // Show create offer text modal
  const showCreateModal = () => {
    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Create Offer Text</div>,
      html: (
        <div className="space-y-4 text-left">
          <div className="mb-4">
            <p className="text-sm opacity-70 mb-2" style={{ color: themeColors.text }}>
              Create promotional text for offers, banners, or advertisements
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
              Offer Text *
            </label>
            <textarea
              id="swal-text"
              className="w-full p-3 rounded-lg border min-h-[120px]"
              placeholder="Enter your promotional text here..."
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
              maxLength={500}
            />
            <div className="text-xs opacity-70 mt-1 text-right">
              <span id="char-count">0</span>/500 characters
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
            <p className="font-medium mb-1">Tips for effective offer texts:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Keep it short and impactful</li>
              <li>Include clear call-to-action</li>
              <li>Highlight discounts or benefits</li>
              <li>Use attention-grabbing words</li>
            </ul>
          </div>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: 'Create Offer Text',
      cancelButtonText: 'Cancel',
      confirmButtonColor: themeColors.primary || '#3B82F6',
      cancelButtonColor: themeColors.border || '#6B7280',
      background: themeColors.background,
      width: '600px',
      didOpen: () => {
        const textarea = document.getElementById('swal-text');
        const charCount = document.getElementById('char-count');
        if (textarea && charCount) {
          charCount.textContent = textarea.value.length;
          textarea.addEventListener('input', () => {
            charCount.textContent = textarea.value.length;
          });
        }
      },
      preConfirm: async () => {
        const text = document.getElementById('swal-text').value.trim();
        const isActive = document.getElementById('swal-isActive').value === 'true';

        // Validation
        if (!text) {
          Swal.showValidationMessage('Please enter offer text');
          return false;
        }

        if (text.length < 5) {
          Swal.showValidationMessage('Offer text should be at least 5 characters');
          return false;
        }

        if (text.length > 500) {
          Swal.showValidationMessage('Offer text should not exceed 500 characters');
          return false;
        }

        try {
          setActionLoading(true);
          const payload = { text, isActive };
          const res = await createOfferTextAPI(payload);
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
        await fetchOfferTexts();
        toast.success('Offer text created successfully!');
      }
    });
  };

  // Show edit offer text modal
  const showEditModal = (offerText) => {
    if (!offerText) return;

    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Edit Offer Text</div>,
      html: (
        <div className="space-y-4 text-left">
          <div className="mb-4">
            <p className="text-sm opacity-70 mb-2" style={{ color: themeColors.text }}>
              Current text: <span className="font-medium italic">"{offerText?.text}"</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
              New Offer Text *
            </label>
            <textarea
              id="swal-edit-text"
              className="w-full p-3 rounded-lg border min-h-[120px]"
              defaultValue={offerText?.text || ''}
              placeholder="Enter your promotional text here..."
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
              maxLength={500}
            />
            <div className="text-xs opacity-70 mt-1 text-right">
              <span id="edit-char-count">{offerText?.text?.length || 0}</span>/500 characters
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Status</label>
            <select
              id="swal-edit-isActive"
              className="w-full p-2 rounded-lg border"
              defaultValue={offerText?.isActive ? "true" : "false"}
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
      confirmButtonText: 'Update Offer Text',
      cancelButtonText: 'Cancel',
      confirmButtonColor: themeColors.primary || '#3B82F6',
      cancelButtonColor: themeColors.border || '#6B7280',
      background: themeColors.background,
      width: '600px',
      didOpen: () => {
        const textarea = document.getElementById('swal-edit-text');
        const charCount = document.getElementById('edit-char-count');
        if (textarea && charCount) {
          charCount.textContent = textarea.value.length;
          textarea.addEventListener('input', () => {
            charCount.textContent = textarea.value.length;
          });
        }
      },
      preConfirm: async () => {
        const text = document.getElementById('swal-edit-text').value.trim();
        const isActive = document.getElementById('swal-edit-isActive').value === 'true';

        // Validation
        if (!text) {
          Swal.showValidationMessage('Please enter offer text');
          return false;
        }

        if (text.length < 5) {
          Swal.showValidationMessage('Offer text should be at least 5 characters');
          return false;
        }

        if (text.length > 500) {
          Swal.showValidationMessage('Offer text should not exceed 500 characters');
          return false;
        }

        try {
          setActionLoading(true);
          const payload = { text, isActive };
          const res = await updateOfferTextAPI(offerText?._id, payload);
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
        await fetchOfferTexts();
        toast.success('Offer text updated successfully!');
      }
    });
  };

  // Toggle offer text status
  const toggleOfferTextStatus = async (offerText) => {
    if (!offerText) return;

    const newStatus = !offerText.isActive;

    const result = await MySwal.fire({
      title: <div style={{ color: themeColors.text }}>
        {newStatus ? 'Activate Offer Text' : 'Deactivate Offer Text'}
      </div>,
      html: <div style={{ color: themeColors.text }}>
        Are you sure you want to {newStatus ? 'activate' : 'deactivate'} this offer text?
        <div className="my-3 p-3 rounded-lg border bg-yellow-50" style={{ borderColor: themeColors.border }}>
          <p className="font-medium">"{offerText?.text}"</p>
        </div>
        <p className="text-sm opacity-70">
          {newStatus ? 'This text will become visible to users.' : 'This text will be hidden from users.'}
        </p>
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
        await updateOfferTextStatusAPI(offerText?._id, newStatus);
        await fetchOfferTexts();
        toast.success(`Offer text ${newStatus ? 'activated' : 'deactivated'} successfully`);
      } catch (err) {
        console.error("Error updating offer text status:", err);
        toast.error("Failed to update offer text status");
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Delete offer text
  const handleDelete = async (offerText) => {
    if (!offerText) return;

    const result = await MySwal.fire({
      title: <div style={{ color: themeColors.text }}>Delete Offer Text</div>,
      html: <div style={{ color: themeColors.text }}>
        <div className="text-red-500 text-xl mb-3">
          <FaTrash className="inline mr-2" />
          Warning: This action cannot be undone!
        </div>
        <p>Are you sure you want to delete this offer text?</p>
        <div className="my-3 p-3 rounded-lg border bg-red-50" style={{ borderColor: themeColors.border }}>
          <p className="font-medium text-lg">"{offerText?.text}"</p>
          <div className="mt-2 text-center">
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
              offerText?.isActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}>
              {offerText?.isActive ? <FaCheckCircle /> : <FaTimesCircle />}
              {offerText?.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
        <p className="text-sm opacity-70">This will permanently remove this promotional text.</p>
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
        await deleteOfferTextAPI(offerText?._id);
        await fetchOfferTexts();
        toast.success("Offer text deleted successfully");
      } catch (err) {
        console.error("Error deleting offer text:", err);
        toast.error("Failed to delete offer text");
      } finally {
        setActionLoading(false);
      }
    }
  };

  // View offer text details
  const viewOfferTextDetails = (offerText) => {
    if (!offerText) return;

    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Offer Text Details</div>,
      html: (
        <div className="text-left space-y-4" style={{ color: themeColors.text }}>
          <div className="mb-4">
            <div className="p-4 rounded-lg border bg-blue-50" style={{ borderColor: themeColors.border }}>
              <div className="flex items-start justify-between gap-2">
                <FaTextHeight className="mt-1 text-blue-500" />
                <p className="text-lg font-semibold flex-1 text-center">"{offerText?.text}"</p>
                <button
                  onClick={() => copyToClipboard(offerText?.text)}
                  className="p-2 rounded-lg hover:bg-blue-100 transition-colors"
                  title="Copy to clipboard"
                >
                  <FaClipboard className="text-blue-500" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-70">Status</p>
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                offerText?.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}>
                {offerText?.isActive ? <FaCheckCircle /> : <FaTimesCircle />}
                {offerText?.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div>
              <p className="text-sm opacity-70">Created</p>
              <p className="font-medium">
                {offerText?.createdAt ? new Date(offerText.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-70">Last Updated</p>
              <p className="font-medium">
                {offerText?.updatedAt ? new Date(offerText.updatedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-70">Length</p>
              <p className="font-medium">
                {offerText?.text?.length || 0} characters
              </p>
            </div>
          </div>

          {offerText?._id && (
            <div className="text-xs opacity-70 border-t pt-2" style={{ borderColor: themeColors.border }}>
              <div className="flex items-center justify-between">
                <p>ID: {offerText._id.substring(0, 20)}...</p>
                <button
                  onClick={() => copyToClipboard(offerText._id)}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                  title="Copy ID"
                >
                  <FaCopy className="text-xs" />
                </button>
              </div>
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
    total: offerTexts?.length || 0,
    active: (offerTexts || []).filter(o => o?.isActive).length,
    inactive: (offerTexts || []).filter(o => !o?.isActive).length,
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: themeColors.text }}>
            Offer Texts
          </h2>
          <p className="text-sm opacity-75 mt-1" style={{ color: themeColors.text }}>
            Manage promotional text content for offers and banners
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" style={{ color: themeColors.text }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search offer texts..."
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
            onClick={fetchOfferTexts}
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
            <span className="hidden md:inline">New Offer Text</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Total Texts</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{stats.total}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}>
              <FaFont size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Active Texts</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{stats.active}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#10B98120', color: '#10B981' }}>
              <FaTag size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Inactive Texts</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{stats.inactive}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}>
              <FaTimesCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Offer Texts List */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: themeColors.primary }}></div>
          <p className="mt-2 opacity-70" style={{ color: themeColors.text }}>Loading offer texts...</p>
        </div>
      ) : filteredOfferTexts.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <FaFont className="text-6xl mx-auto mb-4 opacity-30" style={{ color: themeColors.text }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: themeColors.text }}>No Offer Texts Found</h3>
          <p className="opacity-70 mb-6" style={{ color: themeColors.text }}>
            {search ? `No offer texts match "${search}"` : "Create your first promotional text"}
          </p>
          <button
            onClick={showCreateModal}
            className="px-6 py-3 rounded-xl inline-flex items-center gap-2"
            style={{ backgroundColor: themeColors.primary, color: 'white' }}
            disabled={actionLoading}
          >
            <FaPlus />
            Create First Offer Text
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOfferTexts.map((offerText, index) => (
            <div
              key={offerText?._id || `offer-text-${index}`}
              className="rounded-2xl border p-4 group hover:shadow-lg transition-all"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                opacity: offerText?.isActive ? 1 : 0.8
              }}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                {/* Text Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <p className="text-lg font-semibold mb-2" style={{ color: themeColors.text }}>
                        "{offerText?.text}"
                      </p>
                      <div className="flex items-center gap-4 text-sm opacity-70">
                        <div className="flex items-center gap-1">
                          <FaCalendar className="text-xs" />
                          <span>{offerText?.createdAt ? new Date(offerText.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          offerText?.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {offerText?.isActive ? <FaCheckCircle /> : <FaTimesCircle />}
                          {offerText?.isActive ? 'Active' : 'Inactive'}
                        </div>
                        <div className="text-xs">
                          {offerText?.text?.length || 0} chars
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(offerText?.text)}
                      className="p-2 rounded-lg hover:bg-opacity-20 transition-colors flex-shrink-0"
                      style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}
                      title="Copy text"
                    >
                      <FaCopy />
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => viewOfferTextDetails(offerText)}
                    className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                    style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}
                    title="View Details"
                  >
                    <FaEye />
                  </button>
                  <button
                    onClick={() => showEditModal(offerText)}
                    className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                    style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}
                    title="Edit Offer Text"
                    disabled={actionLoading}
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => toggleOfferTextStatus(offerText)}
                    disabled={actionLoading}
                    className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                    style={{
                      backgroundColor: offerText?.isActive ? '#F59E0B20' : '#10B98120',
                      color: offerText?.isActive ? '#F59E0B' : '#10B981'
                    }}
                    title={offerText?.isActive ? "Deactivate" : "Activate"}
                  >
                    {offerText?.isActive ? <FaToggleOff /> : <FaToggleOn />}
                  </button>
                  <button
                    onClick={() => handleDelete(offerText)}
                    disabled={actionLoading}
                    className="p-2 rounded-lg hover:bg-opacity-20 transition-colors text-red-500"
                    style={{ backgroundColor: '#EF444420' }}
                    title="Delete Offer Text"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              {/* ID */}
              {offerText?._id && (
                <div className="text-xs opacity-70 mt-3 pt-3 border-t" style={{ borderColor: themeColors.border }}>
                  <div className="flex items-center justify-between">
                    <p className="font-mono truncate">ID: {offerText._id}</p>
                    <button
                      onClick={() => copyToClipboard(offerText._id)}
                      className="p-1 rounded hover:bg-gray-100 transition-colors"
                      title="Copy ID"
                    >
                      <FaClipboard className="text-xs" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer Info */}
      <div className="text-center text-sm opacity-70" style={{ color: themeColors.text }}>
        <p>
          Showing {filteredOfferTexts.length} of {offerTexts.length} offer texts •
          Sorted by: {sortByDate === "desc" ? "Newest First" : "Oldest First"} •
          Last updated: {lastUpdated ? lastUpdated.toLocaleString() : '—'}
        </p>
      </div>
    </div>
  );
}