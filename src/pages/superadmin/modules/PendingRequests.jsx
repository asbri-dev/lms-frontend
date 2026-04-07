import { useEffect, useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";

const getLocation = (employeeId) => {
  if (!employeeId) return "Unknown";
  if (employeeId.startsWith("AREP")) return "Palakkad";
  if (employeeId.startsWith("AREC")) return "Chittoor";
  return "Unknown";
};

const REQUEST_TYPES = ["All", "Leave", "Permission", "OD"];
const LOCATIONS     = ["All", "Palakkad", "Chittoor"];

const StatusBadge = ({ status }) => {
  const map = {
    Pending:  "bg-amber-100 text-amber-700",
    Approved: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] || "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
};

const TypeBadge = ({ type }) => {
  const map = {
    Leave:      "bg-purple-100 text-purple-700",
    Permission: "bg-blue-100 text-blue-700",
    OD:         "bg-yellow-100 text-yellow-700",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[type] || "bg-gray-100 text-gray-500"}`}>
      {type}
    </span>
  );
};

/* ─── Single Request Card ─── */
const RequestCard = ({ req, onApprove, onReject, actionable }) => {
  const [acting, setActing] = useState(false);
  const loc = getLocation(req.employeeId);

  const handle = async (action) => {
    setActing(true);
    await (action === "approve" ? onApprove(req) : onReject(req));
    setActing(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 hover:border-indigo-200 transition-colors">

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-800">{req.employeeName}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              loc === "Palakkad" ? "bg-green-100 text-green-700" :
              loc === "Chittoor" ? "bg-orange-100 text-orange-700" :
              "bg-gray-100 text-gray-500"
            }`}>{loc}</span>
            <TypeBadge type={req.requestType} />
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{req.employeeId} · {req.department}</div>
        </div>
        <StatusBadge status={req.status} />
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
        {req.fromDate && (
          <div><span className="text-gray-400">From:</span> {req.fromDate}</div>
        )}
        {req.toDate && (
          <div><span className="text-gray-400">To:</span> {req.toDate}</div>
        )}
        {req.duration && (
          <div><span className="text-gray-400">Duration:</span> {req.duration}</div>
        )}
        {req.leaveType && (
          <div><span className="text-gray-400">Type:</span> {req.leaveType}</div>
        )}
      </div>

      {/* Reason */}
      {req.reason && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          <span className="text-gray-400">Reason: </span>{req.reason}
        </div>
      )}

      {/* Admin info (All Requests tab) */}
      {req.handledBy && (
        <div className="text-xs text-gray-400 border-t border-gray-100 pt-2">
          Handled by: <span className="text-gray-600 font-medium">{req.handledBy}</span>
        </div>
      )}

      {/* Actions (Needs Approval tab) */}
      {actionable && req.status === "Pending" && (
        <div className="flex gap-2 pt-1 border-t border-gray-100">
          <button
            onClick={() => handle("approve")}
            disabled={acting}
            className="flex-1 text-xs font-medium py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {acting ? "..." : "Approve"}
          </button>
          <button
            onClick={() => handle("reject")}
            disabled={acting}
            className="flex-1 text-xs font-medium py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {acting ? "..." : "Reject"}
          </button>
        </div>
      )}
    </div>
  );
};

/* ─── Main Component ─── */
const PendingRequests = () => {
  const [tab, setTab]           = useState("approval"); // "approval" | "all"
  const [approvalData, setApprovalData] = useState([]);
  const [allData, setAllData]           = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [reqType, setReqType]   = useState("All");
  const [location, setLocation] = useState("All");
  const [search, setSearch]     = useState("");

  const token = sessionStorage.getItem("authToken");

  const fetchApproval = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("http://localhost:9090/getSuperAdminPendingRequests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      setApprovalData(json.requests || []);
    } catch (e) {
      setError(e.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("http://localhost:9090/getAllRequests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      setAllData(json.requests || []);
    } catch (e) {
      setError(e.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (tab === "approval") fetchApproval();
    else fetchAll();
  }, [tab, fetchApproval, fetchAll]);

  const activeData = tab === "approval" ? approvalData : allData;

  const filtered = useMemo(() => {
    return activeData.filter((r) => {
      const s = search.toLowerCase();
      const matchSearch =
        !search ||
        r.employeeName?.toLowerCase().includes(s) ||
        r.employeeId?.toLowerCase().includes(s);
      const matchType = reqType === "All" || r.requestType === reqType;
      const matchLoc  = location === "All" || getLocation(r.employeeId) === location;
      return matchSearch && matchType && matchLoc;
    });
  }, [activeData, search, reqType, location]);

  const handleApprove = async (req) => {
    try {
      const res = await fetch("http://localhost:9090/approveRequest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId: req.requestId, action: "Approved" }),
      });
      if (!res.ok) throw new Error("Failed to approve");
      toast.success(`Approved ${req.employeeName}'s request`);
      setApprovalData((prev) => prev.filter((r) => r.requestId !== req.requestId));
    } catch {
      toast.error("Failed to approve request");
    }
  };

  const handleReject = async (req) => {
    try {
      const res = await fetch("http://localhost:9090/approveRequest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId: req.requestId, action: "Rejected" }),
      });
      if (!res.ok) throw new Error("Failed to reject");
      toast.success(`Rejected ${req.employeeName}'s request`);
      setApprovalData((prev) => prev.filter((r) => r.requestId !== req.requestId));
    } catch {
      toast.error("Failed to reject request");
    }
  };

  const retry = tab === "approval" ? fetchApproval : fetchAll;

  return (
    <div className="space-y-5">

      {/* ─── Tabs ─── */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab("approval")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "approval"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Needs my approval
          {approvalData.filter((r) => r.status === "Pending").length > 0 && (
            <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              {approvalData.filter((r) => r.status === "Pending").length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("all")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "all"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          All requests
        </button>
      </div>

      {/* ─── Controls ─── */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded-md text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <select
          value={reqType}
          onChange={(e) => setReqType(e.target.value)}
          className="border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {REQUEST_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
        </select>
        {filtered.length !== activeData.length && (
          <span className="text-xs text-gray-400 ml-auto">
            {filtered.length} of {activeData.length} requests
          </span>
        )}
      </div>

      {/* ─── Error ─── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <span>⚠</span> {error}
          <button onClick={retry} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {/* ─── Skeleton ─── */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-xl p-4 animate-pulse space-y-3">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-5 bg-gray-100 rounded w-16" />
              </div>
              <div className="h-3 bg-gray-100 rounded w-1/3" />
              <div className="h-8 bg-gray-100 rounded" />
              <div className="flex gap-2">
                <div className="flex-1 h-7 bg-gray-200 rounded-lg" />
                <div className="flex-1 h-7 bg-gray-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Empty ─── */}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3">✅</div>
          <div className="text-sm">
            {tab === "approval" ? "No pending requests to approve" : "No requests found"}
          </div>
        </div>
      )}

      {/* ─── Cards ─── */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((req) => (
            <RequestCard
              key={req.requestId}
              req={req}
              actionable={tab === "approval"}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingRequests;
