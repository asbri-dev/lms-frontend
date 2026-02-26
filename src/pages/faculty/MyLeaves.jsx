import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import "./MyLeaves.css";

const MyLeaves = () => {
  const { user } = useAuth();

  const [leaveData, setLeaveData] = useState(null);
  const [activeTab, setActiveTab] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `http://localhost:9090/getLeaveHistory?empId=${user.employeeId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error("Failed to load leave history");
        }

        setLeaveData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.employeeId) {
      fetchLeaves();
    }
  }, [user]);

  if (loading) return <div>Loading leaves...</div>;
  if (error) return <div>{error}</div>;

  const renderDetails = () => {
    let list = [];

    if (activeTab === "PENDING")
      list = leaveData?.pendingLeaveJson || [];
    if (activeTab === "APPROVED")
      list = leaveData?.approvedLeaveJson || [];
    if (activeTab === "REJECTED")
      list = leaveData?.rejectedLeaveJson || [];

    if (!list.length) {
      return <p>No records found.</p>;
    }

    return list.map((leave, index) => (
      <div key={index} className="leave-card">
        <div>
          <h4>{leave.typeOfLeave}</h4>
          <p>
            {leave.leaveFrom} - {leave.leaveTo}
          </p>
          <p>{leave.noOfDays} day(s)</p>
          <small>Reason: {leave.reasonForLeave}</small>
        </div>

        <span className={`status ${leave.status.toLowerCase()}`}>
          {leave.status}
        </span>
      </div>
    ));
  };

  return (
    <div className="my-leaves-page">

      {/* 🔹 Summary Cards */}
      <div className="summary-cards">

        <div
          className="card clickable"
          onClick={() => setActiveTab("PENDING")}
        >
          <h4>Pending</h4>
          <span className="pending">
            {leaveData?.pendingLeaveCnt || 0}
          </span>
        </div>

        <div
          className="card clickable"
          onClick={() => setActiveTab("APPROVED")}
        >
          <h4>Approved</h4>
          <span className="approved">
            {leaveData?.approvedLeaveCnt || 0}
          </span>
        </div>

        <div
          className="card clickable"
          onClick={() => setActiveTab("REJECTED")}
        >
          <h4>Rejected</h4>
          <span className="rejected">
            {leaveData?.rejectedLeavesCnt || 0}
          </span>
        </div>

      </div>

      {/* 🔹 Detail Section */}
      <div className="details-section">
        <h3>
          {activeTab === "PENDING" && "Pending Leaves"}
          {activeTab === "APPROVED" && "Approved Leaves"}
          {activeTab === "REJECTED" && "Rejected Leaves"}
        </h3>

        {renderDetails()}
      </div>
    </div>
  );
};

export default MyLeaves;