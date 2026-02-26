import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

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

      // 🔐 BACKEND LOGIN API (OTP TRIGGER)
      const response = await fetch("http://localhost:9090/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobileNumber,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // ✅ Store TEMP OTP session data (NOT AUTH TOKEN)
      sessionStorage.setItem("otpToken", data.token);
      sessionStorage.setItem("employeeId", data.employeeId);

      // ✅ Go to OTP verification page
      navigate("/otp");

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-center login-container">
      <div className="card login-card">
        {/* HEADER */}
        <div className="login-header">
          <h2>Login</h2>
          <p>Please enter your credentials</p>
        </div>

        {/* ERROR */}
        {error && <div className="alert alert-error">{error}</div>}

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="login-form-group">
            <label>Mobile Number</label>
            <input
              type="tel"
              className="input"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              disabled={isLoading}
              placeholder="Enter mobile number"
            />
          </div>

          <div className="login-form-group">
            <label>Password</label>
            <div className="login-password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder="Enter password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* BUTTON */}
          <div className="login-button">
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </div>
          {/* Forgot Password */}
<div className="login-forgot">
  <button
    type="button"
    className="link-button"
    onClick={() => navigate("/forgot-password")}
  >
    Forgot Password?
  </button>
</div>
        </form>

        {/* FOOTER */}
        <div className="login-footer">
          © 2025 Your Company
        </div>
      </div>
    </div>
  );
};

export default Login;
