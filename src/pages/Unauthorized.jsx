import { useNavigate } from "react-router-dom";
import "./Unauthorized.css";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="page-center unauthorized-container">
      <div className="card unauthorized-card">
        <h2>Access Denied</h2>
        <p>
          You do not have permission to access this page.
        </p>

        <div className="unauthorized-actions">
          <button
            className="btn-primary"
            onClick={() => navigate("/")}
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
