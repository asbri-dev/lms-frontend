import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import "./FacultyDashboard.css";

const FacultyDashboard = () => {
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:9090/getDashboardDetails?empId=${user.employeeId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load dashboard");
        }

        setDashboardData(data);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    if (user?.employeeId) {
      fetchDashboardDetails();
    }
  }, [user]);

  // 🔄 Loading State
  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  // ❌ Error State
  if (error) {
    return <div className="dashboard-error">{error}</div>;
  }

  return (
    <div className="faculty-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <h2>Welcome, {dashboardData?.employeeName},{user.employeeId}</h2>
        <p>
          Reporting Manager:{" "}
          <strong>{dashboardData?.rmName}</strong> (
          {dashboardData?.rmEmployeeId})
        </p>
      </div>

      {/* Leave Stats */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <h4>Casual Leaves</h4>
          <span>{dashboardData?.casualLeaves || 0}</span>
        </div>

        <div className="stat-card">
          <h4>Medical Leaves</h4>
          <span>{dashboardData?.medicalLeaves || 0}</span>
        </div>

        <div className="stat-card">
          <h4>Permission Requests</h4>
          <span>{dashboardData?.permissionRequests || 0}</span>
        </div>

        <div className="stat-card">
          <h4>On Duty Requests</h4>
          <span>{dashboardData?.OnDutyRequests || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
