import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

import { API_BASE_URL } from "../../config/api";

// ── Subtle geometric background pattern ──────────────────────────────────────
const BgPattern = () => (
  <svg
    style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0, opacity: 0.045 }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2b3c6b" strokeWidth="1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();

  // "STUDENT" | "ADMIN"
  const [role, setRole] = useState("STUDENT");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isSTUDENT = role === "STUDENT";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
     if (!/^\d{10}$/.test(username.trim())) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    // ── Build payload (change field names here after backend confirms) ──
    const payload = isSTUDENT
      ? { mobileNumber: username.trim(), password: password.trim(), role: "STUDENT" }
      : { mobileNumber: username.trim(), password: password.trim(), role: "ADMIN" };

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // ── Safe response parsing ──
      let data = null;
      const contentType = res.headers.get("content-type");
      try {
        if (contentType?.includes("application/json")) {
          data = await res.json();
        } else {
          const text = await res.text();
          data = { message: text };
        }
      } catch {
        data = { message: "Invalid server response" };
      }

      if (!res.ok) {
        toast.error(data?.message || "Login failed. Check your credentials.");
        return;
      }

      // ── Store OTP token ──
      sessionStorage.setItem("otpToken", data.token);

      toast.success(data?.message || "OTP sent successfully!");

      // ── Navigate to OTP page after short delay so toast is visible ──
      setTimeout(() => navigate("/otp"), 900);

    } catch (err) {
      if (err.message === "Failed to fetch") {
        toast.error("Server is not running. Please try again later.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      
      {/* ── Page wrapper ── */}
      <div style={{
        minHeight: "100vh",
        background: "#f0f4ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        padding: "20px",
        position: "relative",
      }}>

        <BgPattern />

        {/* ── Card ── */}
        <div style={{
          width: "100%",
          maxWidth: 420,
          background: "white",
          borderRadius: 24,
          boxShadow: "0 20px 60px rgba(43,60,107,0.13), 0 4px 16px rgba(43,60,107,0.08)",
          overflow: "hidden",
          position: "relative",
          zIndex: 1,
        }}>

          {/* ── Top accent bar ── */}
          <div style={{
            height: 5,
            background: "linear-gradient(90deg, #2b3c6b 0%, #3f548f 50%, #6b8fd4 100%)",
          }} />

          {/* ── Card body ── */}
          <div style={{ padding: "36px 36px 40px" }}>

            {/* Logo + title */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{
                width: 52, height: 52,
                borderRadius: 14,
                background: "linear-gradient(135deg, #2b3c6b, #3f548f)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
                boxShadow: "0 6px 20px rgba(43,60,107,0.25)",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h1 style={{
                fontSize: 22, fontWeight: 700, color: "#1e293b",
                letterSpacing: "-0.4px", margin: 0,
              }}>
                FEE Management
              </h1>
              <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
                Sign in to your account
              </p>
            </div>

            {/* ── Role toggle ── */}
            <div style={{
              display: "flex",
              background: "#f1f5f9",
              borderRadius: 12,
              padding: 4,
              marginBottom: 28,
              gap: 4,
            }}>
              {["STUDENT", "ADMIN"].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRole(r);
                    setUsername("");
                    setPassword("");
                  }}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: 9,
                    border: "none",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    background: role === r
                      ? "white"
                      : "transparent",
                    color: role === r ? "#2b3c6b" : "#94a3b8",
                    boxShadow: role === r
                      ? "0 2px 8px rgba(43,60,107,0.12)"
                      : "none",
                  }}
                >
                  {r === "STUDENT" ? "👤 STUDENT" : "🔑 Admin"}
                </button>
              ))}
            </div>

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Username */}
              <div>
                <label style={{
                  display: "block", fontSize: 12, fontWeight: 600,
                  color: "#475569", marginBottom: 6,
                  textTransform: "uppercase", letterSpacing: "0.5px",
                }}>
                  {isSTUDENT ? "Student MOB" : "Admin MOBLIE"}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isSTUDENT ? "e.g. 6369612678" : "e.g. 7904037628"}
                  autoComplete="username"
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: 10,
                    border: "1.5px solid #e2e8f0",
                    fontSize: 14,
                    color: "#1e293b",
                    outline: "none",
                    transition: "border-color 0.15s",
                    boxSizing: "border-box",
                    background: "#fafbff",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#3f548f")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>

              {/* Password */}
              <div>
                <label style={{
                  display: "block", fontSize: 12, fontWeight: 600,
                  color: "#475569", marginBottom: 6,
                  textTransform: "uppercase", letterSpacing: "0.5px",
                }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    style={{
                      width: "100%",
                      padding: "11px 42px 11px 14px",
                      borderRadius: 10,
                      border: "1.5px solid #e2e8f0",
                      fontSize: 14,
                      color: "#1e293b",
                      outline: "none",
                      transition: "border-color 0.15s",
                      boxSizing: "border-box",
                      background: "#fafbff",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#3f548f")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  />
                  {/* Show/hide password toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute", right: 12, top: "50%",
                      transform: "translateY(-50%)",
                      background: "none", border: "none",
                      cursor: "pointer", color: "#94a3b8",
                      padding: 4, display: "flex", alignItems: "center",
                    }}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: 11,
                  border: "none",
                  background: loading
                    ? "#94a3b8"
                    : "linear-gradient(135deg, #2b3c6b 0%, #3f548f 100%)",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  letterSpacing: "0.2px",
                  marginTop: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: loading ? "none" : "0 4px 14px rgba(43,60,107,0.35)",
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: 16, height: 16,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "white",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.7s linear infinite",
                    }} />
                    Sending OTP…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>

            </form>

            {/* Footer note */}
            <p style={{
              textAlign: "center", fontSize: 11,
              color: "#cbd5e1", marginTop: 24,
            }}>
              An OTP will be sent to your registered email
            </p>

          </div>
        </div>

        {/* ── Copyright ── */}
        <p style={{
          position: "fixed", bottom: 16,
          fontSize: 11, color: "#94a3b8",
          zIndex: 1, textAlign: "center", width: "100%",
        }}>
          © 2026 FEE System
        
        </p>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input::placeholder { color: #cbd5e1; }
      `}</style>
    </>
  );
}
