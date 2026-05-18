import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";
import { GraduationCap, Loader2 } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();

  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!mobileNumber || !password) {
      setError("Mobile number and password are required");
      return;
    }

    if (!/^\d{10}$/.test(mobileNumber)) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobileNumber,
          password,
        }),
      });

      const text = await response.text();

      let data = null;

      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }

      if (response.status >= 400 && response.status < 500) {
        throw new Error(data?.message || text || "Bad request");
      }

      if (response.status === 500) {
        throw new Error("Something went wrong. Please try again later.");
      }

      if (!response.ok) {
        throw new Error("Request failed");
      }

      sessionStorage.setItem("otpToken", data.token);
      sessionStorage.setItem("employeeId", data.employeeId);
      sessionStorage.setItem("mobileNumber", mobileNumber);

      navigate("/otp");
    } catch (err) {
      if (err.message === "Failed to fetch") {
        setError("Server is unavailable. Please try again later.");
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">

      {/* Left Side */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-[#4A4A48] via-[#27999D] to-[#91DA79] text-white p-12 flex-col justify-between">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur-md grid place-items-center border border-white/10">
            <GraduationCap className="h-6 w-6" />
          </div>

          <div>
            <h1 className="font-bold text-2xl">
              Aries Polytechnic
            </h1>
            <p className="text-sm text-white/70">
              Student Portal
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-md space-y-5">
          <h2 className="text-5xl font-bold leading-tight">
            Smart & Secure Login Portal
          </h2>

          <p className="text-lg text-white/80 leading-relaxed">
            Access your student services, attendance, fees,
            and academic details through one modern portal.
          </p>
        </div>

        {/* Footer */}
        <div className="text-sm text-white/70">
          © 2025 Aries Polytechnic College
        </div>

        {/* Blur Effects */}
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -top-24 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      </div>

      {/* Right Side */}
      <div className="flex items-center justify-center p-6 bg-gray-50">

        <div className="w-full max-w-md bg-white border border-gray-200 shadow-2xl rounded-3xl overflow-hidden">

          <div className="p-8">

            {/* Mobile Logo */}
            <div className="flex items-center gap-3 mb-6 lg:hidden">
              <div className="h-10 w-10 rounded-xl bg-[#1e3a8a] text-white grid place-items-center">
                <GraduationCap className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold text-lg">
                  Aries Polytechnic
                </h2>
                <p className="text-xs text-gray-500">
                  Student Portal
                </p>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800">
                Welcome Back
              </h2>

              <p className="text-gray-500 mt-2">
                Please login using your credentials
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Mobile */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Mobile Number
                </label>

                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter mobile number"
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1e3a8a] focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Password
                </label>

                <div className="relative mt-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    placeholder="Enter password"
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

              {/* Forgot Password */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm font-medium text-[#1e3a8a] hover:text-[#3b82f6] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-gradient-to-r from-[#4A4A48] via-[#27999D] to-[#91DA79] py-3 font-semibold text-white shadow-lg transition hover:scale-[1.01] hover:shadow-xl disabled:opacity-70"
              >
                <div className="flex items-center justify-center gap-2">
                  {isLoading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {isLoading ? "Logging in..." : "Login"}
                </div>
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center text-xs text-gray-400">
              © 2025 Aries Polytechnic College
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;