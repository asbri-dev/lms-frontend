import { useEffect, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { API_BASE_URL } from "../../config/api";

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
  const [currentPage, setCurrentPage] = useState(1);
  
  // Updated alert state to handle colors based on success/error
  const [actionAlert, setActionAlert] = useState({ text: "", type: "success" });
  
  const [rejectModal, setRejectModal] = useState({ open: false, permission: null });
  const [rejectReason, setRejectReason] = useState("");

  /* 🔹 Fetch Dashboard (Initial Load) */
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE_URL}/admin/adminDashBoardDetails?rmEmpId=${user.employeeId}`
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
  const handleAction = async (p, status, reason = "") => {
    if (status === "Rejected" && !reason.trim()) {
      setActionAlert({ text: "Reason is required", type: "error" });
      setTimeout(() => setActionAlert({ text: "", type: "success" }), 3000);
      return;
    }
    
    const key = (p.empId || "") + p.Date;
    setActionLoading(key);

    try {
      const response = await fetch(`${API_BASE_URL}/approvePr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empId: p.empId,
          permissionType: p.permissionType,
          reasonForPermission: p.reasonForPermission,
          permissionDate: p.Date,
          permissionStatus: status,
          reasonForRejection: reason
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
        setActionAlert({ text: message || "Action failed", type: "error" });
      } else {
        setActionAlert({ text: message || `Permission ${status} successfully`, type: "success" });
      }

      setTimeout(() => setActionAlert({ text: "", type: "success" }), 3000);
    } catch (err) {
      setActionAlert({ text: err.message, type: "error" });
      setTimeout(() => setActionAlert({ text: "", type: "success" }), 3000);
    } finally {
      // 🔄 ALWAYS Refresh Data silently in the background, even if there was an error
      try {
        const refresh = await fetch(
          `${API_BASE_URL}/admin/adminDashBoardDetails?rmEmpId=${user.employeeId}`
        );
        if (refresh.ok) {
          const refreshedData = await refresh.json();
          setDashboardData(refreshedData);
        }
      } catch (refreshErr) {
        console.error("Failed to refresh data:", refreshErr);
      }

      setActionLoading(null);
      
      // Close modal and reset reason if it was a rejection flow
      if (status === "Rejected") {
        setRejectModal({ open: false, permission: null });
        setRejectReason("");
      }
    }
  };

  /* 🔹 Loading / Error */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#2b3c6b] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading Permission requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-50 p-6 rounded-xl border border-red-100 text-center shadow-sm">
          <p className="text-red-600 font-semibold text-lg">Failed to load</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  /* 🔹 Backend Mapping */
  const {
    approvedPermissions = [],
    pendingPermissions = [],
    rejectedPermissions = [],
    approvedPermissionCnt = 0,
    pendingPermissionCnt = 0,
    rejectedPermissionCnt = 0,
  } = dashboardData || {};

  /* 🔹 History Data */
  let historyData = [...approvedPermissions, ...rejectedPermissions];

  /* 🔹 Filter & Search */
  if (filter !== "all") {
    historyData = historyData.filter((p) => p.status?.toLowerCase() === filter.toLowerCase());
  }

  historyData = historyData.filter((p) =>
    (p.empId || "").toLowerCase().includes(search.toLowerCase())
  );

  /* 🔹 Pagination */
  const totalPages = Math.max(1, Math.ceil(historyData.length / ITEMS_PER_PAGE));
  const paginatedData = historyData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-6 md:p-8 bg-[#f8fafc] min-h-screen font-sans text-gray-800">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* 🔵 Header Banner */}
        <div className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-[#2b3c6b] to-[#445b9c] text-white shadow-lg">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold tracking-tight mb-2">Permission Approvals</h2>
            <p className="text-blue-100 text-lg">
              You have <span className="font-bold text-white">{pendingPermissionCnt}</span> pending permission requests.
            </p>
          </div>
          {/* Decorative background circle */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-5 rounded-full blur-2xl"></div>
        </div>

        {/* 📊 Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "Pending Requests", count: pendingPermissionCnt, color: "text-amber-500", bg: "bg-amber-50" },
            { title: "Approved Permissions", count: approvedPermissionCnt, color: "text-emerald-500", bg: "bg-emerald-50" },
            { title: "Rejected Permissions", count: rejectedPermissionCnt, color: "text-rose-500", bg: "bg-rose-50" },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between transition hover:shadow-md">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">{stat.title}</h3>
                <p className={`text-4xl font-bold mt-2 ${stat.color}`}>{stat.count}</p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg}`}>
                <svg className={`w-6 h-6 ${stat.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* 🔔 Dynamic Toast Message */}
        {actionAlert.text && (
          <div className="flex items-center justify-center">
            <div className={`px-6 py-3 rounded-full text-sm font-semibold shadow-md animate-fade-in-down border ${
              actionAlert.type === "error" 
                ? "bg-rose-50 text-rose-700 border-rose-200" 
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}>
              {actionAlert.text}
            </div>
          </div>
        )}

        {/* 🔘 Navigation Tabs */}
        <div className="flex justify-center">
          <div className="bg-gray-200 p-1 rounded-xl flex space-x-1 shadow-inner">
            {["pending", "history"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={`px-8 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-white text-[#2b3c6b] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "pending" ? "Pending Approvals" : "Approval History"}
              </button>
            ))}
          </div>
        </div>

        {/* 🟡 Pending Tab View */}
        {activeTab === "pending" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pendingPermissions.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-gray-300">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                <p className="text-gray-500 font-medium">No pending permission requests! You're all caught up.</p>
              </div>
            ) : (
              pendingPermissions.map((p) => {
                const key = (p.empId || "") + p.Date;
                const isLoading = actionLoading === key;

                return (
                  <div key={key} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-[#2b3c6b] flex items-center justify-center font-bold text-lg">
                            {p.empName?.charAt(0) || "U"}
                          </div>
                          <div>
                            <p className="text-lg font-bold text-gray-900">{p.empName || "Unknown Employee"}</p>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">ID: {p.empId || "N/A"}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100">
                          {p.permissionType || "Permission"}
                        </span>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 col-span-2">
                          <p className="text-xs text-gray-500 mb-1">Requested Date</p>
                          <p className="text-sm font-semibold text-gray-800">{p.Date}</p>
                        </div>
                      </div>

                      {/* Reason */}
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1">Reason</p>
                        <p className="text-sm font-medium text-gray-800 line-clamp-2 bg-gray-50 p-3 rounded-xl border border-gray-100" title={p.reasonForPermission}>
                          {p.reasonForPermission || "No reason provided"}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
                      <button
                        onClick={() => {
                          setRejectModal({ open: true, permission: p });
                          setRejectReason("");
                        }}
                        disabled={isLoading}
                        className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-rose-600 transition disabled:opacity-50"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleAction(p, "Approved")}
                        disabled={isLoading}
                        className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-[#2b3c6b] text-white hover:bg-[#394d8a] transition shadow-sm disabled:opacity-50"
                      >
                        {isLoading ? "Processing..." : "Approve"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 🔵 History Tab View */}
        {activeTab === "history" && (
          <div className="space-y-6">
            
            {/* Filters & Search bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex p-1 bg-gray-100 rounded-lg space-x-1">
                {["all", "approved", "rejected"].map((f) => (
                  <button
                    key={f}
                    onClick={() => { setFilter(f); setCurrentPage(1); }}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition ${
                      filter === f ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search Employee ID..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2b3c6b]/20 focus:border-[#2b3c6b] transition"
                />
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                      <th className="px-6 py-4 font-semibold">Employee Details</th>
                      <th className="px-6 py-4 font-semibold">Type</th>
                      <th className="px-6 py-4 font-semibold">Date</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                          No history records found.
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((p) => (
                        <tr key={(p.empId || "") + p.Date} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-900">{p.empName || "N/A"}</p>
                            <p className="text-xs text-gray-500">ID: {p.empId || "N/A"}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {p.permissionType || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {p.Date}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${
                              p.status === "Approved" 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <p className="text-sm text-gray-500">
                    Showing <span className="font-medium text-gray-900">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, historyData.length)}</span> of <span className="font-medium text-gray-900">{historyData.length}</span> results
                  </p>
                  <div className="flex space-x-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition ${
                          currentPage === i + 1
                            ? "bg-[#2b3c6b] text-white"
                            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ❌ Reject Modal (Backdrop Blur & Smooth UI) */}
        {rejectModal.open && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-900">Reject Permission</h3>
                <button 
                  onClick={() => setRejectModal({ open: false, permission: null })} 
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rejection <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Please provide a reason to the employee..."
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#2b3c6b]/20 focus:border-[#2b3c6b] transition min-h-[120px] resize-none"
                  autoFocus
                />
              </div>

              <div className="p-6 pt-0 flex justify-end gap-3">
                <button
                  onClick={() => setRejectModal({ open: false, permission: null })}
                  className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleAction(rejectModal.permission, "Rejected", rejectReason);
                  }}
                  disabled={!rejectReason.trim()}
                  className="px-5 py-2.5 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 transition shadow-sm disabled:opacity-50 disabled:hover:bg-rose-600"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PermissionApproval;