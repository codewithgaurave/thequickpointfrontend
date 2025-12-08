// src/pages/Users.jsx
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { 
  FaTrash, 
  FaEye, 
  FaEdit, 
  FaBan, 
  FaUnlock, 
  FaSearch, 
  FaSync, 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaCity, 
  FaGlobe, 
  FaCalendar,
  FaIdCard,
  FaVenusMars,
  FaBirthdayCake,
  FaImage
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import {
  listUsersAPI,
  getUserAPI,
  updateUserAPI,
  blockUserAPI,
  deleteUserAPI,
} from "../apis/userApi";

const MySwal = withReactContent(Swal);

function formatDateShort(d) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return "-";
  }
}

function formatDateOfBirth(d) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return "-";
  }
}

export default function Users() {
  const { themeColors } = useTheme();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editPayload, setEditPayload] = useState({});
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setListError(null);
      const res = await listUsersAPI();
      const arr = res?.data?.users || [];
      setUsers(arr);
    } catch (err) {
      console.error("listUsers error:", err);
      setListError("Failed to load users");
      toast.error("Unable to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered list based on search
  const filtered = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      return (
        (u.fullName || "").toLowerCase().includes(q) ||
        (u.mobile || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u._id || "").toLowerCase().includes(q)
      );
    });
  }, [users, search]);

  // View user details with SweetAlert
  const handleView = async (user) => {
    try {
      setViewLoading(true);
      const res = await getUserAPI(user._id);
      const userData = res?.data?.user || {};
      
      MySwal.fire({
        title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>User Details</div>,
        html: (
          <div className="text-left space-y-3" style={{ color: themeColors.text }}>
            <div className="flex items-center gap-4 mb-4">
              {userData.profileImageUrl ? (
                <img 
                  src={userData.profileImageUrl} 
                  alt={userData.fullName}
                  className="w-24 h-24 rounded-full object-cover border-2"
                  style={{ borderColor: themeColors.primary }}
                />
              ) : (
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl"
                  style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}>
                  <FaUser />
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold">{userData.fullName || "N/A"}</h3>
                <div className={`px-2 py-1 rounded-full text-xs inline-block mt-1 ${
                  userData.isBlocked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                }`}>
                  {userData.isBlocked ? "Blocked" : "Active"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DetailItem icon={<FaIdCard />} label="User ID" value={userData._id} />
              <DetailItem icon={<FaPhone />} label="Mobile" value={userData.mobile} />
              <DetailItem icon={<FaEnvelope />} label="Email" value={userData.email} />
              <DetailItem icon={<FaVenusMars />} label="Gender" value={userData.gender} />
              <DetailItem icon={<FaBirthdayCake />} label="Date of Birth" value={formatDateOfBirth(userData.dateOfBirth)} />
              <DetailItem icon={<FaCalendar />} label="Joined" value={formatDateShort(userData.createdAt)} />
            </div>

            <div className="mt-4 pt-4 border-t" style={{ borderColor: themeColors.border }}>
              <DetailItem icon={<FaMapMarkerAlt />} label="Address" value={userData.address} />
              <div className="grid grid-cols-3 gap-2 mt-2">
                <DetailItem icon={<FaCity />} label="City" value={userData.city} />
                <DetailItem icon={<FaGlobe />} label="State" value={userData.state} />
                <DetailItem icon={<FaImage />} label="Pincode" value={userData.pincode} />
              </div>
              <DetailItem icon={<FaGlobe />} label="Country" value={userData.country} />
            </div>
          </div>
        ),
        showCloseButton: true,
        showConfirmButton: false,
        width: '600px',
        background: themeColors.background,
        customClass: {
          popup: 'rounded-2xl border',
          closeButton: 'text-gray-500 hover:text-gray-700'
        }
      });

    } catch (err) {
      console.error("getUser error:", err);
      toast.error("Failed to load user details");
    } finally {
      setViewLoading(false);
    }
  };

  // Start editing with SweetAlert modal
  const startEdit = (user) => {
    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Edit User</div>,
      html: (
        <div className="space-y-3 text-left">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Full Name</label>
            <input
              type="text"
              defaultValue={user.fullName || ""}
              onChange={(e) => setEditPayload(p => ({ ...p, fullName: e.target.value }))}
              className="w-full p-2 rounded-lg border"
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Email</label>
            <input
              type="email"
              defaultValue={user.email || ""}
              onChange={(e) => setEditPayload(p => ({ ...p, email: e.target.value }))}
              className="w-full p-2 rounded-lg border"
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Address</label>
            <textarea
              defaultValue={user.address || ""}
              onChange={(e) => setEditPayload(p => ({ ...p, address: e.target.value }))}
              className="w-full p-2 rounded-lg border"
              rows="2"
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>City</label>
              <input
                type="text"
                defaultValue={user.city || ""}
                onChange={(e) => setEditPayload(p => ({ ...p, city: e.target.value }))}
                className="w-full p-2 rounded-lg border"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>State</label>
              <input
                type="text"
                defaultValue={user.state || ""}
                onChange={(e) => setEditPayload(p => ({ ...p, state: e.target.value }))}
                className="w-full p-2 rounded-lg border"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Pincode</label>
              <input
                type="text"
                defaultValue={user.pincode || ""}
                onChange={(e) => setEditPayload(p => ({ ...p, pincode: e.target.value }))}
                className="w-full p-2 rounded-lg border"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Country</label>
              <input
                type="text"
                defaultValue={user.country || ""}
                onChange={(e) => setEditPayload(p => ({ ...p, country: e.target.value }))}
                className="w-full p-2 rounded-lg border"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text
                }}
              />
            </div>
          </div>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: 'Save Changes',
      cancelButtonText: 'Cancel',
      confirmButtonColor: themeColors.primary || '#3B82F6',
      cancelButtonColor: themeColors.border || '#6B7280',
      background: themeColors.background,
      preConfirm: async () => {
        try {
          setActionLoadingId(user._id);
          const res = await updateUserAPI(user._id, editPayload);
          return res.data;
        } catch (error) {
          Swal.showValidationMessage(`Update failed: ${error.response?.data?.message || error.message}`);
          return false;
        } finally {
          setActionLoadingId(null);
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedUser = result.value;
        setUsers(prev => prev.map(u => u._id === updatedUser._id ? updatedUser : u));
        toast.success('User updated successfully!');
      }
    });
  };

  // Block / Unblock user with confirmation
  const toggleBlock = async (user) => {
    const toBlock = !user.isBlocked;
    
    const result = await MySwal.fire({
      title: <div style={{ color: themeColors.text }}>
        {toBlock ? 'Block User' : 'Unblock User'}
      </div>,
      html: <div style={{ color: themeColors.text }}>
        Are you sure you want to {toBlock ? 'block' : 'unblock'} <strong>{user.fullName || user.mobile}</strong>?
        {toBlock && <p className="text-sm text-red-500 mt-2">Blocked users cannot access the platform.</p>}
      </div>,
      icon: toBlock ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonText: `Yes, ${toBlock ? 'Block' : 'Unblock'}`,
      cancelButtonText: 'Cancel',
      confirmButtonColor: toBlock ? '#EF4444' : '#10B981',
      cancelButtonColor: themeColors.border,
      background: themeColors.background,
    });

    if (result.isConfirmed) {
      try {
        setActionLoadingId(user._id);
        await blockUserAPI(user._id, toBlock);
        toast.success(`User ${toBlock ? 'blocked' : 'unblocked'} successfully`);
        setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isBlocked: toBlock } : u));
      } catch (err) {
        console.error("blockUser error:", err);
        toast.error("Action failed");
      } finally {
        setActionLoadingId(null);
      }
    }
  };

  // Delete user with confirmation
  const handleDelete = async (user) => {
    const result = await MySwal.fire({
      title: <div style={{ color: themeColors.text }}>Delete User</div>,
      html: <div style={{ color: themeColors.text }}>
        <div className="text-red-500 text-xl mb-3">
          <FaTrash className="inline mr-2" />
          Warning: This action cannot be undone!
        </div>
        <p>Are you sure you want to delete user:</p>
        <div className="bg-red-50 p-3 rounded-lg my-3">
          <p className="font-bold">{user.fullName || 'No Name'}</p>
          <p className="text-sm">{user.mobile} • {user.email || 'No email'}</p>
        </div>
        <p className="text-sm">This will permanently remove all user data.</p>
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
        setActionLoadingId(user._id);
        await deleteUserAPI(user._id);
        toast.success("User deleted successfully");
        setUsers(prev => prev.filter(u => u._id !== user._id));
      } catch (err) {
        console.error("deleteUser error:", err);
        toast.error("Delete failed");
      } finally {
        setActionLoadingId(null);
      }
    }
  };

  // Detail Item Component
  const DetailItem = ({ icon, label, value }) => (
    <div className="flex items-start gap-2">
      <div className="mt-1" style={{ color: themeColors.primary }}>
        {icon}
      </div>
      <div>
        <p className="text-xs opacity-70">{label}</p>
        <p className="font-medium">{value || "-"}</p>
      </div>
    </div>
  );

  // Stats
  const stats = {
    total: users.length,
    active: users.filter(u => !u.isBlocked).length,
    blocked: users.filter(u => u.isBlocked).length,
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: themeColors.text }}>
            User Management
          </h2>
          <p className="text-sm opacity-75 mt-1" style={{ color: themeColors.text }}>
            Admin dashboard for managing all registered users
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" style={{ color: themeColors.text }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 rounded-xl border w-full md:w-64"
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text,
              }}
            />
          </div>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 rounded-xl flex items-center gap-2 transition-all hover:scale-105"
            style={{
              backgroundColor: themeColors.primary,
              color: 'white'
            }}
            title="Refresh"
          >
            <FaSync className={loading ? "animate-spin" : ""} />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Total Users</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{stats.total}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}>
              <FaUser size={24} />
            </div>
          </div>
        </div>
        
        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Active Users</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{stats.active}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#10B98120', color: '#10B981' }}>
              <FaUnlock size={24} />
            </div>
          </div>
        </div>
        
        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Blocked Users</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{stats.blocked}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#EF444420', color: '#EF4444' }}>
              <FaBan size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: themeColors.primary }}></div>
              <p className="mt-2 opacity-70" style={{ color: themeColors.text }}>Loading users...</p>
            </div>
          ) : listError ? (
            <div className="py-12 text-center">
              <div className="text-red-500 text-xl mb-2">⚠️</div>
              <p className="text-red-500">{listError}</p>
              <button
                onClick={fetchUsers}
                className="mt-3 px-4 py-2 rounded-lg"
                style={{ backgroundColor: themeColors.primary, color: 'white' }}
              >
                Retry
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: themeColors.background + '50' }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: themeColors.text }}>
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: themeColors.text }}>
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: themeColors.text }}>
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: themeColors.text }}>
                    Joined
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: themeColors.text }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: themeColors.border }}>
                {filtered.map((u) => (
                  <tr key={u._id} className="hover:opacity-90 transition-opacity">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {u.profileImageUrl ? (
                            <img 
                              src={u.profileImageUrl} 
                              alt={u.fullName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}>
                              <FaUser />
                            </div>
                          )}
                          {u.isBlocked && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: themeColors.text }}>
                            {u.fullName || "No Name"}
                          </p>
                          <p className="text-xs opacity-70" style={{ color: themeColors.text }}>
                            ID: {u._id.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p style={{ color: themeColors.text }}>{u.mobile || "-"}</p>
                      <p className="text-xs opacity-70" style={{ color: themeColors.text }}>
                        {u.email || "No email"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        u.isBlocked 
                          ? "bg-red-100 text-red-800" 
                          : "bg-green-100 text-green-800"
                      }`}>
                        {u.isBlocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm" style={{ color: themeColors.text }}>
                        {formatDateShort(u.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleView(u)}
                          className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                          style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => startEdit(u)}
                          className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                          style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}
                          title="Edit User"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => toggleBlock(u)}
                          disabled={actionLoadingId === u._id}
                          className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                          style={{ 
                            backgroundColor: u.isBlocked ? '#10B98120' : '#EF444420', 
                            color: u.isBlocked ? '#10B981' : '#EF4444' 
                          }}
                          title={u.isBlocked ? "Unblock User" : "Block User"}
                        >
                          {u.isBlocked ? <FaUnlock /> : <FaBan />}
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={actionLoadingId === u._id}
                          className="p-2 rounded-lg hover:bg-opacity-20 transition-colors text-red-500"
                          style={{ backgroundColor: '#EF444420' }}
                          title="Delete User"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FaUser className="text-4xl opacity-30" style={{ color: themeColors.text }} />
                        <p className="text-lg" style={{ color: themeColors.text }}>No users found</p>
                        {search && (
                          <p className="text-sm opacity-70" style={{ color: themeColors.text }}>
                            No users match "{search}"
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-sm opacity-70" style={{ color: themeColors.text }}>
        <p>Showing {filtered.length} of {users.length} users • Last updated: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}