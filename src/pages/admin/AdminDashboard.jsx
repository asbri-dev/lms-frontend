import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:9090/admin/adminDashBoardDetails?rmEmpId=${user.employeeId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error("Failed to load admin dashboard");
        }

        setDashboardData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.employeeId) {
      fetchDashboard();
    }
  }, [user]);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div>{error}</div>;

  const {
    totalUsers,
    pendingLeaveCnt,
    approvedLeaveCnt,
    rejectedLeavesCnt,
    pendingLeaves,
    approvedLeaves,
    rejectedLeaves,
  } = dashboardData;

  const renderList = () => {
    let list = [];

    if (activeTab === "PENDING") list = pendingLeaves;
    if (activeTab === "APPROVED") list = approvedLeaves;
    if (activeTab === "REJECTED") list = rejectedLeaves;

    if (!list || list.length === 0) {
      return <p>No records found.</p>;
    }

    return list.map((leave, index) => (
      <div key={index} className="request-card">
        <div>
          <h4>{leave.employeeId}</h4>
          <p>{leave.typeOfLeave}</p>+
          <p>
            {leave.leaveFrom} - {leave.leaveTo}
          </p>
          <p>{leave.noOfDays} day(s)</p>
          <small>{leave.reasonForLeave}</small>
        </div>
        <span className={`status ${leave.status.toLowerCase()}`}>
          {leave.status}
        </span>
      </div>
    ));
  };

  return (
    <div className="admin-dashboard">

      {/* 🔹 Welcome Section */}
      <div className="welcome-banner">
        <h2>Welcome, {user.employeeId}</h2>
        <p>You have {pendingLeaveCnt} pending leave requests to review.</p>
      </div>

      {/* 🔹 Summary Cards */}
      <div className="summary-cards">
        <div className="card">
          <h4>Total Department Faculty</h4>
          <span>{totalUsers}</span>
        </div>

        <div
          className="card clickable"
          onClick={() => setActiveTab("PENDING")}
        >
          <h4>Pending Requests</h4>
          <span className="pending">{pendingLeaveCnt}</span>
        </div>

        <div
          className="card clickable"
          onClick={() => setActiveTab("APPROVED")}
        >
          <h4>Approved This Month</h4>
          <span className="approved">{approvedLeaveCnt}</span>
        </div>

        <div
          className="card clickable"
          onClick={() => setActiveTab("REJECTED")}
        >
          <h4>Rejected This Month</h4>
          <span className="rejected">{rejectedLeavesCnt}</span>
        </div>
      </div>

      {/* 🔹 Detail Section */}
      <div className="detail-section">
        <h3>
          {activeTab === "PENDING" && "Pending Leave Requests"}
          {activeTab === "APPROVED" && "Approved Leaves"}
          {activeTab === "REJECTED" && "Rejected Leaves"}
        </h3>

        {renderList()}
      </div>
    </div>
  );
};

export default AdminDashboard;