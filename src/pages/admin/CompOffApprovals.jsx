import { useEffect, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { API_BASE_URL } from "../../config/api";

const ITEMS_PER_PAGE = 5;

const CompOffApprovals = () => {
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionLoading, setActionLoading] = useState(null);

  const [activeTab, setActiveTab] = useState("pending");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Alert
  const [actionAlert, setActionAlert] = useState({
    text: "",
    type: "success",
  });

  // Reject Modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedCompOff, setSelectedCompOff] = useState(null);

  // =========================================================
  // FETCH DASHBOARD
  // =========================================================

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/admin/adminDashBoardDetails?rmEmpId=${user.employeeId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to load data");
      }

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

  // =========================================================
  // APPROVE / REJECT COMP OFF
  // =========================================================

  const handleAction = async (compOff, status) => {
    if (!compOff) return;

    try {
      const key =
        (compOff.empId || compOff.employeeId || "") +
        (compOff.workedDate || "");

      setActionLoading(key);

      const response = await fetch(`${API_BASE_URL}/approveCompOff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          empId: compOff.empId || compOff.employeeId,

          adminEmpId: user.employeeId,

          collegeLocation:
            compOff.collegeLocation ||
            compOff.location ||
            "",

          workedDate: compOff.workedDate,

          workedReason: compOff.workedReason,

          availedDate: compOff.availedDate,

          availedReason: compOff.availedReason,

          appliedOn: compOff.appliedOn,

          status: status,
        }),
      });

      // =====================================================
      // READ RESPONSE
      // =====================================================

      let message = "";

      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();

        message =
          data.message ||
          data.msg ||
          JSON.stringify(data);
      } else {
        message = await response.text();
      }

      // =====================================================
      // RESPONSE HANDLING
      // =====================================================

      if (!response.ok) {
        setActionAlert({
          text: message || "Action failed",
          type: "error",
        });
      } else {
        setActionAlert({
          text:
            message ||
            `Comp-Off ${status} successfully`,
          type: "success",
        });
      }

      // Clear alert after 3 seconds
      setTimeout(() => {
        setActionAlert({
          text: "",
          type: "success",
        });
      }, 3000);

    } catch (err) {
      setActionAlert({
        text: err.message || "Something went wrong",
        type: "error",
      });

      setTimeout(() => {
        setActionAlert({
          text: "",
          type: "success",
        });
      }, 3000);

    } finally {
      // =====================================================
      // REFRESH DASHBOARD
      // =====================================================

      try {
        const refresh = await fetch(
          `${API_BASE_URL}/admin/adminDashBoardDetails?rmEmpId=${user.employeeId}`
        );

        if (refresh.ok) {
          const refreshedData = await refresh.json();

          setDashboardData(refreshedData);
        }
      } catch (refreshErr) {
        console.error(
          "Failed to refresh data:",
          refreshErr
        );
      }

      setActionLoading(null);

      // Close reject modal
      if (status === "Rejected") {
        setShowRejectModal(false);
        setSelectedCompOff(null);
      }
    }
  };

  // =========================================================
  // LOADING UI
  // =========================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">

          <div className="w-10 h-10 border-4 border-[#2b3c6b] border-t-transparent rounded-full animate-spin"></div>

          <p className="text-gray-500 font-medium">
            Loading Comp-Off Approvals...
          </p>

        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR UI
  // =========================================================

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">

        <div className="bg-red-50 p-6 rounded-xl border border-red-100 text-center shadow-sm">

          <p className="text-red-600 font-semibold text-lg">
            Failed to load
          </p>

          <p className="text-red-500 text-sm mt-1">
            {error}
          </p>

        </div>

      </div>
    );
  }

  // =========================================================
  // BACKEND DATA
  // =========================================================

  const {
    pendingCompOffs = [],
    approvedCompOffs = [],
    rejectedCompOffs = [],

    pendingCompOffsCnt = 0,
    approvedCompOffsCnt = 0,
    rejectedCompOffsCnt = 0,
  } = dashboardData || {};

  // =========================================================
  // HISTORY
  // =========================================================

  let historyData = [
    ...approvedCompOffs,
    ...rejectedCompOffs,
  ];

  // Filter
  if (filter === "approved") {
    historyData = historyData.filter(
      (item) => item.status === "Approved"
    );
  }

  if (filter === "rejected") {
    historyData = historyData.filter(
      (item) => item.status === "Rejected"
    );
  }

  // Search
  historyData = historyData.filter((item) => {
    const employeeId =
      item.empId ||
      item.employeeId ||
      "";

    const employeeName =
      item.empName ||
      "";

    return (
      employeeId
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      employeeName
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  });

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages =
    Math.ceil(
      historyData.length / ITEMS_PER_PAGE
    ) || 1;

  const paginatedData =
    historyData.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className="p-6 md:p-8 bg-[#f8fafc] min-h-screen font-sans text-gray-800">

      <div className="max-w-7xl mx-auto space-y-8">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-[#2b3c6b] to-[#445b9c] text-white shadow-lg">

          <div className="relative z-10">

            <h2 className="text-3xl font-bold tracking-tight mb-2">
              Comp-Off Approvals
            </h2>

            <p className="text-blue-100 text-lg">

              You have{" "}

              <span className="font-bold text-white">
                {pendingCompOffsCnt}
              </span>{" "}

              Comp-Off request
              {pendingCompOffsCnt !== 1 ? "s" : ""}{" "}
              requiring your attention.

            </p>

          </div>

          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-5 rounded-full blur-2xl"></div>

        </div>

        {/* =====================================================
            STATS CARDS
        ====================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {[
            {
              title: "Pending Requests",
              count: pendingCompOffsCnt,
              color: "text-amber-500",
              bg: "bg-amber-50",
            },

            {
              title: "Approved Comp-Offs",
              count: approvedCompOffsCnt,
              color: "text-emerald-500",
              bg: "bg-emerald-50",
            },

            {
              title: "Rejected Comp-Offs",
              count: rejectedCompOffsCnt,
              color: "text-rose-500",
              bg: "bg-rose-50",
            },
          ].map((stat, index) => (

            <div
              key={index}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between transition hover:shadow-md"
            >

              <div>

                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  {stat.title}
                </h3>

                <p
                  className={`text-4xl font-bold mt-2 ${stat.color}`}
                >
                  {stat.count}
                </p>

              </div>

              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg}`}
              >

                <svg
                  className={`w-6 h-6 ${stat.color}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />

                </svg>

              </div>

            </div>

          ))}

        </div>

        {/* =====================================================
            ALERT
        ====================================================== */}

        {actionAlert.text && (

          <div className="flex items-center justify-center">

            <div
              className={`px-6 py-3 rounded-full text-sm font-semibold shadow-md border ${
                actionAlert.type === "error"
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              {actionAlert.text}
            </div>

          </div>

        )}

        {/* =====================================================
            TABS
        ====================================================== */}

        <div className="flex justify-center">

          <div className="bg-gray-200 p-1 rounded-xl flex space-x-1 shadow-inner">

            <button
              onClick={() => {
                setActiveTab("pending");
                setCurrentPage(1);
              }}
              className={`px-8 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === "pending"
                  ? "bg-white text-[#2b3c6b] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Pending Approvals
            </button>

            <button
              onClick={() => {
                setActiveTab("history");
                setCurrentPage(1);
              }}
              className={`px-8 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === "history"
                  ? "bg-white text-[#2b3c6b] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Approval History
            </button>

          </div>

        </div>

        {/* =====================================================
            PENDING TAB
        ====================================================== */}

        {activeTab === "pending" && (

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {pendingCompOffs.length === 0 ? (

              <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-gray-300">

                <svg
                  className="w-12 h-12 text-gray-300 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />

                </svg>

                <p className="text-gray-500 font-medium">
                  No pending Comp-Off requests!
                  You're all caught up.
                </p>

              </div>

            ) : (

              pendingCompOffs.map(
                (compOff, index) => {

                  const key =
                    (compOff.empId ||
                      compOff.employeeId ||
                      "") +
                    (compOff.workedDate || "");

                  const isLoading =
                    actionLoading === key;

                  return (

                    <div
                      key={index}
                      className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                    >

                      {/* ===============================
                          EMPLOYEE
                      ================================ */}

                      <div>

                        <div className="flex items-start justify-between mb-5">

                          <div className="flex items-center space-x-4">

                            <div className="w-10 h-10 rounded-full bg-blue-100 text-[#2b3c6b] flex items-center justify-center font-bold text-lg">

                              {(
                                compOff.empName ||
                                "U"
                              ).charAt(0)}

                            </div>

                            <div>

                              <p className="text-lg font-bold text-gray-900">
                                {compOff.empName ||
                                  "Unknown Employee"}
                              </p>

                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ID:{" "}
                                {compOff.empId ||
                                  compOff.employeeId ||
                                  "N/A"}
                              </p>

                            </div>

                          </div>

                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                            Comp-Off
                          </span>

                        </div>

                        {/* ===============================
                            DETAILS
                        ================================ */}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

                          {/* Worked Date */}

                          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">

                            <p className="text-xs text-gray-500 mb-1">
                              Worked Date
                            </p>

                            <p className="text-sm font-semibold text-gray-800">
                              {compOff.workedDate ||
                                "N/A"}
                            </p>

                          </div>

                          {/* Availed Date */}

                          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">

                            <p className="text-xs text-gray-500 mb-1">
                              Availed Date
                            </p>

                            <p className="text-sm font-semibold text-gray-800">
                              {compOff.availedDate ||
                                "N/A"}
                            </p>

                          </div>

                        </div>

                        {/* Worked Reason */}

                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mb-3">

                          <p className="text-xs text-gray-500 mb-1">
                            Worked Reason
                          </p>

                          <p
                            className="text-sm font-medium text-gray-800 line-clamp-3"
                            title={
                              compOff.workedReason
                            }
                          >
                            {compOff.workedReason ||
                              "No reason provided"}
                          </p>

                        </div>

                        {/* Availed Reason */}

                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">

                          <p className="text-xs text-gray-500 mb-1">
                            Availed Reason
                          </p>

                          <p
                            className="text-sm font-medium text-gray-800 line-clamp-3"
                            title={
                              compOff.availedReason
                            }
                          >
                            {compOff.availedReason ||
                              "No reason provided"}
                          </p>

                        </div>

                        {/* Applied On */}

                        <p className="text-xs text-gray-400 mt-3">
                          Applied On:{" "}
                          {compOff.appliedOn ||
                            "N/A"}
                        </p>

                      </div>

                      {/* ===============================
                          ACTION BUTTONS
                      ================================ */}

                      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-5">

                        <button
                          onClick={() => {
                            setSelectedCompOff(
                              compOff
                            );
                            setShowRejectModal(
                              true
                            );
                          }}
                          disabled={isLoading}
                          className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-rose-600 transition disabled:opacity-50"
                        >
                          Reject
                        </button>

                        <button
                          onClick={() =>
                            handleAction(
                              compOff,
                              "Approved"
                            )
                          }
                          disabled={isLoading}
                          className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-[#2b3c6b] text-white hover:bg-[#394d8a] transition shadow-sm disabled:opacity-50"
                        >
                          {isLoading
                            ? "Processing..."
                            : "Approve Comp-Off"}
                        </button>

                      </div>

                    </div>

                  );
                }
              )

            )}

          </div>

        )}

        {/* =====================================================
            HISTORY TAB
        ====================================================== */}

        {activeTab === "history" && (

          <div className="space-y-6">

            {/* FILTER + SEARCH */}

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">

              <div className="flex p-1 bg-gray-100 rounded-lg space-x-1">

                {[
                  "all",
                  "approved",
                  "rejected",
                ].map((f) => (

                  <button
                    key={f}
                    onClick={() => {
                      setFilter(f);
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition ${
                      filter === f
                        ? "bg-white shadow-sm text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {f}
                  </button>

                ))}

              </div>

              {/* SEARCH */}

              <div className="relative w-full md:w-72">

                <svg
                  className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />

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

            {/* =================================================
                HISTORY TABLE
            ================================================== */}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

              <div className="overflow-x-auto">

                <table className="w-full text-left border-collapse">

                  <thead>

                    <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">

                      <th className="px-6 py-4 font-semibold">
                        Employee Details
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Worked Date
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Availed Date
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Worked Reason
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Status
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-gray-100">

                    {paginatedData.length === 0 ? (

                      <tr>

                        <td
                          colSpan="5"
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          No history records found.
                        </td>

                      </tr>

                    ) : (

                      paginatedData.map(
                        (compOff, index) => (

                          <tr
                            key={index}
                            className="hover:bg-gray-50 transition-colors"
                          >

                            {/* Employee */}

                            <td className="px-6 py-4">

                              <p className="font-semibold text-gray-900">
                                {compOff.empName ||
                                  "N/A"}
                              </p>

                              <p className="text-xs text-gray-500">
                                ID:{" "}
                                {compOff.empId ||
                                  compOff.employeeId ||
                                  "N/A"}
                              </p>

                            </td>

                            {/* Worked Date */}

                            <td className="px-6 py-4">

                              <p className="text-sm font-medium text-gray-800">
                                {compOff.workedDate ||
                                  "N/A"}
                              </p>

                            </td>

                            {/* Availed Date */}

                            <td className="px-6 py-4">

                              <p className="text-sm font-medium text-gray-800">
                                {compOff.availedDate ||
                                  "N/A"}
                              </p>

                            </td>

                            {/* Worked Reason */}

                            <td className="px-6 py-4 max-w-xs">

                              <p
                                className="text-sm text-gray-700 line-clamp-2"
                                title={
                                  compOff.workedReason
                                }
                              >
                                {compOff.workedReason ||
                                  "N/A"}
                              </p>

                            </td>

                            {/* Status */}

                            <td className="px-6 py-4">

                              <span
                                className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${
                                  compOff.status ===
                                  "Approved"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-rose-50 text-rose-700 border-rose-200"
                                }`}
                              >
                                {compOff.status}
                              </span>

                            </td>

                          </tr>

                        )
                      )

                    )}

                  </tbody>

                </table>

              </div>

              {/* =================================================
                  PAGINATION
              ================================================== */}

              {totalPages > 1 && (

                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">

                  <p className="text-sm text-gray-500">

                    Showing{" "}

                    <span className="font-medium text-gray-900">
                      {historyData.length === 0
                        ? 0
                        : (currentPage - 1) *
                            ITEMS_PER_PAGE +
                          1}
                    </span>{" "}

                    to{" "}

                    <span className="font-medium text-gray-900">
                      {Math.min(
                        currentPage *
                          ITEMS_PER_PAGE,
                        historyData.length
                      )}
                    </span>{" "}

                    of{" "}

                    <span className="font-medium text-gray-900">
                      {historyData.length}
                    </span>{" "}

                    results

                  </p>

                  <div className="flex space-x-1">

                    {[...Array(totalPages)].map(
                      (_, i) => (

                        <button
                          key={i}
                          onClick={() =>
                            setCurrentPage(i + 1)
                          }
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition ${
                            currentPage === i + 1
                              ? "bg-[#2b3c6b] text-white"
                              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {i + 1}
                        </button>

                      )
                    )}

                  </div>

                </div>

              )}

            </div>

          </div>

        )}

        {/* =====================================================
            REJECT MODAL
        ====================================================== */}

        {showRejectModal && selectedCompOff && (

          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">

            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

              {/* Header */}

              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">

                <h3 className="text-lg font-bold text-gray-900">
                  Reject Comp-Off Request
                </h3>

                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedCompOff(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >

                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />

                  </svg>

                </button>

              </div>

              {/* Body */}

              <div className="p-6">

                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to reject this Comp-Off
                  request?
                </p>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2">

                  <p className="text-sm">
                    <span className="font-semibold">
                      Employee:
                    </span>{" "}
                    {selectedCompOff.empName ||
                      "N/A"}
                  </p>

                  <p className="text-sm">
                    <span className="font-semibold">
                      Employee ID:
                    </span>{" "}
                    {selectedCompOff.empId ||
                      selectedCompOff.employeeId ||
                      "N/A"}
                  </p>

                  <p className="text-sm">
                    <span className="font-semibold">
                      Worked Date:
                    </span>{" "}
                    {selectedCompOff.workedDate ||
                      "N/A"}
                  </p>

                  <p className="text-sm">
                    <span className="font-semibold">
                      Availed Date:
                    </span>{" "}
                    {selectedCompOff.availedDate ||
                      "N/A"}
                  </p>

                </div>

              </div>

              {/* Buttons */}

              <div className="p-6 pt-0 flex justify-end gap-3">

                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedCompOff(null);
                  }}
                  className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={() =>
                    handleAction(
                      selectedCompOff,
                      "Rejected"
                    )
                  }
                  disabled={actionLoading !== null}
                  className="px-5 py-2.5 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 transition shadow-sm disabled:opacity-50"
                >
                  {actionLoading
                    ? "Processing..."
                    : "Confirm Rejection"}
                </button>

              </div>

            </div>

          </div>

        )}

      </div>

    </div>
  );
};

export default CompOffApprovals;