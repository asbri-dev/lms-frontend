import { useEffect, useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";


/* ─── Helpers ─── */
const getLocation = (id = "") => {
  if (id.startsWith("AREP")) return "Palakkad";
  if (id.startsWith("AREC")) return "Chittoor";
  return "Unknown";
};

const formatDate = (val) => {
  if (!val) return "—";
  if (val.includes("T")) {
    const d = new Date(val);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }
  return val;
};

const STATUS_STYLE = {
  Pending:   "bg-amber-100 text-amber-700",
  Approved:  "bg-green-100 text-green-700",
  Rejected:  "bg-red-100 text-red-700",
  Withdrawn: "bg-gray-100 text-gray-500",
  P:         "bg-amber-100 text-amber-700",
  A:         "bg-green-100 text-green-700",
  R:         "bg-red-100 text-red-700",
  W:         "bg-gray-100 text-gray-500",
};

const STATUS_LABEL = { P: "Pending", A: "Approved", R: "Rejected", W: "Withdrawn" };

const LOC_STYLE = {
  Palakkad: "bg-green-100 text-green-700",
  Chittoor: "bg-orange-100 text-orange-700",
  Unknown:  "bg-gray-100 text-gray-500",
};

const TYPE_STYLE = {
  Leave:      "bg-purple-100 text-purple-700",
  Permission: "bg-blue-100 text-blue-700",
  OD:         "bg-yellow-100 text-yellow-700",
};

const APPROVE_API = {
  Leave:      "/approveLeaves",
  Permission: "/approvePr",
  OD:         "/odApprove",
};

const resolveStatus = (s) => STATUS_LABEL[s] || s || "Unknown";

/* ─── Badge ─── */
const Badge = ({ label, style }) => (
  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style}`}>{label}</span>
);

/* ─── Section Header ─── */
const SectionHeader = ({ label, count }) => (
  <div className="flex items-center gap-3 mb-3">
    <span className="text-sm font-semibold text-gray-700">{label}</span>
    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{count}</span>
    <div className="flex-1 border-t border-gray-200" />
  </div>
);

/* ─── Skeleton ─── */
const Skeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
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
);

/* ════════════════════════════════════════
   LEAVE CARD
════════════════════════════════════════ */
const LeaveCard = ({ item, onAction, actionLoadingId }) => {
  const id      = `leave-${item.employeeId}-${item.leaveFrom}`;
  const loc     = getLocation(item.employeeId || item.empId);
  const loading = actionLoadingId === id;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 hover:border-indigo-200 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-800">{item.empName || item.employeeId}</span>
            <Badge label={loc} style={LOC_STYLE[loc]} />
            <Badge label="Leave" style={TYPE_STYLE.Leave} />
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{item.employeeId || item.empId}</div>
        </div>
        <Badge label={resolveStatus(item.status)} style={STATUS_STYLE[item.status] || "bg-gray-100 text-gray-500"} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
        <div><span className="text-gray-400">From: </span>{formatDate(item.leaveFrom)}</div>
        <div><span className="text-gray-400">To: </span>{formatDate(item.leaveTo)}</div>
        {item.typeOfLeave && (
          <div className="col-span-2"><span className="text-gray-400">Type: </span>{item.typeOfLeave}</div>
        )}
      </div>

      {item.reasonForLeave && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          <span className="text-gray-400">Reason: </span>{item.reasonForLeave}
        </div>
      )}

      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={() => onAction(item, "Leave", "Approved", id)}
          disabled={loading}
          className="flex-1 text-xs font-medium py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "..." : "✓ Approve"}
        </button>
        <button
          onClick={() => onAction(item, "Leave", "Rejected", id)}
          disabled={loading}
          className="flex-1 text-xs font-medium py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          {loading ? "..." : "✕ Reject"}
        </button>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   PERMISSION CARD
════════════════════════════════════════ */
const PermissionCard = ({ item, onAction, actionLoadingId }) => {
  const id      = `perm-${item.empId}-${item.Date}`;
  const loc     = getLocation(item.empId);
  const loading = actionLoadingId === id;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 hover:border-indigo-200 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-800">{item.empName || item.empId}</span>
            <Badge label={loc} style={LOC_STYLE[loc]} />
            <Badge label="Permission" style={TYPE_STYLE.Permission} />
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{item.empId}</div>
        </div>
        <Badge label={resolveStatus(item.status)} style={STATUS_STYLE[item.status] || "bg-gray-100 text-gray-500"} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
        <div><span className="text-gray-400">Date: </span>{formatDate(item.Date)}</div>
        {item.permissionType && (
          <div><span className="text-gray-400">Type: </span>{item.permissionType}</div>
        )}
      </div>

      {item.reasonForPermission && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          <span className="text-gray-400">Reason: </span>{item.reasonForPermission}
        </div>
      )}

      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={() => onAction(item, "Permission", "Approved", id)}
          disabled={loading}
          className="flex-1 text-xs font-medium py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "..." : "✓ Approve"}
        </button>
        <button
          onClick={() => onAction(item, "Permission", "Rejected", id)}
          disabled={loading}
          className="flex-1 text-xs font-medium py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          {loading ? "..." : "✕ Reject"}
        </button>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   OD CARD
════════════════════════════════════════ */
const ODCard = ({ item, onAction, actionLoadingId }) => {
  const id      = `od-${item.empId}-${item.onDutyFrom}`;
  const loc     = getLocation(item.empId);
  const loading = actionLoadingId === id;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 hover:border-indigo-200 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-800">{item.empName || item.empId}</span>
            <Badge label={loc} style={LOC_STYLE[loc]} />
            <Badge label="OD" style={TYPE_STYLE.OD} />
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{item.empId}</div>
        </div>
        <Badge label={resolveStatus(item.status)} style={STATUS_STYLE[item.status] || "bg-gray-100 text-gray-500"} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
        <div><span className="text-gray-400">From: </span>{formatDate(item.onDutyFrom)}</div>
        <div><span className="text-gray-400">To: </span>{formatDate(item.onDutyTo)}</div>
      </div>

      {item.reason && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          <span className="text-gray-400">Reason: </span>{item.reason}
        </div>
      )}

      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={() => onAction(item, "OD", "Approved", id)}
          disabled={loading}
          className="flex-1 text-xs font-medium py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "..." : "✓ Approve"}
        </button>
        <button
          onClick={() => onAction(item, "OD", "Rejected", id)}
          disabled={loading}
          className="flex-1 text-xs font-medium py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          {loading ? "..." : "✕ Reject"}
        </button>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   ALL REQUESTS — Table row
════════════════════════════════════════ */
const AllRequestRow = ({ item, type }) => {
  const empId = item.employeeId || item.empId || "—";
  const loc   = getLocation(empId);
  const statusLabel = resolveStatus(item.status);
  const adminid = item.adminEmpId || "—";
  let fromDate = "—", toDate = null, detail = null;

  if (type === "Leave") {
    fromDate = formatDate(item.leaveFrom);
    toDate   = formatDate(item.leaveTo);
    detail   = item.typeOfLeave || item.reasonForLeave;
  } else if (type === "Permission") {
    fromDate = formatDate(item.Date);
    detail   = item.permissionType || item.reasonForPermission;
  } else if (type === "OD") {
    fromDate = formatDate(item.onDutyFrom);
    toDate   = formatDate(item.onDutyTo);
    detail   = item.reason;
  }

  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-gray-800">{item.empName || empId}</div>
        <div className="text-xs text-gray-400">{empId}</div>
      </td>
      <td className="px-4 py-3 text-sm font-medium text-gray-800">{adminid}</td>
      <td className="px-4 py-3"><Badge label={loc} style={LOC_STYLE[loc]} /></td>
      <td className="px-4 py-3"><Badge label={type} style={TYPE_STYLE[type]} /></td>
      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
        {fromDate}{toDate && toDate !== "—" ? ` → ${toDate}` : ""}
      </td>
      <td className="px-4 py-3 text-xs text-gray-400 max-w-[180px] truncate">{detail || "—"}</td>
      <td className="px-4 py-3">
        <Badge label={statusLabel} style={STATUS_STYLE[item.status] || "bg-gray-100 text-gray-500"} />
      </td>
    </tr>
  );
};

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
const PendingRequests = () => {
  const [tab, setTab] = useState("my");

  /* My Requests */
  const [pendingLeaves,      setPendingLeaves]      = useState([]);
  const [pendingPermissions, setPendingPermissions] = useState([]);
  const [pendingOds,         setPendingOds]         = useState([]);
  const [loadingMy,          setLoadingMy]          = useState(false);
  const [errorMy,            setErrorMy]            = useState(null);

  /* All Requests */
  const [allData,    setAllData]    = useState({});
  const [loadingAll, setLoadingAll] = useState(false);
  const [errorAll,   setErrorAll]   = useState(null);

  /* Per-card action loading */
  const [actionLoadingId, setActionLoadingId] = useState(null);

  /* All tab filters */
  const [filterType,   setFilterType]   = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterLoc,    setFilterLoc]    = useState("All");
  const [search,       setSearch]       = useState("");

  const token = sessionStorage.getItem("authToken");
  const user  = JSON.parse(sessionStorage.getItem("authUser") || "{}");

  /* ─── Fetch My Requests ─── */
  const fetchMyRequests = useCallback(async () => {
    try {
      setLoadingMy(true);
      setErrorMy(null);
      const res = await fetch(
        `http://localhost:9090/admin/adminDashBoardDetails?rmEmpId=${user?.employeeId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      setPendingLeaves(json.pendingLeaves           || []);
      setPendingPermissions(json.pendingPermissions || []);
      setPendingOds(json.pendingOds                 || []);
    } catch (e) {
      setErrorMy(e.message || "Failed to load requests");
    } finally {
      setLoadingMy(false);
    }
  }, [token, user?.employeeId]);

  /* ─── Fetch All Requests ─── */
  const fetchAllRequests = useCallback(async () => {
    try {
      setLoadingAll(true);
      setErrorAll(null);
      const res = await fetch("http://localhost:9090/getAllRequest", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      setAllData(json || {});
    } catch (e) {
      setErrorAll(e.message || "Failed to load all requests");
    } finally {
      setLoadingAll(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMyRequests();
    fetchAllRequests();
  }, [fetchMyRequests, fetchAllRequests]);

  /* ─── Approve / Reject ─── */
  const handleAction = useCallback(async (item, type, status, uniqueId) => {
    try {
      setActionLoadingId(uniqueId);
      const endpoint = `http://localhost:9090${APPROVE_API[type]}`;

      // ❗ Send FULL object + updated status
      let body = {};

    // ✅ COMMON FIELD
    const empId = item.empId || item.employeeId;

    // ===========================
    // ✅ LEAVE PAYLOAD
    // ===========================
    if (type === "Leave") {
      body = {
        adminEmpId: user?.employeeId, // ✅ logged-in admin
        empId: empId,
        leaveFrom: item.leaveFrom,
        leaveTo: item.leaveTo,
        sessionFrom: item.sessionFrom,
        sessionTo: item.sessionTo,
        noOfLeaves: item.noOfLeaves || item.noOfDays,
        typeOfLeave: item.typeOfLeave,
        reasonForLeave: item.reasonForLeave,
        leaveStatus: status,
      };
    }

    // ===========================
    // ✅ PERMISSION PAYLOAD
    // ===========================
    else if (type === "Permission") {
      body = {
        empId: empId,
        permissionDate: item.permissionDate || item.Date, // ⚠️ API mismatch fix
        permissionType: item.permissionType,
        reasonForPermission: item.reasonForPermission,
        permissionStatus: status,
      };
    }

    // ===========================
    // ✅ OD PAYLOAD
    // ===========================
    else if (type === "OD") {
      body = {
        adminEmpId: item.adminEmpId,
        empId: empId,
        onDutyFrom: item.onDutyFrom,
        onDutyTo: item.onDutyTo,
        sessionFrom: item.sessionFrom,
        sessionTo: item.sessionTo,
        noOfDays: item.noOfDays,
        reason: item.reason,
        appliedOn: item.appliedOn,
        status: status,
      };
    }

      // ❗ Trim location if present
      if (body.location) body.location = body.location.trim();

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Failed to ${status.toLowerCase()} request`);

      toast.success(`${type} ${status.toLowerCase()} successfully`);

      // Reload only My Requests after action
      await fetchMyRequests();
    } catch (e) {
      toast.error(e.message || "Action failed");
    } finally {
      setActionLoadingId(null);
    }
  }, [token, fetchMyRequests,user]);

  /* ─── Flatten All Requests ─── */
  const flatAll = useMemo(() => {
    const rows = [];
    const leaves      = allData.leaves      || allData.pendingLeaves      || [];
    const permissions = allData.permissions || allData.pendingPermissions || [];
    const ods         = allData.ods         || allData.pendingOds         || [];
    leaves.forEach((i)      => rows.push({ ...i, _type: "Leave"      }));
    permissions.forEach((i) => rows.push({ ...i, _type: "Permission" }));
    ods.forEach((i)         => rows.push({ ...i, _type: "OD"         }));
    return rows;
  }, [allData]);

  const filteredAll = useMemo(() => {
    return flatAll.filter((r) => {
      const empId = (r.employeeId || r.empId || "").toLowerCase();
      const name  = (r.empName || "").toLowerCase();
      const s     = search.toLowerCase();
      const matchSearch = !search || name.includes(s) || empId.includes(s);
      const matchType   = filterType   === "All" || r._type === filterType;
      const matchLoc    = filterLoc    === "All" || getLocation(r.employeeId || r.empId) === filterLoc;
      const matchStatus = filterStatus === "All" || resolveStatus(r.status) === filterStatus;
      return matchSearch && matchType && matchLoc && matchStatus;
    });
  }, [flatAll, search, filterType, filterLoc, filterStatus]);

  const totalPending = pendingLeaves.length + pendingPermissions.length + pendingOds.length;

  return (
    <div className="space-y-5">

      {/* ─── Main Tabs ─── */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab("my")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            tab === "my"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          My requests
          {totalPending > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
              {totalPending}
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

      {/* ════════ MY REQUESTS TAB ════════ */}
      {tab === "my" && (
        <div className="space-y-8">

          {errorMy && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <span>⚠</span> {errorMy}
              <button onClick={fetchMyRequests} className="ml-auto underline text-xs">Retry</button>
            </div>
          )}

          {loadingMy && <Skeleton count={6} />}

          {!loadingMy && !errorMy && totalPending === 0 && (
            <div className="text-center py-20 text-gray-400">
              <div className="text-4xl mb-3">✅</div>
              <div className="text-sm">No pending requests assigned to you</div>
            </div>
          )}

          {/* Pending Leaves */}
          {!loadingMy && pendingLeaves.length > 0 && (
            <div>
              <SectionHeader label="Leave requests" count={pendingLeaves.length} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingLeaves.map((item, i) => (
                  <LeaveCard
                    key={`leave-${i}`}
                    item={item}
                    onAction={handleAction}
                    actionLoadingId={actionLoadingId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pending Permissions */}
          {!loadingMy && pendingPermissions.length > 0 && (
            <div>
              <SectionHeader label="Permission requests" count={pendingPermissions.length} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingPermissions.map((item, i) => (
                  <PermissionCard
                    key={`perm-${i}`}
                    item={item}
                    onAction={handleAction}
                    actionLoadingId={actionLoadingId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pending ODs */}
          {!loadingMy && pendingOds.length > 0 && (
            <div>
              <SectionHeader label="On duty requests" count={pendingOds.length} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingOds.map((item, i) => (
                  <ODCard
                    key={`od-${i}`}
                    item={item}
                    onAction={handleAction}
                    actionLoadingId={actionLoadingId}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════ ALL REQUESTS TAB ════════ */}
      {tab === "all" && (
        <div className="space-y-4">

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="Search name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border px-3 py-2 rounded-md text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {["All", "Leave", "Permission", "OD"].map((t) => <option key={t}>{t}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {["All", "Pending", "Approved", "Rejected", "Withdrawn"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <select
              value={filterLoc}
              onChange={(e) => setFilterLoc(e.target.value)}
              className="border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {["All", "Palakkad", "Chittoor"].map((l) => <option key={l}>{l}</option>)}
            </select>
            {filteredAll.length !== flatAll.length && (
              <span className="text-xs text-gray-400 ml-auto">
                {filteredAll.length} of {flatAll.length} requests
              </span>
            )}
          </div>

          {errorAll && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <span>⚠</span> {errorAll}
              <button onClick={fetchAllRequests} className="ml-auto underline text-xs">Retry</button>
            </div>
          )}

          {loadingAll && (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {!loadingAll && !errorAll && filteredAll.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <div className="text-4xl mb-3">📋</div>
              <div className="text-sm">
                {search || filterType !== "All" || filterStatus !== "All" || filterLoc !== "All"
                  ? "No requests match your filters"
                  : "No requests found"}
              </div>
            </div>
          )}

          {!loadingAll && filteredAll.length > 0 && (
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Employee</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Admin</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Location</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Date / Period</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Details</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAll.map((item, i) => (
                    <AllRequestRow key={i} item={item} type={item._type} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PendingRequests;
