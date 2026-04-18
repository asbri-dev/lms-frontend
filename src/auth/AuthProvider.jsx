import { useState, useMemo, useCallback } from "react";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }) => {

  const [token, setToken] = useState(() => sessionStorage.getItem("authToken"));

  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem("authUser");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const handleLoginSuccess = useCallback((jwtToken, userData) => {
    setToken(jwtToken);
    setUser(userData);
    sessionStorage.setItem("authToken", jwtToken);
    sessionStorage.setItem("authUser", JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("authUser");
  }, []);

  const value = useMemo(() => ({
    token,
    user,
    isAuthenticated: !!token,
    handleLoginSuccess,
    logout,
  }), [token, user, handleLoginSuccess, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};