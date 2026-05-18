import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { GraduationCap, Loader2 } from "lucide-react";

import { API_BASE_URL } from "../../config/api";

export default function LoginPage() {
  const navigate = useNavigate();

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

    const payload = isSTUDENT
      ? {
          mobileNumber: username.trim(),
          password: password.trim(),
          role: "STUDENT",
        }
      : {
          mobileNumber: username.trim(),
          password: password.trim(),
          role: "ADMIN",
        };

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

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

      sessionStorage.setItem("otpToken", data.token);

      toast.success(data?.message || "OTP sent successfully!");

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
      <Toaster position="top-right" />

      <div className="min-h-screen grid lg:grid-cols-2 bg-white">

        {/* Left Side */}
        <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-[#1e3a8a] via-[#233d91] to-[#3b82f6] text-white p-12 flex-col justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur-md border border-white/10 grid place-items-center">
              <GraduationCap className="h-6 w-6" />
            </div>

            <div>
              <h1 className="font-bold text-2xl">
                Aries Polytechnic
              </h1>
              <p className="text-sm text-white/70">
                Fees Management Portal
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-md space-y-5">
            <h2 className="text-5xl font-bold leading-tight">
              Modern Student Fees Management
            </h2>

            <p className="text-lg text-white/80 leading-relaxed">
              Access fees, academic services, and student management
              through one secure and modern platform.
            </p>
          </div>

          {/* Footer */}
          <div className="text-sm text-white/70">
            © 2026 Aries Polytechnic College
          </div>

          {/* Blur Effects */}
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -top-24 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        </div>

        {/* Right Side */}
        <div className="flex items-center justify-center bg-gray-50 p-6">

          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white shadow-2xl overflow-hidden">

            {/* Top Gradient */}
            <div className="h-1.5 bg-gradient-to-r from-[#1e3a8a] via-[#3b82f6] to-[#60a5fa]" />

            <div className="p-8">

              {/* Mobile Header */}
              <div className="flex items-center gap-3 mb-6 lg:hidden">
                <div className="h-10 w-10 rounded-xl bg-[#1e3a8a] text-white grid place-items-center">
                  <GraduationCap className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-bold text-lg">
                    Aries Polytechnic
                  </h2>
                  <p className="text-xs text-gray-500">
                    Fees Portal
                  </p>
                </div>
              </div>

              {/* Heading */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800">
                  Welcome Back
                </h2>

                <p className="mt-2 text-gray-500">
                  Sign in to continue to your account
                </p>
              </div>

              {/* Role Toggle */}
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1 mb-7">
                {["STUDENT", "ADMIN"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r);
                      setUsername("");
                      setPassword("");
                    }}
                    className={`rounded-xl py-3 text-sm font-semibold transition-all duration-200 ${
                      role === r
                        ? "bg-white text-[#1e3a8a] shadow-md"
                        : "text-gray-500 hover:text-[#1e3a8a]"
                    }`}
                  >
                    {r === "STUDENT" ? "👤 Student" : "🔐 Admin"}
                  </button>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isSTUDENT ? "Student Mobile Number" : "Admin Mobile Number"}
                  </label>

                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={
                      isSTUDENT
                        ? "Enter student mobile number"
                        : "Enter admin mobile number"
                    }
                    autoComplete="username"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1e3a8a] focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-20 text-sm outline-none transition focus:border-[#1e3a8a] focus:ring-4 focus:ring-blue-100"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3 text-sm font-medium text-[#1e3a8a] hover:text-[#3b82f6]"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] py-3 font-semibold text-white shadow-lg transition hover:scale-[1.01] hover:shadow-xl disabled:opacity-70"
                >
                  <div className="flex items-center justify-center gap-2">
                    {loading && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}

                    {loading ? "Sending OTP..." : "Sign In"}
                  </div>
                </button>
              </form>

              {/* Footer */}
              <p className="mt-6 text-center text-xs text-gray-400">
                An OTP will be sent to your registered mobile number
              </p>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}