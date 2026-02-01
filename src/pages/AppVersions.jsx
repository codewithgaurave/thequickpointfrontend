// src/pages/AppVersions.jsx
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
  FaDownload,
  FaCalendar,
  FaSortAmountDown,
  FaSortAmountUp,
  FaMobile,
  FaApple,
  FaAndroid,
  FaCopy,
  FaExclamationTriangle,
  FaCode,
  FaTag,
  FaGlobe
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import {
  createVersionAPI,
  getAllVersionsAPI,
  updateVersionAPI,
  deleteVersionAPI,
  getLatestVersionAPI,
  checkUpdateAPI
} from "../apis/appVersionApi";

const MySwal = withReactContent(Swal);

export default function AppVersions() {
  const { themeColors } = useTheme();

  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortByDate, setSortByDate] = useState("desc");
  const [actionLoading, setActionLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [platformFilter, setPlatformFilter] = useState("all");

  // Fetch all versions
  const fetchVersions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (platformFilter !== "all") {
        params.platform = platformFilter;
      }
      const res = await getAllVersionsAPI(params);
      setVersions(res?.data?.data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching versions:", err);
      toast.error("Failed to load versions");
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [platformFilter]);

  // Filter and sort versions
  const filteredVersions = (versions || [])
    .filter(version => {
      if (!version) return false;
      const query = search.toLowerCase();
      return (
        (version._id && version._id.toLowerCase().includes(query)) ||
        (version.versionName && version.versionName.toLowerCase().includes(query)) ||
        (version.versionCode && version.versionCode.toString().includes(query)) ||
        (version.platform && version.platform.toLowerCase().includes(query)) ||
        (version.releaseNotes && version.releaseNotes.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      if (!a || !b) return 0;
      if (sortByDate === "desc") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    });

  // Show create version modal
  const showCreateModal = () => {
    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Create New Version</div>,
      html: (
        <div className="space-y-4 text-left">
          <div className="mb-4">
            <p className="text-sm opacity-70 mb-2" style={{ color: themeColors.text }}>
              Create a new app version for deployment
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Version Code *
              </label>
              <input
                id="swal-versionCode"
                type="number"
                className="w-full p-2 rounded-lg border"
                placeholder="e.g., 107"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Version Name *
              </label>
              <input
                id="swal-versionName"
                type="text"
                className="w-full p-2 rounded-lg border"
                placeholder="e.g., 1.0.7"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Platform</label>
            <select
              id="swal-platform"
              className="w-full p-2 rounded-lg border"
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
              defaultValue="both"
            >
              <option value="both">Both (Android & iOS)</option>
              <option value="android">Android Only</option>
              <option value="ios">iOS Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
              Download URL
            </label>
            <input
              id="swal-downloadUrl"
              type="url"
              className="w-full p-2 rounded-lg border"
              placeholder="https://play.google.com/store/apps/details?id=com.quickpoint"
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
              Release Notes
            </label>
            <textarea
              id="swal-releaseNotes"
              className="w-full p-2 rounded-lg border h-20"
              placeholder="Bug fixes and performance improvements"
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="swal-isForceUpdate"
              type="checkbox"
              className="rounded"
            />
            <label htmlFor="swal-isForceUpdate" className="text-sm" style={{ color: themeColors.text }}>
              Force Update (Users must update to continue)
            </label>
          </div>

          <div className="text-xs opacity-70 p-3 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background + '50' }}>
            <p className="font-medium mb-1">Version Code Guidelines:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Version 1.0.0 = Code 100</li>
              <li>Version 1.0.1 = Code 101</li>
              <li>Version 1.1.0 = Code 110</li>
              <li>Version 2.0.0 = Code 200</li>
            </ul>
          </div>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: 'Create Version',
      cancelButtonText: 'Cancel',
      confirmButtonColor: themeColors.primary || '#3B82F6',
      cancelButtonColor: themeColors.border || '#6B7280',
      background: themeColors.background,
      width: '600px',
      preConfirm: async () => {
        const versionCode = parseInt(document.getElementById('swal-versionCode').value);
        const versionName = document.getElementById('swal-versionName').value.trim();
        const platform = document.getElementById('swal-platform').value;
        const downloadUrl = document.getElementById('swal-downloadUrl').value.trim();
        const releaseNotes = document.getElementById('swal-releaseNotes').value.trim();
        const isForceUpdate = document.getElementById('swal-isForceUpdate').checked;

        // Validation
        if (!versionCode || versionCode < 1) {
          Swal.showValidationMessage('Please enter a valid version code');
          return false;
        }

        if (!versionName) {
          Swal.showValidationMessage('Please enter version name');
          return false;
        }

        try {
          setActionLoading(true);
          const versionData = {
            versionCode,
            versionName,
            platform,
            isForceUpdate,
            ...(downloadUrl && { downloadUrl }),
            ...(releaseNotes && { releaseNotes })
          };

          const res = await createVersionAPI(versionData);
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
        await fetchVersions();
        toast.success('Version created successfully!');
      }
    });
  };

  // Show edit version modal
  const showEditModal = (version) => {
    if (!version) return;

    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Edit Version</div>,
      html: (
        <div className="space-y-4 text-left">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Version Code *
              </label>
              <input
                id="swal-edit-versionCode"
                type="number"
                className="w-full p-2 rounded-lg border"
                defaultValue={version?.versionCode || ''}
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Version Name *
              </label>
              <input
                id="swal-edit-versionName"
                type="text"
                className="w-full p-2 rounded-lg border"
                defaultValue={version?.versionName || ''}
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Platform</label>
            <select
              id="swal-edit-platform"
              className="w-full p-2 rounded-lg border"
              defaultValue={version?.platform || 'both'}
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
            >
              <option value="both">Both (Android & iOS)</option>
              <option value="android">Android Only</option>
              <option value="ios">iOS Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
              Download URL
            </label>
            <input
              id="swal-edit-downloadUrl"
              type="url"
              className="w-full p-2 rounded-lg border"
              defaultValue={version?.downloadUrl || ''}
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
              Release Notes
            </label>
            <textarea
              id="swal-edit-releaseNotes"
              className="w-full p-2 rounded-lg border h-20"
              defaultValue={version?.releaseNotes || ''}
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="swal-edit-isForceUpdate"
              type="checkbox"
              className="rounded"
              defaultChecked={version?.isForceUpdate || false}
            />
            <label htmlFor="swal-edit-isForceUpdate" className="text-sm" style={{ color: themeColors.text }}>
              Force Update (Users must update to continue)
            </label>
          </div>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: 'Update Version',
      cancelButtonText: 'Cancel',
      confirmButtonColor: themeColors.primary || '#3B82F6',
      cancelButtonColor: themeColors.border || '#6B7280',
      background: themeColors.background,
      width: '600px',
      preConfirm: async () => {
        const versionCode = parseInt(document.getElementById('swal-edit-versionCode').value);
        const versionName = document.getElementById('swal-edit-versionName').value.trim();
        const platform = document.getElementById('swal-edit-platform').value;
        const downloadUrl = document.getElementById('swal-edit-downloadUrl').value.trim();
        const releaseNotes = document.getElementById('swal-edit-releaseNotes').value.trim();
        const isForceUpdate = document.getElementById('swal-edit-isForceUpdate').checked;

        // Validation
        if (!versionCode || versionCode < 1) {
          Swal.showValidationMessage('Please enter a valid version code');
          return false;
        }

        if (!versionName) {
          Swal.showValidationMessage('Please enter version name');
          return false;
        }

        try {
          setActionLoading(true);
          const versionData = {
            versionCode,
            versionName,
            platform,
            isForceUpdate,
            ...(downloadUrl && { downloadUrl }),
            ...(releaseNotes && { releaseNotes })
          };

          const res = await updateVersionAPI(version?._id, versionData);
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
        await fetchVersions();
        toast.success('Version updated successfully!');
      }
    });
  };

  // Delete version
  const handleDelete = async (version) => {
    if (!version) return;

    const result = await MySwal.fire({
      title: <div style={{ color: themeColors.text }}>Delete Version</div>,
      html: <div style={{ color: themeColors.text }}>
        <div className="text-red-500 text-xl mb-3">
          <FaTrash className="inline mr-2" />
          Warning: This action cannot be undone!
        </div>
        <p>Are you sure you want to delete this version?</p>
        <div className="my-3 p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="font-bold text-xl">{version?.versionName} (Code: {version?.versionCode})</p>
              <div className="flex items-center gap-2 mt-2">
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                  version?.isForceUpdate
                    ? "bg-red-100 text-red-800"
                    : "bg-green-100 text-green-800"
                }`}>
                  {version?.isForceUpdate ? <FaExclamationTriangle /> : <FaCheckCircle />}
                  {version?.isForceUpdate ? 'Force Update' : 'Optional Update'}
                </div>
                <div className="text-xs opacity-70">
                  Platform: {version?.platform}
                </div>
              </div>
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
        await deleteVersionAPI(version?._id);
        await fetchVersions();
        toast.success("Version deleted successfully");
      } catch (err) {
        console.error("Error deleting version:", err);
        toast.error("Failed to delete version");
      } finally {
        setActionLoading(false);
      }
    }
  };

  // View version details
  const viewVersionDetails = (version) => {
    if (!version) return;

    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Version Details</div>,
      html: (
        <div className="text-left space-y-4" style={{ color: themeColors.text }}>
          <div className="text-center mb-4">
            <h3 className="text-2xl font-bold">{version?.versionName}</h3>
            <p className="text-lg opacity-70">Code: {version?.versionCode}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-70">Platform</p>
              <div className="flex items-center gap-2">
                {version?.platform === 'android' && <FaAndroid className="text-green-500" />}
                {version?.platform === 'ios' && <FaApple className="text-gray-600" />}
                {version?.platform === 'both' && (
                  <>
                    <FaAndroid className="text-green-500" />
                    <FaApple className="text-gray-600" />
                  </>
                )}
                <span className="capitalize">{version?.platform}</span>
              </div>
            </div>
            <div>
              <p className="text-sm opacity-70">Update Type</p>
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                version?.isForceUpdate
                  ? "bg-red-100 text-red-800"
                  : "bg-green-100 text-green-800"
              }`}>
                {version?.isForceUpdate ? <FaExclamationTriangle /> : <FaCheckCircle />}
                {version?.isForceUpdate ? 'Force Update' : 'Optional'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-70">Created</p>
              <p className="font-medium">
                {version?.createdAt ? new Date(version.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-70">Last Updated</p>
              <p className="font-medium">
                {version?.updatedAt ? new Date(version.updatedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          {version?.downloadUrl && (
            <div>
              <p className="text-sm opacity-70">Download URL</p>
              <a
                href={version.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline text-sm break-all"
              >
                {version.downloadUrl}
              </a>
            </div>
          )}

          {version?.releaseNotes && (
            <div>
              <p className="text-sm opacity-70">Release Notes</p>
              <p className="text-sm bg-gray-50 p-3 rounded-lg">{version.releaseNotes}</p>
            </div>
          )}

          <div>
            <p className="text-sm opacity-70">Version ID</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm truncate">{version?._id}</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(version?._id).then(() => {
                    toast.success("Version ID copied!");
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

  // Get platform icon
  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'android':
        return <FaAndroid className="text-green-500" />;
      case 'ios':
        return <FaApple className="text-gray-600" />;
      case 'both':
        return (
          <div className="flex items-center gap-1">
            <FaAndroid className="text-green-500" />
            <FaApple className="text-gray-600" />
          </div>
        );
      default:
        return <FaMobile />;
    }
  };

  // Stats
  const stats = {
    total: versions?.length || 0,
    forceUpdate: (versions || []).filter(v => v?.isForceUpdate).length,
    android: (versions || []).filter(v => v?.platform === 'android' || v?.platform === 'both').length,
    ios: (versions || []).filter(v => v?.platform === 'ios' || v?.platform === 'both').length,
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: themeColors.text }}>
            App Versions
          </h2>
          <p className="text-sm opacity-75 mt-1" style={{ color: themeColors.text }}>
            Manage app version releases and updates
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" style={{ color: themeColors.text }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search versions..."
              className="pl-10 pr-4 py-2 rounded-xl border w-full md:w-64"
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text,
              }}
            />
          </div>

          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text,
            }}
          >
            <option value="all">All Platforms</option>
            <option value="android">Android</option>
            <option value="ios">iOS</option>
            <option value="both">Both</option>
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
            onClick={fetchVersions}
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
            <span className="hidden md:inline">New Version</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Total Versions</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{stats.total}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}>
              <FaCode size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Force Updates</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{stats.forceUpdate}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#EF444420', color: '#EF4444' }}>
              <FaExclamationTriangle size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Android Versions</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{stats.android}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#10B98120', color: '#10B981' }}>
              <FaAndroid size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>iOS Versions</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{stats.ios}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#6B728020', color: '#6B7280' }}>
              <FaApple size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Versions List */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: themeColors.primary }}></div>
          <p className="mt-2 opacity-70" style={{ color: themeColors.text }}>Loading versions...</p>
        </div>
      ) : filteredVersions.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <FaCode className="text-6xl mx-auto mb-4 opacity-30" style={{ color: themeColors.text }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: themeColors.text }}>No Versions Found</h3>
          <p className="opacity-70 mb-6" style={{ color: themeColors.text }}>
            {search ? `No versions match "${search}"` : "Create your first app version"}
          </p>
          <button
            onClick={showCreateModal}
            className="px-6 py-3 rounded-xl inline-flex items-center gap-2"
            style={{ backgroundColor: themeColors.primary, color: 'white' }}
            disabled={actionLoading}
          >
            <FaPlus />
            Create First Version
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVersions.map((version, index) => (
            <div
              key={version?._id || `version-${index}`}
              className="rounded-2xl border p-6 hover:shadow-lg transition-all"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getPlatformIcon(version?.platform)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold" style={{ color: themeColors.text }}>
                        {version?.versionName}
                      </h3>
                      <span className="text-sm opacity-70" style={{ color: themeColors.text }}>
                        Code: {version?.versionCode}
                      </span>
                      {version?.isForceUpdate && (
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                          <FaExclamationTriangle />
                          Force Update
                        </div>
                      )}
                    </div>
                    <p className="text-sm opacity-70 mt-1" style={{ color: themeColors.text }}>
                      Platform: <span className="capitalize">{version?.platform}</span> • 
                      Created: {version?.createdAt ? new Date(version.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                    {version?.releaseNotes && (
                      <p className="text-sm mt-2 p-2 rounded-lg" style={{ backgroundColor: themeColors.background, color: themeColors.text }}>
                        {version.releaseNotes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => viewVersionDetails(version)}
                    className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                    style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}
                    title="View Details"
                  >
                    <FaEye />
                  </button>
                  {version?.downloadUrl && (
                    <a
                      href={version.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                      style={{ backgroundColor: '#10B98120', color: '#10B981' }}
                      title="Download"
                    >
                      <FaDownload />
                    </a>
                  )}
                  <button
                    onClick={() => copyToClipboard(version?._id)}
                    className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                    style={{ backgroundColor: '#8B5CF620', color: '#8B5CF6' }}
                    title="Copy ID"
                  >
                    <FaCopy />
                  </button>
                  <button
                    onClick={() => showEditModal(version)}
                    className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                    style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}
                    title="Edit Version"
                    disabled={actionLoading}
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(version)}
                    disabled={actionLoading}
                    className="p-2 rounded-lg hover:bg-opacity-20 transition-colors text-red-500"
                    style={{ backgroundColor: '#EF444420' }}
                    title="Delete Version"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Info */}
      <div className="text-center text-sm opacity-70" style={{ color: themeColors.text }}>
        <p>
          Showing {filteredVersions.length} of {versions.length} versions •
          Sorted by: {sortByDate === "desc" ? "Newest First" : "Oldest First"} •
          Last updated: {lastUpdated ? lastUpdated.toLocaleString() : '—'}
        </p>
      </div>
    </div>
  );
}