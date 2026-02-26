import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import "./LeaveApprovals.css";

const LeaveApprovals = () => {
  const { user } = useAuth();

  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const fetchPendingLeaves = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `http://localhost:9090/admin/adminDashBoardDetails?rmEmpId=${user.employeeId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error("Failed to load pending leaves");
        }

        setPendingLeaves(data.pendingLeaves || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.employeeId) {
      fetchPendingLeaves();
    }
  }, [user]);

  const handleAction = async (leave, status) => {
    try {
      setActionLoading(leave.employeeId + leave.leaveFrom);

      const response = await fetch(
        "http://localhost:9090/approveLeaves",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            empId: leave.employeeId,
            leaveStatus: status,
            adminEmpId: user.employeeId,
            typeOfLeave: leave.typeOfLeave,
            noOfLeaves: leave.noOfDays,
            leaveFrom: leave.leaveFrom,
            leaveTo: leave.leaveTo,
            reasonForLeave: leave.reasonForLeave,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Action failed");
      }

      // ✅ Remove from UI after success
      setPendingLeaves((prev) =>
        prev.filter(
          (item) =>
            !(
              item.employeeId === leave.employeeId &&
              item.leaveFrom === leave.leaveFrom
            )
        )
      );

    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div>Loading pending approvals...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="leave-approvals">

      <h2>Pending Leave Approvals</h2>

      {pendingLeaves.length === 0 ? (
        <p>No pending requests.</p>
      ) : (
        pendingLeaves.map((leave, index) => (
          <div key={index} className="approval-card">

            <div className="approval-details">
              <h4>{leave.employeeId}</h4>
              <p>{leave.typeOfLeave}</p>
              <p>
                {leave.leaveFrom} - {leave.leaveTo}
              </p>
              <p>{leave.noOfDays} day(s)</p>
              <small>{leave.reasonForLeave}</small>
            </div>

            <div className="approval-actions">
              <button
                className="approve-btn"
                disabled={actionLoading === leave.employeeId + leave.leaveFrom}
                onClick={() => handleAction(leave, "Approved")}
              >
                ✔
              </button>

              <button
                className="reject-btn"
                disabled={actionLoading === leave.employeeId + leave.leaveFrom}
                onClick={() => handleAction(leave, "Rejected")}
              >
                ✖
              </button>
            </div>

          </div>
        ))
      )}
    </div>
  );
};

export default LeaveApprovals;