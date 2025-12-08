import http from "./http";

/**
 * ---- ADMIN LOGIN ONLY ----
 * POST /api/admin/login
 * Body: { adminId, password }
 * Response: { message, admin, token }
 *
 * Returns: { success: true, data: { admin, token, message } }
 * On error: throws with error object (so callers can inspect err.response)
 */
export const adminLogin = async ({ adminId, password }) => {
  if (!adminId || !password) {
    throw new Error("Missing adminId or password");
  }

  const payload = {
    adminId,
    password,
  };

  try {
    const { data } = await http.post("/api/admin/login", payload);

    // Safety checks for expected response shape
    if (!data || !data.token || !data.admin) {
      // throw a clearer error so UI can show a friendly message
      throw new Error("Invalid response from server");
    }

    return {
      success: true,
      data: {
        admin: data.admin,
        token: data.token,
        message: data.message || "Login successful",
      },
    };
  } catch (err) {
    // Re-throw so caller (UI) can read err.response?.data?.message if present
    throw err;
  }
};
