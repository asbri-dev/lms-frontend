import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

const SetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const domain = searchParams.get("domain");
  const guid = searchParams.get("guid");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* Password Rules */
  const rules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[@$!%*?&]/.test(password),
  };

  const validatePassword = () =>
    rules.length &&
    rules.uppercase &&
    rules.lowercase &&
    rules.number &&
    rules.special;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (!validatePassword()) {
      setError(
        "Password must include uppercase, lowercase, number, and special character."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/set-password?domain=${domain}&guid=${guid}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to set password");
      }

      setSuccess("Password set successfully! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!domain || !guid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Invalid or expired password reset link
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center 
                    bg-gradient-to-br from-[#2b3c6b] to-[#3f548f] p-4">

      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8">

        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-2">
          Set Your Password
        </h2>

        <p className="text-gray-500 text-sm text-center mb-6">
          Create a strong password to secure your account
        </p>

        {error && (
          <div className="bg-red-100 text-red-600 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 text-green-600 text-sm p-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Password */}
          <div>
            <label className="text-sm text-gray-600 font-medium">
              New Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter strong password"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2
                         focus:outline-none focus:ring-2 focus:ring-[#3f548f]"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm text-gray-600 font-medium">
              Confirm Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2
                         focus:outline-none focus:ring-2 focus:ring-[#3f548f]"
            />
          </div>

          {/* Password Rules */}
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-sm">
            <p className="font-medium mb-2 text-gray-700">
              Password must contain:
            </p>

            <ul className="space-y-1">

              <li className={`flex items-center gap-2 ${rules.length ? "text-green-600" : "text-gray-500"}`}>
                {rules.length ? "✔" : "•"} At least 8 characters
              </li>

              <li className={`flex items-center gap-2 ${rules.uppercase ? "text-green-600" : "text-gray-500"}`}>
                {rules.uppercase ? "✔" : "•"} One uppercase letter
              </li>

              <li className={`flex items-center gap-2 ${rules.lowercase ? "text-green-600" : "text-gray-500"}`}>
                {rules.lowercase ? "✔" : "•"} One lowercase letter
              </li>

              <li className={`flex items-center gap-2 ${rules.number ? "text-green-600" : "text-gray-500"}`}>
                {rules.number ? "✔" : "•"} One number
              </li>

              <li className={`flex items-center gap-2 ${rules.special ? "text-green-600" : "text-gray-500"}`}>
                {rules.special ? "✔" : "•"} One special character (@$!%*?&)
              </li>

            </ul>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2b3c6b] hover:bg-[#3f548f]
                       text-white py-2 rounded-lg font-medium
                       transition duration-200"
          >
            {loading ? "Setting Password..." : "Set Password"}
          </button>

        </form>

      </div>
    </div>
  );
};

export default SetPassword;