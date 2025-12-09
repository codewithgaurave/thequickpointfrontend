// src/pages/DeliveryBoys.jsx
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
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCity,
  FaGlobe,
  FaMapPin,
  FaIdCard,
  FaUserCheck,
  FaUserTimes,
  FaMotorcycle,
  FaSortAmountDown,
  FaSortAmountUp
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import {
  createDeliveryBoyAPI,
  getAllDeliveryBoysAPI,
  updateDeliveryBoyAPI,
  updateDeliveryBoyStatusAPI,
  deleteDeliveryBoyAPI,
} from "../apis/deliveryBoyApi";

const MySwal = withReactContent(Swal);

export default function DeliveryBoys() {
  const { themeColors } = useTheme();

  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortByDate, setSortByDate] = useState("desc");
  const [actionLoading, setActionLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch all delivery boys
  const fetchDeliveryBoys = async () => {
    try {
      setLoading(true);
      const res = await getAllDeliveryBoysAPI();
      setDeliveryBoys(res?.data?.list || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching delivery boys:", err);
      toast.error("Failed to load delivery boys");
      setDeliveryBoys([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryBoys();
  }, []);

  // Filter and sort delivery boys
  const filteredDeliveryBoys = (deliveryBoys || [])
    .filter(boy => {
      if (!boy) return false;
      const query = search.toLowerCase();
      return (
        (boy.name && boy.name.toLowerCase().includes(query)) ||
        (boy.phone && boy.phone.includes(query)) ||
        (boy.email && boy.email.toLowerCase().includes(query)) ||
        (boy.city && boy.city.toLowerCase().includes(query)) ||
        (boy.state && boy.state.toLowerCase().includes(query)) ||
        (boy.isActive ? "active" : "inactive").includes(query)
      );
    })
    .sort((a, b) => {
      if (!a || !b) return 0;
      if (sortByDate === "desc") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    });

  // Helper to clear preview images
  const clearSwalPreviews = () => {
    const p1 = document.getElementById('profile-image-preview');
    if (p1) {
      p1.src = "";
      p1.classList.add('hidden');
    }
    const p2 = document.getElementById('document-preview');
    if (p2) {
      p2.src = "";
      p2.classList.add('hidden');
    }
    const p3 = document.getElementById('edit-profile-image-preview');
    if (p3) {
      p3.src = "";
      p3.classList.add('hidden');
    }
    const p4 = document.getElementById('edit-document-preview');
    if (p4) {
      p4.src = "";
      p4.classList.add('hidden');
    }
    // Clear file inputs
    const inputs = ['swal-profileImage', 'swal-document', 'swal-edit-profileImage', 'swal-edit-document'];
    inputs.forEach(id => {
      const input = document.getElementById(id);
      if (input) input.value = "";
    });
  };

  // Show create delivery boy modal
  const showCreateModal = () => {
    clearSwalPreviews();

    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Add New Delivery Boy</div>,
      html: (
        <div className="space-y-4 text-left max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal Info */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm" style={{ color: themeColors.text }}>Personal Information</h3>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                  Full Name *
                </label>
                <input
                  id="swal-name"
                  type="text"
                  className="w-full p-2 rounded-lg border"
                  style={{
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.background,
                    color: themeColors.text
                  }}
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                  Phone Number *
                </label>
                <input
                  id="swal-phone"
                  type="tel"
                  className="w-full p-2 rounded-lg border"
                  style={{
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.background,
                    color: themeColors.text
                  }}
                  placeholder="Enter 10-digit phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                  Email Address
                </label>
                <input
                  id="swal-email"
                  type="email"
                  className="w-full p-2 rounded-lg border"
                  style={{
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.background,
                    color: themeColors.text
                  }}
                  placeholder="Enter email address"
                />
              </div>
            </div>

            {/* Address Info */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm" style={{ color: themeColors.text }}>Address Information</h3>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                  Address *
                </label>
                <input
                  id="swal-address"
                  type="text"
                  className="w-full p-2 rounded-lg border"
                  style={{
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.background,
                    color: themeColors.text
                  }}
                  placeholder="Enter complete address"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                    City *
                  </label>
                  <input
                    id="swal-city"
                    type="text"
                    className="w-full p-2 rounded-lg border"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background,
                      color: themeColors.text
                    }}
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                    State *
                  </label>
                  <input
                    id="swal-state"
                    type="text"
                    className="w-full p-2 rounded-lg border"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background,
                      color: themeColors.text
                    }}
                    placeholder="State"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                  Pincode *
                </label>
                <input
                  id="swal-pincode"
                  type="text"
                  className="w-full p-2 rounded-lg border"
                  style={{
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.background,
                    color: themeColors.text
                  }}
                  placeholder="Enter 6-digit pincode"
                />
              </div>
            </div>
          </div>

          {/* File Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                Profile Image
              </label>
              <input
                id="swal-profileImage"
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
                      const img = document.getElementById('profile-image-preview');
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
                  id="profile-image-preview"
                  alt="Profile Preview"
                  className="w-full h-32 object-contain rounded-lg border hidden"
                  style={{ borderColor: themeColors.border }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                ID Document
              </label>
              <input
                id="swal-document"
                type="file"
                accept="image/*,.pdf"
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
                      const img = document.getElementById('document-preview');
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
                  id="document-preview"
                  alt="Document Preview"
                  className="w-full h-32 object-contain rounded-lg border hidden"
                  style={{ borderColor: themeColors.border }}
                />
              </div>
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
              <option value="true">Active (Can accept deliveries)</option>
              <option value="false">Inactive (Cannot accept deliveries)</option>
            </select>
          </div>

          <div className="text-xs opacity-70 p-3 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background + '50' }}>
            <p className="font-medium mb-1">Guidelines:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Profile image should be clear face photo</li>
              <li>ID document can be Aadhar, PAN, or Driving License</li>
              <li>Max file size: 5MB each</li>
              <li>Formats: JPG, PNG, PDF</li>
            </ul>
          </div>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: 'Add Delivery Boy',
      cancelButtonText: 'Cancel',
      confirmButtonColor: themeColors.primary || '#3B82F6',
      cancelButtonColor: themeColors.border || '#6B7280',
      background: themeColors.background,
      width: '800px',
      preConfirm: async () => {
        const name = document.getElementById('swal-name').value;
        const phone = document.getElementById('swal-phone').value;
        const email = document.getElementById('swal-email').value;
        const address = document.getElementById('swal-address').value;
        const city = document.getElementById('swal-city').value;
        const state = document.getElementById('swal-state').value;
        const pincode = document.getElementById('swal-pincode').value;
        const isActive = document.getElementById('swal-isActive').value === 'true';
        const profileImage = document.getElementById('swal-profileImage').files[0];
        const documentFile = document.getElementById('swal-document').files[0];

        // Validation
        if (!name.trim()) {
          Swal.showValidationMessage('Please enter full name');
          return false;
        }
        if (!phone.trim() || !/^\d{10}$/.test(phone)) {
          Swal.showValidationMessage('Please enter valid 10-digit phone number');
          return false;
        }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          Swal.showValidationMessage('Please enter valid email address');
          return false;
        }
        if (!address.trim()) {
          Swal.showValidationMessage('Please enter address');
          return false;
        }
        if (!city.trim()) {
          Swal.showValidationMessage('Please enter city');
          return false;
        }
        if (!state.trim()) {
          Swal.showValidationMessage('Please enter state');
          return false;
        }
        if (!pincode.trim() || !/^\d{6}$/.test(pincode)) {
          Swal.showValidationMessage('Please enter valid 6-digit pincode');
          return false;
        }

        try {
          setActionLoading(true);
          const formData = new FormData();
          formData.append('name', name);
          formData.append('phone', phone);
          if (email) formData.append('email', email);
          formData.append('address', address);
          formData.append('city', city);
          formData.append('state', state);
          formData.append('pincode', pincode);
          formData.append('isActive', isActive);
          if (profileImage) formData.append('profileImage', profileImage);
          if (documentFile) formData.append('document', documentFile);

          const res = await createDeliveryBoyAPI(formData);
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
        await fetchDeliveryBoys();
        clearSwalPreviews();
        toast.success('Delivery boy added successfully!');
      }
    });
  };

  // Show edit delivery boy modal
  const showEditModal = (boy) => {
    if (!boy) return;

    clearSwalPreviews();

    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Edit Delivery Boy</div>,
      html: (
        <div className="space-y-4 text-left max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal Info */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm" style={{ color: themeColors.text }}>Personal Information</h3>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                  Full Name *
                </label>
                <input
                  id="swal-edit-name"
                  type="text"
                  defaultValue={boy.name}
                  className="w-full p-2 rounded-lg border"
                  style={{
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.background,
                    color: themeColors.text
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                  Phone Number *
                </label>
                <input
                  id="swal-edit-phone"
                  type="tel"
                  defaultValue={boy.phone}
                  className="w-full p-2 rounded-lg border"
                  style={{
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.background,
                    color: themeColors.text
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                  Email Address
                </label>
                <input
                  id="swal-edit-email"
                  type="email"
                  defaultValue={boy.email}
                  className="w-full p-2 rounded-lg border"
                  style={{
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.background,
                    color: themeColors.text
                  }}
                />
              </div>
            </div>

            {/* Address Info */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm" style={{ color: themeColors.text }}>Address Information</h3>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                  Address *
                </label>
                <input
                  id="swal-edit-address"
                  type="text"
                  defaultValue={boy.address}
                  className="w-full p-2 rounded-lg border"
                  style={{
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.background,
                    color: themeColors.text
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                    City *
                  </label>
                  <input
                    id="swal-edit-city"
                    type="text"
                    defaultValue={boy.city}
                    className="w-full p-2 rounded-lg border"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background,
                      color: themeColors.text
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                    State *
                  </label>
                  <input
                    id="swal-edit-state"
                    type="text"
                    defaultValue={boy.state}
                    className="w-full p-2 rounded-lg border"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background,
                      color: themeColors.text
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                  Pincode *
                </label>
                <input
                  id="swal-edit-pincode"
                  type="text"
                  defaultValue={boy.pincode}
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

          {/* Current Files */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: themeColors.text }}>Current Profile Image</label>
              {boy?.profileImageUrl ? (
                <img
                  src={boy.profileImageUrl}
                  alt="Profile"
                  className="w-full h-32 object-contain rounded-lg border"
                  style={{ borderColor: themeColors.border }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/200x200?text=No+Image";
                  }}
                />
              ) : (
                <div className="w-full h-32 flex items-center justify-center rounded-lg border" style={{ borderColor: themeColors.border }}>
                  <FaUser className="text-4xl opacity-30" style={{ color: themeColors.text }} />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: themeColors.text }}>Current Document</label>
              {boy?.documentUrl ? (
                <img
                  src={boy.documentUrl}
                  alt="Document"
                  className="w-full h-32 object-contain rounded-lg border"
                  style={{ borderColor: themeColors.border }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/200x200?text=No+Document";
                  }}
                />
              ) : (
                <div className="w-full h-32 flex items-center justify-center rounded-lg border" style={{ borderColor: themeColors.border }}>
                  <FaIdCard className="text-4xl opacity-30" style={{ color: themeColors.text }} />
                </div>
              )}
            </div>
          </div>

          {/* File Uploads (Optional Updates) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>New Profile Image (Optional)</label>
              <input
                id="swal-edit-profileImage"
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
                      const img = document.getElementById('edit-profile-image-preview');
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
                  id="edit-profile-image-preview"
                  alt="Profile Preview"
                  className="w-full h-24 object-contain rounded-lg border hidden"
                  style={{ borderColor: themeColors.border }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>New Document (Optional)</label>
              <input
                id="swal-edit-document"
                type="file"
                accept="image/*,.pdf"
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
                      const img = document.getElementById('edit-document-preview');
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
                  id="edit-document-preview"
                  alt="Document Preview"
                  className="w-full h-24 object-contain rounded-lg border hidden"
                  style={{ borderColor: themeColors.border }}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Status</label>
            <select
              id="swal-edit-isActive"
              className="w-full p-2 rounded-lg border"
              defaultValue={boy?.isActive ? "true" : "false"}
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
            >
              <option value="true">Active (Can accept deliveries)</option>
              <option value="false">Inactive (Cannot accept deliveries)</option>
            </select>
          </div>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: 'Update Delivery Boy',
      cancelButtonText: 'Cancel',
      confirmButtonColor: themeColors.primary || '#3B82F6',
      cancelButtonColor: themeColors.border || '#6B7280',
      background: themeColors.background,
      width: '800px',
      preConfirm: async () => {
        const name = document.getElementById('swal-edit-name').value;
        const phone = document.getElementById('swal-edit-phone').value;
        const email = document.getElementById('swal-edit-email').value;
        const address = document.getElementById('swal-edit-address').value;
        const city = document.getElementById('swal-edit-city').value;
        const state = document.getElementById('swal-edit-state').value;
        const pincode = document.getElementById('swal-edit-pincode').value;
        const isActive = document.getElementById('swal-edit-isActive').value === 'true';
        const profileImage = document.getElementById('swal-edit-profileImage').files[0];
        const documentFile = document.getElementById('swal-edit-document').files[0];

        // Validation
        if (!name.trim()) {
          Swal.showValidationMessage('Please enter full name');
          return false;
        }
        if (!phone.trim() || !/^\d{10}$/.test(phone)) {
          Swal.showValidationMessage('Please enter valid 10-digit phone number');
          return false;
        }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          Swal.showValidationMessage('Please enter valid email address');
          return false;
        }
        if (!address.trim()) {
          Swal.showValidationMessage('Please enter address');
          return false;
        }
        if (!city.trim()) {
          Swal.showValidationMessage('Please enter city');
          return false;
        }
        if (!state.trim()) {
          Swal.showValidationMessage('Please enter state');
          return false;
        }
        if (!pincode.trim() || !/^\d{6}$/.test(pincode)) {
          Swal.showValidationMessage('Please enter valid 6-digit pincode');
          return false;
        }

        try {
          setActionLoading(true);
          const formData = new FormData();
          formData.append('name', name);
          formData.append('phone', phone);
          formData.append('email', email);
          formData.append('address', address);
          formData.append('city', city);
          formData.append('state', state);
          formData.append('pincode', pincode);
          formData.append('isActive', isActive);
          if (profileImage) formData.append('profileImage', profileImage);
          if (documentFile) formData.append('document', documentFile);

          const res = await updateDeliveryBoyAPI(boy?._id, formData);
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
        await fetchDeliveryBoys();
        clearSwalPreviews();
        toast.success('Delivery boy updated successfully!');
      }
    });
  };

  // Toggle delivery boy status
  const toggleDeliveryBoyStatus = async (boy) => {
    if (!boy) return;

    const newStatus = !boy.isActive;

    const result = await MySwal.fire({
      title: <div style={{ color: themeColors.text }}>
        {newStatus ? 'Activate Delivery Boy' : 'Deactivate Delivery Boy'}
      </div>,
      html: <div style={{ color: themeColors.text }}>
        <p>Are you sure you want to {newStatus ? 'activate' : 'deactivate'} this delivery boy?</p>
        <div className="my-3 p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
          <div className="flex items-center gap-3">
            {boy?.profileImageUrl ? (
              <img
                src={boy.profileImageUrl}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/64?text=No+Image";
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-200">
                <FaUser className="text-2xl text-gray-500" />
              </div>
            )}
            <div>
              <p className="font-medium">{boy.name}</p>
              <p className="text-sm opacity-70">{boy.phone}</p>
              <p className="text-sm">{boy.city}, {boy.state}</p>
            </div>
          </div>
        </div>
        <p className="text-sm opacity-70">
          {newStatus 
            ? 'This will allow the delivery boy to accept new delivery orders.'
            : 'This will prevent the delivery boy from accepting new delivery orders.'}
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
        await updateDeliveryBoyStatusAPI(boy?._id, newStatus);
        await fetchDeliveryBoys();
        toast.success(`Delivery boy ${newStatus ? 'activated' : 'deactivated'} successfully`);
      } catch (err) {
        console.error("Error updating delivery boy status:", err);
        toast.error("Failed to update delivery boy status");
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Delete delivery boy
  const handleDelete = async (boy) => {
    if (!boy) return;

    const result = await MySwal.fire({
      title: <div style={{ color: themeColors.text }}>Delete Delivery Boy</div>,
      html: <div style={{ color: themeColors.text }}>
        <div className="text-red-500 text-xl mb-3">
          <FaTrash className="inline mr-2" />
          Warning: This action cannot be undone!
        </div>
        <p>Are you sure you want to delete this delivery boy?</p>
        <div className="my-3 p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
          <div className="flex items-center gap-3">
            {boy?.profileImageUrl ? (
              <img
                src={boy.profileImageUrl}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/80?text=No+Image";
                }}
              />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center bg-gray-200">
                <FaUser className="text-3xl text-gray-500" />
              </div>
            )}
            <div>
              <p className="text-lg font-bold">{boy.name}</p>
              <p className="text-sm"><FaPhone className="inline mr-2" />{boy.phone}</p>
              {boy.email && <p className="text-sm"><FaEnvelope className="inline mr-2" />{boy.email}</p>}
              <p className="text-sm"><FaMapMarkerAlt className="inline mr-2" />{boy.address}</p>
              <div className="mt-2">
                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                  boy?.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {boy?.isActive ? <FaCheckCircle /> : <FaTimesCircle />}
                  {boy?.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm text-red-500">All associated data will be permanently removed.</p>
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
        await deleteDeliveryBoyAPI(boy?._id);
        await fetchDeliveryBoys();
        toast.success("Delivery boy deleted successfully");
      } catch (err) {
        console.error("Error deleting delivery boy:", err);
        toast.error("Failed to delete delivery boy");
      } finally {
        setActionLoading(false);
      }
    }
  };

  // View delivery boy details
  const viewDeliveryBoyDetails = (boy) => {
    if (!boy) return;

    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Delivery Boy Details</div>,
      html: (
        <div className="text-left space-y-4" style={{ color: themeColors.text }}>
          {/* Profile Header */}
          <div className="flex items-center gap-4 mb-6">
            {boy?.profileImageUrl ? (
              <img
                src={boy.profileImageUrl}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4"
                style={{ borderColor: themeColors.primary }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/96?text=No+Image";
                }}
              />
            ) : (
              <div className="w-24 h-24 rounded-full flex items-center justify-center border-4" style={{ borderColor: themeColors.primary, backgroundColor: themeColors.background + '50' }}>
                <FaUser className="text-4xl" style={{ color: themeColors.primary }} />
              </div>
            )}
            <div>
              <h3 className="text-2xl font-bold">{boy.name}</h3>
              <div className="flex items-center gap-3 mt-2">
                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  boy?.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {boy?.isActive ? <FaCheckCircle /> : <FaTimesCircle />}
                  {boy?.isActive ? 'Active' : 'Inactive'}
                </div>
                <div className="text-sm opacity-70">
                  Joined: {boy?.createdAt ? new Date(boy.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm opacity-70">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: themeColors.background }}>
                <FaPhone className="opacity-70" />
                <div>
                  <p className="text-sm opacity-70">Phone</p>
                  <p className="font-medium">{boy.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: themeColors.background }}>
                <FaEnvelope className="opacity-70" />
                <div>
                  <p className="text-sm opacity-70">Email</p>
                  <p className="font-medium">{boy.email || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm opacity-70">Address Information</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: themeColors.background }}>
                <FaMapMarkerAlt className="mt-1 opacity-70" />
                <div>
                  <p className="text-sm opacity-70">Address</p>
                  <p className="font-medium">{boy.address}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: themeColors.background }}>
                  <FaCity className="opacity-70" />
                  <div>
                    <p className="text-sm opacity-70">City</p>
                    <p className="font-medium">{boy.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: themeColors.background }}>
                  <FaGlobe className="opacity-70" />
                  <div>
                    <p className="text-sm opacity-70">State</p>
                    <p className="font-medium">{boy.state}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: themeColors.background }}>
                <FaMapPin className="opacity-70" />
                <div>
                  <p className="text-sm opacity-70">Pincode</p>
                  <p className="font-medium">{boy.pincode}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm opacity-70">Documents</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm opacity-70 mb-2">Profile Image</p>
                {boy?.profileImageUrl ? (
                  <img
                    src={boy.profileImageUrl}
                    alt="Profile"
                    className="w-full h-40 object-contain rounded-lg border"
                    style={{ borderColor: themeColors.border }}
                  />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center rounded-lg border" style={{ borderColor: themeColors.border }}>
                    <FaUser className="text-4xl opacity-30" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm opacity-70 mb-2">ID Document</p>
                {boy?.documentUrl ? (
                  <img
                    src={boy.documentUrl}
                    alt="Document"
                    className="w-full h-40 object-contain rounded-lg border"
                    style={{ borderColor: themeColors.border }}
                  />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center rounded-lg border" style={{ borderColor: themeColors.border }}>
                    <FaIdCard className="text-4xl opacity-30" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: themeColors.border }}>
            <div>
              <p className="text-sm opacity-70">Created At</p>
              <p className="font-medium">
                {boy?.createdAt ? new Date(boy.createdAt).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-70">Updated At</p>
              <p className="font-medium">
                {boy?.updatedAt ? new Date(boy.updatedAt).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>

          {boy?._id && (
            <div className="text-xs opacity-70 border-t pt-2" style={{ borderColor: themeColors.border }}>
              <p>ID: {boy._id}</p>
            </div>
          )}
        </div>
      ),
      showConfirmButton: false,
      showCloseButton: true,
      width: '700px',
      background: themeColors.background,
    });
  };

  // Stats
  const stats = {
    total: deliveryBoys?.length || 0,
    active: (deliveryBoys || []).filter(b => b?.isActive).length,
    inactive: (deliveryBoys || []).filter(b => !b?.isActive).length,
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: themeColors.text }}>
            Delivery Boys Management
          </h2>
          <p className="text-sm opacity-75 mt-1" style={{ color: themeColors.text }}>
            Manage delivery personnel for your platform
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" style={{ color: themeColors.text }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, city..."
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
            onClick={fetchDeliveryBoys}
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
            <span className="hidden md:inline">Add Delivery Boy</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Total Delivery Boys</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{stats.total}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}>
              <FaMotorcycle size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Active Boys</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{stats.active}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#10B98120', color: '#10B981' }}>
              <FaUserCheck size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70" style={{ color: themeColors.text }}>Inactive Boys</p>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{stats.inactive}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}>
              <FaUserTimes size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Boys List/Grid */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: themeColors.primary }}></div>
          <p className="mt-2 opacity-70" style={{ color: themeColors.text }}>Loading delivery boys...</p>
        </div>
      ) : filteredDeliveryBoys.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <FaMotorcycle className="text-6xl mx-auto mb-4 opacity-30" style={{ color: themeColors.text }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: themeColors.text }}>No Delivery Boys Found</h3>
          <p className="opacity-70 mb-6" style={{ color: themeColors.text }}>
            {search ? `No delivery boys match "${search}"` : "Add your first delivery boy to start managing deliveries"}
          </p>
          <button
            onClick={showCreateModal}
            className="px-6 py-3 rounded-xl inline-flex items-center gap-2"
            style={{ backgroundColor: themeColors.primary, color: 'white' }}
            disabled={actionLoading}
          >
            <FaPlus />
            Add First Delivery Boy
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDeliveryBoys.map((boy, index) => (
            <div
              key={boy?._id || `delivery-boy-${index}`}
              className="rounded-2xl border overflow-hidden group hover:shadow-lg transition-all"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                opacity: boy?.isActive ? 1 : 0.8
              }}
            >
              {/* Header with Profile */}
              <div className="p-4 border-b" style={{ borderColor: themeColors.border }}>
                <div className="flex items-center gap-3">
                  {boy?.profileImageUrl ? (
                    <img
                      src={boy.profileImageUrl}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover border-2"
                      style={{ borderColor: themeColors.primary }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/64?text=No+Image";
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full flex items-center justify-center border-2" style={{ borderColor: themeColors.primary, backgroundColor: themeColors.background + '50' }}>
                      <FaUser className="text-2xl" style={{ color: themeColors.primary }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate" style={{ color: themeColors.text }}>{boy.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        boy?.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {boy?.isActive ? 'Active' : 'Inactive'}
                      </div>
                      <div className="text-xs opacity-70">
                        Joined: {boy?.createdAt ? new Date(boy.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                        }) : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="p-4 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FaPhone className="text-sm opacity-70" style={{ color: themeColors.text }} />
                    <span className="text-sm" style={{ color: themeColors.text }}>{boy.phone}</span>
                  </div>
                  {boy.email && (
                    <div className="flex items-center gap-2">
                      <FaEnvelope className="text-sm opacity-70" style={{ color: themeColors.text }} />
                      <span className="text-sm truncate" style={{ color: themeColors.text }}>{boy.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-sm opacity-70" style={{ color: themeColors.text }} />
                    <span className="text-sm truncate" style={{ color: themeColors.text }}>{boy.city}, {boy.state}</span>
                  </div>
                </div>

                {/* Address Summary */}
                <div className="text-xs p-2 rounded-lg" style={{ backgroundColor: themeColors.background }}>
                  <p className="font-medium mb-1">Address:</p>
                  <p className="opacity-70 line-clamp-2">{boy.address}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: themeColors.border }}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => viewDeliveryBoyDetails(boy)}
                      className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                      style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => showEditModal(boy)}
                      className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                      style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}
                      title="Edit Delivery Boy"
                      disabled={actionLoading}
                    >
                      <FaEdit />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleDeliveryBoyStatus(boy)}
                      disabled={actionLoading}
                      className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                      style={{
                        backgroundColor: boy?.isActive ? '#F59E0B20' : '#10B98120',
                        color: boy?.isActive ? '#F59E0B' : '#10B981'
                      }}
                      title={boy?.isActive ? "Deactivate" : "Activate"}
                    >
                      {boy?.isActive ? <FaToggleOff /> : <FaToggleOn />}
                    </button>
                    <button
                      onClick={() => handleDelete(boy)}
                      disabled={actionLoading}
                      className="p-2 rounded-lg hover:bg-opacity-20 transition-colors text-red-500"
                      style={{ backgroundColor: '#EF444420' }}
                      title="Delete Delivery Boy"
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
          Showing {filteredDeliveryBoys.length} of {deliveryBoys.length} delivery boys •
          Sorted by: {sortByDate === "desc" ? "Newest First" : "Oldest First"} •
          Last updated: {lastUpdated ? lastUpdated.toLocaleString() : '—'}
        </p>
      </div>
    </div>
  );
}