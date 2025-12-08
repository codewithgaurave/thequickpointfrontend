import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

// Keys for localStorage (ADMIN ONLY)
const ADMIN_KEY = "admin-data";
const ADMIN_TOKEN_KEY = "admin-token";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // logged-in ADMIN (admin object)
  const [token, setToken] = useState(null); // JWT token
  const [loading, setLoading] = useState(true);

  // Load saved data from storage
  useEffect(() => {
    try {
      const savedAdmin = localStorage.getItem(ADMIN_KEY);
      const savedToken = localStorage.getItem(ADMIN_TOKEN_KEY);

      if (savedAdmin) {
        setUser(JSON.parse(savedAdmin));
      }
      if (savedToken) {
        setToken(savedToken);
      }
    } catch (err) {
      // ignore JSON parse errors or localStorage errors
      console.warn("AuthProvider: error reading localStorage", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * setLoginData expects an object like:
   * {
   *   admin: { id, adminId, name, ... }  OR a merged admin object
   *   token: "jwt..."
   * }
   *
   * We normalize so `user` holds only the admin object (no token).
   */
  const setLoginData = (loginPayload) => {
    if (!loginPayload) return;

    // Support both shapes:
    // 1) { admin: { ... }, token: "..." }
    // 2) { ...adminFields, token: "..." } (what you used earlier)
    const adminObj = loginPayload.admin
      ? loginPayload.admin
      : (() => {
          const cloned = { ...loginPayload };
          delete cloned.token;
          return cloned;
        })();

    const tokenValue = loginPayload.token || null;

    setUser(adminObj || null);
    setToken(tokenValue);

    try {
      if (adminObj) {
        localStorage.setItem(ADMIN_KEY, JSON.stringify(adminObj));
      }
      if (tokenValue) {
        localStorage.setItem(ADMIN_TOKEN_KEY, tokenValue);
      }
    } catch (err) {
      console.warn("AuthProvider: error saving to localStorage", err);
    }
  };

  // LOGOUT
  const logout = () => {
    setUser(null);
    setToken(null);

    try {
      localStorage.removeItem(ADMIN_KEY);
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    } catch (err) {
      console.warn("AuthProvider: error removing from localStorage", err);
    }
  };

  const isLoggedIn = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user, // admin object
        token,
        loading,
        isLoggedIn,
        setLoginData,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
