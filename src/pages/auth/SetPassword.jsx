import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./SetPassword.css";

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

  // 🔐 Password validation
  const validatePassword = (pwd) => {
    const strongRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    return strongRegex.test(pwd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (!validatePassword(password)) {
      setError(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
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
        `http://localhost:9090/set-password?domain=${domain}&guid=${guid}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password,
          }),
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

  return (
    <div className="set-password-container">
      <div className="set-password-card">
        <h2>Set Your Password</h2>

        <p className="info-text">
          Create a strong password to secure your account.
        </p>

        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter strong password"
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
            />
          </div>

          {/* Password Constraints */}
          <div className="password-constraints">
            <p>Password must contain:</p>
            <ul>
              <li>✔ At least 8 characters</li>
              <li>✔ One uppercase letter (A–Z)</li>
              <li>✔ One lowercase letter (a–z)</li>
              <li>✔ One number (0–9)</li>
              <li>✔ One special character (@$!%*?&)</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? "Setting Password..." : "Set Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetPassword;
