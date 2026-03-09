import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

    try {
      setIsLoading(true);

      const response = await fetch("http://localhost:9090/login", {
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

if (!response.ok) {
  throw new Error(
    data?.message || text || "Login failed"
  );
}

      sessionStorage.setItem("otpToken", data.token);
      sessionStorage.setItem("employeeId", data.employeeId);

      navigate("/otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2b3c6b] to-[#3f548f] p-4">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Login
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Please enter your credentials
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 text-red-600 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Mobile Number */}
          <div>
            <label className="text-sm text-gray-600 font-medium">
              Mobile Number
            </label>

            <input
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              disabled={isLoading}
              placeholder="Enter mobile number"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 
                         focus:outline-none focus:ring-2 focus:ring-[#3f548f]"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm text-gray-600 font-medium">
              Password
            </label>

            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder="Enter password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 
                           focus:outline-none focus:ring-2 focus:ring-[#3f548f]"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2 text-sm text-[#2b3c6b]"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#2b3c6b] text-white py-2 rounded-lg 
                       hover:bg-[#3f548f] transition font-medium"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>

          {/* Forgot Password */}
          <div className="text-right">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-sm text-[#2b3c6b] hover:underline"
            >
              Forgot Password?
            </button>
          </div>

        </form>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 mt-6">
          © 2025 Your Company
        </div>

      </div>
    </div>
  );
};

export default Login;