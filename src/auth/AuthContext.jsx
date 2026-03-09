import { createContext, useContext, useState, useMemo } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

  // 🔐 Initialize token from sessionStorage
  const [token, setToken] = useState(() => {
    return sessionStorage.getItem("authToken");
  });

  // 👤 Initialize user from sessionStorage
  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem("authUser");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // ✅ Called after OTP verification
  const handleLoginSuccess = (jwtToken, userData) => {
    setToken(jwtToken);
    setUser(userData);

    sessionStorage.setItem("authToken", jwtToken);
    sessionStorage.setItem("authUser", JSON.stringify(userData));
  };

  // 🚪 Logout
  const logout = () => {
    setToken(null);
    setUser(null);

    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("authUser");
  };

  // 🧠 Memoized context value
  const value = useMemo(() => ({
    token,
    user,
    isAuthenticated: !!token,
    handleLoginSuccess,
    logout,
  }), [token, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 🔑 Custom hook for using AuthContext
export const useAuth = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return ctx;
};