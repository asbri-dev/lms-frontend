import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";

const ITEMS_PER_PAGE = 5;

const OdApprovals = () => {
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

  /* 🔹 Fetch Function (Reusable) */
 useEffect(() => {
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:9090/admin/adminDashBoardDetails?rmEmpId=${user.employeeId}`
      );

      if (!response.ok) throw new Error("Failed to load data");

      const data = await response.json();
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

  /* 🔹 Approve / Reject */
 const handleAction = async (od, status) => {
  try {
    const key = (od.employeeId || "") + od.date;
    setActionLoading(key);

    const response = await fetch("http://localhost:9090/odApprove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        adminEmpId: user.employeeId,
        empId: od.empId,
        onDutyFrom: od.onDutyFrom,
        onDutyTo: od.onDutyTo,
        sessionFrom: od.sessionFrom,
        sessionTo: od.sessionTo,
        appliedOn: od.appliedOn,
        noOfDays: od.noOfDays,
        reaseon: od.reason,
        status: status
      
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
  /* 🔹 Loading / Error */
  if (loading)
    return <div className="text-center mt-10">Loading OD requests...</div>;

  if (error)
    return <div className="text-center text-red-600">{error}</div>;

  /* 🔹 Backend Mapping */
  const {
    approvedOds = [],
    pendingOds = [],
    rejectedOds = [],
    approvedOdsCnt = 0,
    pendingOdsCnt = 0,
    rejectedOdsCnt = 0,
  } = dashboardData || {};

  /* 🔹 History */
  let historyData = [...approvedOds, ...rejectedOds];

  /* 🔹 Filter */
  if (filter === "approved") {
    historyData = historyData.filter((o) => o.status === "Approved");
  } else if (filter === "rejected") {
    historyData = historyData.filter((o) => o.status === "Rejected");
  }

  /* 🔹 Search */
  historyData = historyData.filter((o) =>
    (o.employeeId || "").toLowerCase().includes(search.toLowerCase())
  );

  /* 🔹 Pagination */
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
        <h2 className="text-2xl font-bold mb-2">OD Approvals</h2>
        <p>
          You have{" "}
          <span className="font-semibold">{pendingOdsCnt}</span> pending OD requests.
        </p>
      </div>

      {/* 📊 Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-sm text-gray-600">Approved</h3>
          <p className="text-2xl font-bold text-green-600">{approvedOdsCnt}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-sm text-gray-600">Pending</h3>
          <p className="text-2xl font-bold text-yellow-600">{pendingOdsCnt}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-sm text-gray-600">Rejected</h3>
          <p className="text-2xl font-bold text-red-600">{rejectedOdsCnt}</p>
        </div>
      </div>

      {/* 🔘 Tabs */}
      <div className="flex justify-center">
        <div className="bg-gray-200 p-1 rounded-lg flex">
          {["pending", "history"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg ${
                activeTab === tab
                  ? "bg-[#2b3c6b] text-white shadow"
                  : "text-gray-600"
              }`}
            >
              {tab === "pending" ? "Pending" : "History"}
            </button>
          ))}
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
          {pendingOds.length === 0 ? (
            <p className="text-center text-gray-500">No pending OD requests</p>
          ) : (
            pendingOds.map((od) => {
              const key = (od.employeeId || "") + od.date;
              const isLoading = actionLoading === key;

              return (
                <div key={key} className="bg-white p-4 rounded-xl shadow">
                  <p className="font-semibold">{od.employeeId}</p>
                  <p>{"OD"}</p>
                  <p>{od.date || "_"}</p>
                  <p>{od.onDutyFrom} → {od.onDutyTo}</p>

                  <div className="mt-2 space-x-2">
                    <button
                      onClick={() => handleAction(od, "Approved")}
                      disabled={isLoading}
                      className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50"
                    >
                      {isLoading ? "Processing..." : "Approve"}
                    </button>

                    <button
                      onClick={() => handleAction(od, "Rejected")}
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
            paginatedData.map((od) => (
              <div
                key={(od.employeeId || "") + od.date}
                className={`p-4 rounded-lg ${
                  od.status === "Approved"
                    ? "bg-green-50"
                    : "bg-red-50"
                }`}
              >
                <p className="font-semibold">{od.employeeId}</p>
                <p>{od.onDutyTo}</p>
                <p>{od.date}</p>
                <p>{od.timeFrom} → {od.timeTo}</p>
                <p className="font-semibold">{od.status}</p>
              </div>
            ))
          )}

          {/* Pagination */}
          <div className="flex justify-center space-x-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1
                    ? "bg-[#2b3c6b] text-white"
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

export default OdApprovals;