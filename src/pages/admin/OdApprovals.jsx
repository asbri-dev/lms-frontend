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

  /* 🔹 Fetch Dashboard */
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

  useEffect(() => {
    if (user?.employeeId) {
      fetchDashboard();
    }
  }, [user]);

  /* 🔹 Approve / Reject */
  const handleAction = async (od, status) => {
    const key = (od.empId || "") + od.appliedOn;
    setActionLoading(key);

    try {
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
          reason: od.reason,
          status: status,
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

      if (!response.ok) {
        setActionMessage(message || "Action failed");
      } else {
        setActionMessage(message || `OD ${status} successfully`);
        fetchDashboard(); // refresh
      }

      setTimeout(() => setActionMessage(""), 3000);
    } catch (err) {
      setActionMessage(err.message);
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

  /* 🔹 History Data */
  let historyData = [...approvedOds, ...rejectedOds];

  /* 🔹 Filter */
  if (filter === "approved") {
    historyData = historyData.filter((o) => o.status === "Approved");
  } else if (filter === "rejected") {
    historyData = historyData.filter((o) => o.status === "Rejected");
  }

  /* 🔹 Search */
  historyData = historyData.filter((o) =>
    (o.empId || "").toLowerCase().includes(search.toLowerCase())
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
          <span className="font-semibold">{pendingOdsCnt}</span> pending OD
          requests.
        </p>
      </div>

      {/* 📊 Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Approved" value={approvedOdsCnt} color="green" />
        <StatCard title="Pending" value={pendingOdsCnt} color="yellow" />
        <StatCard title="Rejected" value={rejectedOdsCnt} color="red" />
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
                  ? "bg-[#2b3c6b] text-white"
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
            <p className="text-center text-gray-500">
              No pending OD requests
            </p>
          ) : (
            pendingOds.map((od) => {
              const key = (od.empId || "") + od.appliedOn;
              const isLoading = actionLoading === key;

              return (
                <div
  key={key}
  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
>
  {/* Top Section */}
  <div className="flex items-start justify-between">
    <div>
      <p className="text-base font-semibold text-gray-800">
        {od.empName || "-"}
      </p>
      <p className="text-xs text-gray-500">
        ID: {od.empId || "N/A"}
      </p>
    </div>

    {/* OD Badge */}
    <span className="text-xs font-medium px-3 py-1 rounded-full bg-purple-100 text-purple-700">
      On Duty
    </span>
  </div>

  {/* Divider */}
  <div className="border-t border-gray-100 my-4" />

  {/* Details Section */}
  <div className="space-y-3 text-sm">
    <div>
      <p className="text-gray-500 text-xs">Duration</p>
      <p className="font-medium text-gray-700">
        {od.onDutyFrom} <span className="mx-1">→</span> {od.onDutyTo}
      </p>
    </div>

    <div>
      <p className="text-gray-500 text-xs">Applied On</p>
      <p className="font-medium text-gray-700">
        {new Date(od.appliedOn).toLocaleString()}
      </p>
    </div>

    {od.reason && (
      <div>
        <p className="text-gray-500 text-xs">Reason</p>
        <p className="text-gray-700 line-clamp-2">
          {od.reason}
        </p>
      </div>
    )}
  </div>

  {/* Actions */}
  <div className="mt-5 flex justify-end gap-2">
    <button
      onClick={() => handleAction(od, "Approved")}
      disabled={isLoading}
      className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50"
    >
      {isLoading ? "..." : "Approve"}
    </button>

    <button
      onClick={() => handleAction(od, "Rejected")}
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
          {/* Filter + Search */}
          <div className="flex justify-between">
            <div className="space-x-2">
              <button onClick={() => setFilter("all")}>All</button>
              <button onClick={() => setFilter("approved")}>
                Approved
              </button>
              <button onClick={() => setFilter("rejected")}>
                Rejected
              </button>
            </div>

            <input
              type="text"
              placeholder="Search Emp ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border px-2 py-1"
            />
          </div>

          {/* Data */}
          {paginatedData.length === 0 ? (
            <p>No data found</p>
          ) : (
            paginatedData.map((od) => (
              <div
                key={(od.empId || "") + od.appliedOn}
                className={`p-4 rounded ${
                  od.status === "Approved"
                    ? "bg-green-50"
                    : "bg-red-50"
                }`}
              >
                <p className="font-semibold">{od.empName}</p>
                <p>ID: {od.empId}</p>

                <p>
                  {od.onDutyFrom} → {od.onDutyTo}
                </p>
                <p className="text-xs">
                  Applied:{" "}
                  {new Date(od.appliedOn).toLocaleString()}
                </p>

                <p className="font-semibold mt-2">{od.status}</p>
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

/* 🔹 Reusable Stat Card */
const StatCard = ({ title, value, color }) => {
  const colors = {
    green: "text-green-600",
    yellow: "text-yellow-600",
    red: "text-red-600",
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <h3 className="text-sm text-gray-600">{title}</h3>
      <p className={`text-2xl font-bold ${colors[color]}`}>
        {value}
      </p>
    </div>
  );
};

export default OdApprovals;