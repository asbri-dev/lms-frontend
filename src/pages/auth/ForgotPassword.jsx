import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [empId, setEmpId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!empId) {
      setError("Employee ID is required");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        `http://localhost:9090/resetOrForgotPassword?empId=${empId}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Request failed");
      }

      setSuccess("Password reset request sent successfully");

      setTimeout(() => {
        navigate("/");
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-center forgot-container">
      <div className="card forgot-card">

        <div className="forgot-header">
          <h2>Forgot Password</h2>
          <p>Enter your Employee ID to reset password</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Employee ID</label>
            <input
              type="text"
              className="input"
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              disabled={isLoading}
              placeholder="Enter Employee ID"
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Submit"}
          </button>
        </form>

        <div className="forgot-footer">
          <button
            type="button"
            className="link-button"
            onClick={() => navigate("/")}
          >
            Back to Login
          </button>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;
