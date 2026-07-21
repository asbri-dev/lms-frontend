import { useState, useMemo, useCallback, useEffect} from "react";
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
    sessionStorage.setItem("authToken", jwtToken);//
    sessionStorage.setItem("authUser", JSON.stringify(userData)); //
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("authUser");
  }, []);
  /* ==============================
   AUTO LOGOUT AFTER INACTIVITY
============================== */
useEffect(() => {
  if (!token) return;

  let timer;

  const resetTimer = () => {
    clearTimeout(timer);

    timer = setTimeout(() => {
      logout();
      alert("Logged out due to inactivity.");
    }, 5 * 60 * 1000); // 5 minutes
  };

  window.addEventListener("mousemove", resetTimer);
  window.addEventListener("keydown", resetTimer);
  window.addEventListener("click", resetTimer);

  resetTimer();

  return () => {
    clearTimeout(timer);

    window.removeEventListener("mousemove", resetTimer);
    window.removeEventListener("keydown", resetTimer);
    window.removeEventListener("click", resetTimer);
  };
}, [token, logout]);
  

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



