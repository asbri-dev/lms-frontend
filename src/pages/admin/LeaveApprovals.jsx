import { useEffect, useState } from "react";
import { AuthProvider  } from "../../auth/AuthProvider";
import { API_BASE_URL } from "../../config/api";

const ITEMS_PER_PAGE = 5;

const LeaveApprovals = () => {
  const { user } = AuthProvider();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const [activeTab, setActiveTab] = useState("pending");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [actionMessage, setActionMessage] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
const [selectedLeave, setSelectedLeave] = useState(null);
const [rejectReason, setRejectReason] = useState("");
  

  // 🔹 Fetch Data
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/admin/adminDashBoardDetails?rmEmpId=${user.employeeId}`
        );

        const data = await response.json();
        

        if (!response.ok) throw new Error("Failed to load data");

        setDashboardData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.employeeId) fetchDashboard();
  }, [user]);

  // 🔹 Approve / Reject
  const handleAction = async (leave, status) => {
    try {
      setActionLoading((leave.employeeId || "") + leave.leaveFrom);

      const response = await fetch(`${API_BASE_URL}/approveLeaves`, {
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
          sessionFrom: leave.sessionFrom,
          sessionTo: leave.sessionTo,
        }),
      });
 // 🔥 Read response (JSON or TEXT)
    let message = "";
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      message = data.message || JSON.stringify(data);
    } else {
      message = await response.text();
    }
    setTimeout(() => setActionMessage(""), 3000); // Clear message after 3 seconds

    // ✅ Handle success + error (including 400)
    if (!response.ok) {
      setActionMessage(message || "Action failed");
    } else {
      setActionMessage(message || `Leave ${status} successfully`);
    }
    setTimeout(() => setActionMessage(""), 3000); // Clear message after 3 seconds

      // Refresh
      const refresh = await fetch(
        `${API_BASE_URL}/admin/adminDashBoardDetails?rmEmpId=${user.employeeId}`
      );
      const refreshedData = await refresh.json();
      setDashboardData(refreshedData);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // 🔹 Loading / Error
  if (loading)
    return <div className="text-center mt-10">Loading...</div>;

  if (error)
    return <div className="text-center text-red-600">{error}</div>;

  // 🔹 Backend Mapping (FIXED)
  const {
    approvedLeaves = [],
    pendingLeaves = [],
    rejectedLeaves = [],
    approvedLeaveCnt = 0,
    pendingLeaveCnt = 0,
    rejectedLeavesCnt = 0,
  } = dashboardData || {};

  // 🔹 History Data
  let historyData = [...approvedLeaves, ...rejectedLeaves];

  // 🔹 Filter
  if (filter === "approved") {
    historyData = historyData.filter((l) => l.status === "Approved");
  } else if (filter === "rejected") {
    historyData = historyData.filter((l) => l.status === "Rejected");
  }

  // 🔹 Search (SAFE)
  historyData = historyData.filter((l) =>
    (l.employeeId || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // 🔹 Pagination
  const totalPages = Math.ceil(historyData.length / ITEMS_PER_PAGE);
  const paginatedData = historyData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const handleRejectSubmit = async () => {
  if (!rejectReason.trim()) {
    setActionMessage("Reason is required");
    return;
  }

  try {
    setActionLoading(
      (selectedLeave.employeeId || "") + selectedLeave.leaveFrom
    );

    const response = await fetch(
      `${API_BASE_URL}/approveLeaves`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          empId: selectedLeave.employeeId,
          leaveStatus: "Rejected",
          adminEmpId: user.employeeId,
          typeOfLeave: selectedLeave.typeOfLeave,
          noOfLeaves: selectedLeave.noOfDays,
          leaveFrom: selectedLeave.leaveFrom,
          leaveTo: selectedLeave.leaveTo,
          reasonForLeave: selectedLeave.reasonForLeave,
          sessionFrom: selectedLeave.sessionFrom,
          sessionTo: selectedLeave.sessionTo,

          // 🔥 IMPORTANT ADD THIS
          reasonForRejection: rejectReason
        })
      }
    );

    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(data?.message || "Reject failed");
    }

    setActionMessage(data?.message || "Rejected successfully");

    setShowRejectModal(false);
    setSelectedLeave(null);

    // Refresh
    const refresh = await fetch(
      `${API_BASE_URL}/admin/adminDashBoardDetails?rmEmpId=${user.employeeId}`
    );
    const refreshedData = await refresh.json();
    setDashboardData(refreshedData);

  } catch (err) {
    setActionMessage(err.message);
  } finally {
    setActionLoading(null);
  }
};

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">

      {/* 🔵 Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#2b3c6b] to-[#3f548f] text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Leave Approvals</h2>
        <p>
          You have{" "}
          <span className="font-semibold">{pendingLeaveCnt}</span>{" "}
          pending Leave requests.
        </p>
      </div>

      {/* 📊 Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-sm text-gray-600">Approved</h3>
          <p className="text-2xl font-bold text-green-600">
            {approvedLeaveCnt}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-sm text-gray-600">Pending</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {pendingLeaveCnt}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-sm text-gray-600">Rejected</h3>
          <p className="text-2xl font-bold text-red-600">
            {rejectedLeavesCnt}
          </p>
        </div>
      </div>

      {/* 🔘 Tabs */}
      <div className="flex justify-center">
        <div className="bg-gray-200 p-1 rounded-lg flex">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-6 py-2 rounded-lg ${
              activeTab === "pending"
                ? "p-6 rounded-2xl bg-gradient-to-r from-[#2b3c6b] to-[#3f548f] text-white shadow-lg"
                : "text-gray-600"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-2 rounded-lg ${
              activeTab === "history"
                ? "p-6 rounded-2xl bg-gradient-to-r from-[#2b3c6b] to-[#3f548f] text-white shadow-lg"
                : "text-gray-600"
            }`}
          >
            History
          </button>
        </div>
      </div>
      {actionMessage && (
  <div className="text-center p-3 rounded bg-blue-100 text-blue-700">
    {actionMessage}
  </div>
)}

      {/* 🟡 Pending */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {pendingLeaves.length === 0 ? (
            <p className="text-center text-gray-500">
              No pending leaves
            </p>
          ) : (
            pendingLeaves.map((leave, index) => {
              const key = (leave.employeeId || "") + leave.leaveFrom;
              const isLoading = actionLoading === key;
              const leaveTypeMap = {
  cl: "Casual Leave",
  ml: "Medical Leave",
              };     

              return (
               <div
  key={index}
  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
>
  {/* Top Section */}
  <div className="flex items-start justify-between">
    <div>
      <p className="text-base font-semibold text-gray-800">
        {leave.empName}
      </p>
      <p className="text-xs text-gray-500">
        ID: {leave.employeeId || "N/A"}
      </p>
    </div>

    {/* Leave Type Badge */}
    <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-700">
      {leaveTypeMap[leave.typeOfLeave] || leave.typeOfLeave || "Leave"}
    </span>
  </div>

  {/* Divider */}
  <div className="border-t border-gray-100 my-3" />

  {/* Leave Duration */}
  <div className="text-sm text-gray-600 mb-3">
    <p className="font-medium text-gray-700">Duration</p>
    <p>
      {leave.leaveFrom} <span className="mx-1">→</span> {leave.leaveTo}
    </p>
  </div>

  {/* Reason (Preview + Expand) */}
  <div className="text-sm text-gray-600">
    <p className="font-medium text-gray-700 mb-1">Reason</p>
    <p className="line-clamp-2">
      {leave.reasonForLeave || "No reason provided"}
    </p>
  </div>

  {/* Actions */}
  <div className="mt-4 flex justify-end gap-2">
    <button
      onClick={() => handleAction(leave, "Approved")}
      disabled={isLoading}
      className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50"
    >
      {isLoading ? "..." : "Approve"}
    </button>

    <button
      onClick={() => {
  setSelectedLeave(leave);
  setRejectReason("");
  setShowRejectModal(true);
}}
      disabled={isLoading}
      className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50"
    >
      {isLoading ? "..." : "Reject"}
    </button>
  </div>
</div>
              );
            })
          )}
        </div>
      )}
      

      {/* 🔵 History */}
      {activeTab === "history" && (
        <div className="space-y-4">

          {/* Filters + Search */}
          <div className="flex flex-col md:flex-row justify-between gap-3">
            <div className="space-x-2">
              <button onClick={() => setFilter("all")} className="px-3 py-1 bg-gray-200 rounded">
                All
              </button>
              <button onClick={() => setFilter("approved")} className="px-3 py-1 bg-green-200 rounded">
                Approved
              </button>
              <button onClick={() => setFilter("rejected")} className="px-3 py-1 bg-red-200 rounded">
                Rejected
              </button>
            </div>

            <input
              type="text"
              placeholder="Search Employee ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="border px-3 py-1 rounded"
            />
          </div>

          {/* Data */}
          {paginatedData.length === 0 ? (
            
            <p className="text-gray-500">No data found</p>
          ) : (
            paginatedData.map((leave, index) => (
              
              <div
                key={index}
                
                className={`p-4 rounded-lg ${
                  leave.status === "Approved"
                    ? "bg-green-50"
                    : "bg-red-50"
                }`}
              >
                <p className="font-semibold">
                  {leave.employeeId || "N/A"}
                </p>
                <p className="font-semibold">
                  {leave.empName || "N/A"}
                </p>
                <p>
                  {leave.typeOfLeave=== "cl" ? "Casual Leave" : leave.typeOfLeave === "ml" ? "Medical Leave" : leave.typeOfLeave || "Leave"}
                </p>
                <p>
                  {leave.leaveFrom} → {leave.leaveTo}
                </p>
                <p className="font-semibold">{leave.status}</p>
              </div>
            ))
          )}

          {/* Pagination */}
          <div className="flex justify-center space-x-2">
            {[...Array(totalPages || 1)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1
                    ? "p-6 rounded-2xl bg-gradient-to-r from-[#2b3c6b] to-[#3f548f] text-white shadow-lg"
                    : "bg-gray-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

        </div>
      )}
      {showRejectModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg">

      <h3 className="text-lg font-semibold mb-4">
        Enter Reject Reason
      </h3>

      <textarea
        value={rejectReason}
        onChange={(e) => setRejectReason(e.target.value)}
        placeholder="Enter reason..."
        className="w-full border p-2 rounded-md mb-4"
      />

      <div className="flex justify-end gap-2">
        <button
          onClick={() => setShowRejectModal(false)}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          Cancel
        </button>

        <button
          onClick={() => handleRejectSubmit()}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Submit
        </button>
      </div>

    </div>
  </div>
)}
    </div>
  );
};

export default LeaveApprovals;