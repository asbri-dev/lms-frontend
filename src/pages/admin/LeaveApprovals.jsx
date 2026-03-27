import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";

const ITEMS_PER_PAGE = 5;

const LeaveApprovals = () => {
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const [activeTab, setActiveTab] = useState("pending");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [actionMessage, setActionMessage] = useState("");

  // 🔹 Fetch Data
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:9090/admin/adminDashBoardDetails?rmEmpId=${user.employeeId}`
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

      const response = await fetch("http://localhost:9090/approveLeaves", {
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
        `http://localhost:9090/admin/adminDashBoardDetails?rmEmpId=${user.employeeId}`
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

              return (
                <div key={index} className="bg-white p-4 rounded-xl shadow">
                  <p className="font-semibold">
                    {leave.employeeId || "N/A"}
                  </p>
                  <p>{leave.typeOfLeave}</p>
                  <p>
                    {leave.leaveFrom} → {leave.leaveTo}
                  </p>

                  <div className="mt-2 space-x-2">
                    <button
                      onClick={() =>
                        handleAction(leave, "Approved")
                      }
                      disabled={isLoading}
                      className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50"
                    >
                      {isLoading ? "Processing..." : "Approve"}
                    </button>

                    <button
                      onClick={() =>
                        handleAction(leave, "Rejected")
                      }
                      disabled={isLoading}
                      className="bg-red-600 text-white px-3 py-1 rounded disabled:opacity-50"
                    >
                      {isLoading ? "Processing..." : "Reject"}
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
                <p>{leave.typeOfLeave}</p>
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
    </div>
  );
};

export default LeaveApprovals;