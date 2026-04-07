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
  const [filter, setFilter] = useState("all"); // ✅ FIXED
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1); // ✅ FIXED
  const [actionMessage, setActionMessage] = useState("");

  /* 🔹 Fetch */
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:9090/admin/adminDashBoardDetails?rmEmpId=${user.employeeId}`
      );

      if (!res.ok) throw new Error("Failed to load");

      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.employeeId) fetchDashboard();
  }, [user]);

  /* 🔹 Approve / Reject */
  const handleAction = async (p, status) => {
    const key = (p.empId || "") + p.Date;
    setActionLoading(key);

    try {
      const response = await fetch("http://localhost:9090/approvePr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empId: p.empId,
          permissionType: p.permissionType,
          reasonForPermission: p.reasonForPermission,
          permissionDate: p.Date,
          permissionStatus: status,
        }),
      });

      let message = "";
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        const data = await response.json();
        message = data.message;
      } else {
        message = await response.text();
      }

      if (!response.ok) {
        setActionMessage(message || "Action failed");
      } else {
        setActionMessage(message || `Permission ${status} successfully`);
        fetchDashboard();
      }

      setTimeout(() => setActionMessage(""), 3000);
    } catch (err) {
      setActionMessage(err.message);
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

  /* 🔹 History */
  let historyData = [...approvedPermissions, ...rejectedPermissions];

  /* 🔹 FILTER (FIXED) */
  if (filter !== "all") {
    historyData = historyData.filter(
      (p) => p.status?.toLowerCase() === filter
    );
  }

  /* 🔹 SEARCH */
  historyData = historyData.filter((p) =>
    (p.empId || "").toLowerCase().includes(search.toLowerCase())
  );

  /* 🔹 PAGINATION */
  const totalPages = Math.max(
    1,
    Math.ceil(historyData.length / ITEMS_PER_PAGE)
  );

  const paginatedData = historyData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">

      {/* 🔵 Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#2b3c6b] to-[#3f548f] text-white shadow-lg">
        <h2 className="text-2xl font-bold">Permission Approvals</h2>
        <p>You have <b>{pendingPermissionCnt}</b> pending requests</p>
      </div>

      {/* 📊 Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Stat title="Approved" value={approvedPermissionCnt} color="green" />
        <Stat title="Pending" value={pendingPermissionCnt} color="yellow" />
        <Stat title="Rejected" value={rejectedPermissionCnt} color="red" />
      </div>

      {/* 🔘 Tabs */}
      <div className="flex justify-center">
        <div className="bg-gray-200 p-1 rounded-lg flex">
          {["pending", "history"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              className={`px-6 py-2 rounded ${
                activeTab === tab
                  ? "bg-[#2b3c6b] text-white"
                  : "text-gray-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 🔔 Message */}
      {actionMessage && (
        <div className="text-center p-3 bg-blue-100 text-blue-700 rounded">
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
            pendingPermissions.map((p) => {
              const key = (p.empId || "") + p.Date;
              const isLoading = actionLoading === key;

              return (
                <div
                  key={key}
                  className={`bg-white p-5 rounded-xl shadow ${
                    isLoading ? "opacity-60 pointer-events-none" : ""
                  }`}
                >
                  <p className="font-semibold">{p.empName}</p>
                  <p className="text-sm text-gray-500">ID: {p.empId}</p>

                  <p className="mt-2">
                    Type: <b>{p.permissionType}</b>
                  </p>

                  <p>Date: {p.Date}</p>

                  <p className="italic mt-1">
                    {p.reasonForPermission}
                  </p>

                  {/* Buttons */}
                  <div className="mt-3 flex gap-2 justify-end">
                    <button
                      onClick={() => handleAction(p, "Approved")}
                      disabled={isLoading}
                      className={`flex items-center gap-2 px-3 py-1 rounded text-white ${
                        isLoading
                          ? "bg-green-400"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Processing
                        </>
                      ) : (
                        "Approve"
                      )}
                    </button>

                    <button
                      onClick={() => handleAction(p, "Rejected")}
                      disabled={isLoading}
                      className={`flex items-center gap-2 px-3 py-1 rounded text-white ${
                        isLoading
                          ? "bg-red-400"
                          : "bg-red-600 hover:bg-red-700"
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Processing
                        </>
                      ) : (
                        "Reject"
                      )}
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
              <button onClick={() => { setFilter("all"); setCurrentPage(1); }}>All</button>
              <button onClick={() => { setFilter("approved"); setCurrentPage(1); }}>Approved</button>
              <button onClick={() => { setFilter("rejected"); setCurrentPage(1); }}>Rejected</button>
            </div>

            <input
              placeholder="Search Emp ID"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="border px-2 py-1"
            />
          </div>

          {/* Data */}
          {paginatedData.length === 0 ? (
            <p>No data found</p>
          ) : (
            paginatedData.map((p) => (
              <div
                key={(p.empId || "") + p.Date}
                className={`p-4 rounded ${
                  p.status === "Approved"
                    ? "bg-green-50"
                    : "bg-red-50"
                }`}
              >  

  
                <p className="font-semibold">{p.empName}</p>
                <p>ID: {p.empId}</p>
                <p>{p.permissionType}</p>
                <p>{p.Date}</p>
                <p>{p.reasonForPermission}</p>
                <p className="font-bold">{p.status}</p>
              </div>
            ))
          )}

          {/* Pagination */}
          <div className="flex justify-center gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 ${
                  currentPage === i + 1
                    ? "bg-blue-600 text-white"
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

/* 🔹 Stat Card */
const Stat = ({ title, value, color }) => {
  const map = {
    green: "text-green-600",
    yellow: "text-yellow-600",
    red: "text-red-600",
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow">
      <p className="text-sm">{title}</p>
      <p className={`text-2xl font-bold ${map[color]}`}>{value}</p>
    </div>
  );
};

export default PermissionApproval;