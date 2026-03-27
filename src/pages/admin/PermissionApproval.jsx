import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";

const ITEMS_PER_PAGE = 5;

const PermissionApproval = () => {
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const [activeTab, setActiveTab] = useState("pending");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState("0");
  const [actionMessage, setActionMessage] = useState("");

  // 🔹 Fetch Data
useEffect(() => {
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:9090/admin/adminDashBoardDetails?rmEmpId=${user.employeeId}`
      );

      if (!res.ok) throw new Error("Failed to load data");

      const data = await res.json();
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
  const handleAction = async (permission, status) => {
  try {
    const key = (permission.empId || "") + permission.permissionDate;
    setActionLoading(key);

    const response = await fetch("http://localhost:9090/approvePr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        empId: permission.empId,
        permissionType: permission.permissionType,
        reasonForPermission: permission.reasonForPermission,
        permissionDate: permission.Date,
        permissionStatus: status,
        
      }),
    });
let message = "";
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      message = data.message || JSON.stringify(data);
    } else {
      message = await response.text();
    }
    setTimeout(() => setActionMessage(""), 3000); // Clear message after 5 seconds

    // ✅ Handle success + error (including 400)
    if (!response.ok) {
      setActionMessage(message || "Action failed");
    } else {
      setActionMessage(message || `Leave ${status} successfully`);
    }
    setTimeout(() => setActionMessage(""), 3000); // Clear message after 5 seconds

    // ✅ Refresh data after success
    // await fetchDashboard();
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

  if (loading)
    return <div className="text-center mt-10">Loading...</div>;

  if (error)
    return <div className="text-center text-red-600">{error}</div>;

  const {
    approvedPermissions = [],
    pendingPermissions = [],
    rejectedPermissions = [],
    approvedPermissionCnt = 0,
    pendingPermissionCnt = 0,
    rejectedPermissionCnt = 0,
  } = dashboardData || {};

  // 🔹 History Combine
  let historyData = [...approvedPermissions, ...rejectedPermissions];

  // 🔹 Filter
  if (filter === "approved") {
    historyData = historyData.filter((p) => p.status === "Approved");
  } else if (filter === "rejected") {
    historyData = historyData.filter((p) => p.status === "Rejected");
  }

  // 🔹 Search
  historyData = historyData.filter((p) =>
    (p.permissionType || "")
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
        <h2 className="text-2xl font-bold mb-2">Permission Approvals</h2>
        <p>
          You have{" "}
          <span className="font-semibold">{pendingPermissionCnt}</span>{" "}
          pending permission requests.
        </p>
      </div>

      {/* 📊 Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-sm text-gray-600">Approved</h3>
          <p className="text-2xl font-bold text-green-600">
            {approvedPermissionCnt}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-sm text-gray-600">Pending</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {pendingPermissionCnt}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-sm text-gray-600">Rejected</h3>
          <p className="text-2xl font-bold text-red-600">
            {rejectedPermissionCnt}
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
          {pendingPermissions.length === 0 ? (
            <p className="text-center text-gray-500">
              No pending permissions
            </p>
          ) : (
            pendingPermissions.map((p, i) => {
              const key = (p.empId || "") + p.Date;
              const isLoading = actionLoading === key;

              return (
                <div key={i} className="bg-white p-4 rounded-xl shadow">
                  <p className="font-semibold">{p.permissionType}</p>
                  <p>{p.Date}</p>
                  <p>{p.reasonForPermission}</p>

                  <div className="mt-2 space-x-2">
                    <button
                      onClick={() => handleAction(p, "Approved")}
                      disabled={isLoading}
                      className="bg-green-600 text-white px-3 py-1 rounded"
                    >
                      {isLoading ? "Processing..." : "Approve"}
                    </button>

                    <button
                      onClick={() => handleAction(p, "Rejected")}
                      disabled={isLoading}
                      className="bg-red-600 text-white px-3 py-1 rounded"
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

          {/* Filter + Search */}
          <div className="flex justify-between">
            <div className="space-x-2">
              <button onClick={() => setFilter("all")} className="px-3 py-1 bg-gray-200 rounded">All</button>
              <button onClick={() => setFilter("approved")} className="px-3 py-1 bg-green-200 rounded">Approved</button>
              <button onClick={() => setFilter("rejected")} className="px-3 py-1 bg-red-200 rounded">Rejected</button>
            </div>

            <input
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="border px-2 rounded"
            />
          </div>

          {/* Data */}
          {paginatedData.map((p, i) => (
            <div
              key={i}
              className={`p-4 rounded ${
                p.status === "Approved"
                  ? "bg-green-50"
                  : "bg-red-50"
              }`}
            >
              <p>{p.permissionType}</p>
              <p>{p.Date}</p>
              <p>{p.reasonForPermission}</p>
              <p className="font-semibold">{p.status}</p>
            </div>
          ))}

          {/* Pagination */}
          <div className="flex justify-center space-x-2">
            {[...Array(totalPages || 1)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 ${
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

export default PermissionApproval;