import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";


const AuthContext = createContext();

const ADMIN_KEY = "admin-data";
const ADMIN_TOKEN_KEY = "admin-token";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔴 LOGOUT FUNCTION
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(ADMIN_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  };

  // 🔹 Check token expiry & auto logout
  const scheduleAutoLogout = (jwtToken) => {
    try {
      const decoded = jwtDecode(jwtToken);
      const expiryTime = decoded.exp * 1000; // exp is in seconds
      const currentTime = Date.now();
      const timeout = expiryTime - currentTime;

      if (timeout <= 0) {
        logout();
      } else {
        setTimeout(() => {
          logout();
        }, timeout);
      }
    } catch (err) {
      logout();
    }
  };

  // 🔹 Load from localStorage
  useEffect(() => {
    try {
      const savedAdmin = localStorage.getItem(ADMIN_KEY);
      const savedToken = localStorage.getItem(ADMIN_TOKEN_KEY);

      if (savedAdmin && savedToken) {
        setUser(JSON.parse(savedAdmin));
        setToken(savedToken);
        scheduleAutoLogout(savedToken); // 🔥 AUTO LOGOUT SET
      }
    } catch (err) {
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔹 LOGIN SETTER
  const setLoginData = ({ admin, token }) => {
    setUser(admin);
    setToken(token);

    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
    localStorage.setItem(ADMIN_TOKEN_KEY, token);

    scheduleAutoLogout(token); // 🔥 START TIMER ON LOGIN
  };

  const isLoggedIn = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
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
