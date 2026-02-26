import { useNavigate } from "react-router-dom";
import "./OpeningPage.css";

const OpeningPage = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    // You can change empId logic later
    navigate("/login");
  };

  return (
    <div className="page-center opening-container">
      <div className="card opening-card">
        <div className="opening-header">
          <h1>Welcome</h1>
          <p>Employee Management Portal</p>
        </div>

        <div className="opening-action">
          <button className="btn-primary" onClick={handleLoginClick}>
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default OpeningPage;
