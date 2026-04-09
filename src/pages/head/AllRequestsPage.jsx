import { useState, useEffect, useMemo } from "react";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  Approved: {
    dot: "bg-green-500",
    badge: "bg-green-50 text-green-700 border border-green-200",
  },
  Pending: {
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  Rejected: {
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 border border-red-200",
  },
  Withdrawn: {
    dot: "bg-gray-400",
    badge: "bg-gray-100 text-gray-600 border border-gray-200",
  },
};

const TYPE_STYLES = {
  Leave: "bg-blue-50 text-[#2b3c6b] border border-blue-200",
  OD: "bg-purple-50 text-purple-700 border border-purple-200",
  Permission: "bg-orange-50 text-orange-700 border border-orange-200",
};

const CAMPUS_STYLES = {
  Palakkad: "bg-[#3f548f]/10 text-[#3f548f]",
  Chittoor: "bg-[#2b3c6b]/10 text-[#2b3c6b]",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name = "") {
  return name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function normalizeLocation(loc = "") {
  const l = loc.trim().toLowerCase();
  if (l.includes("palakkad")) return "Palakkad";
  if (l.includes("chittoor")) return "Chittoor";
  return loc.trim();
}

function flattenRequests(data) {
  const rows = [];

  // Leaves
  const leaveGroups = [
    { list: data.approvedLeaves || [], status: "Approved" },
    { list: data.pendingLeaves || [], status: "Pending" },
    { list: data.rejectedLeaves || [], status: "Rejected" },
    { list: data.withdrawnLeaves || [], status: "Withdrawn" },
  ];
  leaveGroups.forEach(({ list, status }) => {
    list.forEach(l => rows.push({
      type: "Leave",
      empId: l.employeeId || l.empId,
      empName: l.empName,
      adminEmpId: l.adminEmpId,
      location: normalizeLocation(l.location),
      date: l.leaveFrom,
      dateTo: l.leaveTo,
      reason: l.reasonForLeave,
      status: l.status || status,
      noOfDays: l.noOfDays,
      subType: l.typeOfLeave?.toUpperCase() || "—",
      appliedOn: l.appliedOn,
      sessionFrom: l.sessionFrom,
      sessionTo: l.sessionTo,
    }));
  });

  // ODs
  const odGroups = [
    { list: data.approvedOds || [], status: "Approved" },
    { list: data.pendingOds || [], status: "Pending" },
    { list: data.rejectedOds || [], status: "Rejected" },
    { list: data.withdrawnOds || [], status: "Withdrawn" },
  ];
  odGroups.forEach(({ list, status }) => {
    list.forEach(o => rows.push({
      type: "OD",
      empId: o.empId,
      empName: o.empName,
      adminEmpId: o.adminEmpId,
      location: normalizeLocation(o.location),
      date: o.onDutyFrom,
      dateTo: o.onDutyTo,
      reason: o.reason,
      status: o.status || status,
      noOfDays: o.noOfDays,
      subType: "On Duty",
      appliedOn: o.appliedOn ? o.appliedOn.split("T")[0] : "—",
      sessionFrom: o.sessionFrom,
      sessionTo: o.sessionTo,
    }));
  });

  // Permissions
  const permGroups = [
    { list: data.approvedPermissions || [], status: "Approved" },
    { list: data.pendingPermissions || [], status: "Pending" },
    { list: data.rejectedPermissions || [], status: "Rejected" },
    { list: data.withdrawnPermissions || [], status: "Withdrawn" },
  ];
  permGroups.forEach(({ list, status }) => {
    list.forEach(p => rows.push({
      type: "Permission",
      empId: p.empId,
      empName: p.empName,
      adminEmpId: p.adminEmpId,
      location: normalizeLocation(p.location),
      date: p.Date,
      dateTo: p.Date,
      reason: p.reasonForPermission,
      status: p.status || status,
      noOfDays: "—",
      subType: p.permissionType === "lateIn" ? "Late In" : p.permissionType,
      appliedOn: p.Date,
      sessionFrom: "—",
      sessionTo: "—",
    }));
  });

  return rows;
}

function buildSummary(data) {
  return {
    leave: {
      approved: data.approvedLeaveCnt ?? (data.approvedLeaves || []).length,
      pending: data.pendingLeaveCnt ?? (data.pendingLeaves || []).length,
      rejected: data.rejectedLeavesCnt ?? (data.rejectedLeaves || []).length,
      withdrawn: data.withdrawnLeavesCnt ?? (data.withdrawnLeaves || []).length,
    },
    od: {
      approved: data.approvedOdsCnt ?? (data.approvedOds || []).length,
      pending: data.pendingOdsCnt ?? (data.pendingOds || []).length,
      rejected: data.rejectedOdsCnt ?? (data.rejectedOds || []).length,
      withdrawn: data.withdrawnOdsCnt ?? (data.withdrawnOds || []).length,
    },
    permission: {
      approved: data.approvedPermissionCnt ?? (data.approvedPermissions || []).length,
      pending: data.pendingPermissionCnt ?? (data.pendingPermissions || []).length,
      rejected: data.rejectedPermissionCnt ?? (data.rejectedPermissions || []).length,
      withdrawn: data.withdrawnPermissionCnt ?? (data.withdrawnPermissions || []).length,
    },
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      {[1,2,3,4,5,6,7].map(i => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-gray-200 rounded animate-pulse" style={{ width: `${60 + (i * 13) % 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

function SummaryCard({ label, icon, approved, pending, rejected, withdrawn, accent }) {
  const total = approved + pending + rejected + withdrawn;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ borderTop: `3px solid ${accent}` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-700 text-gray-800">{label}</span>
        </div>
        <span className="text-2xl font-bold" style={{ color: accent }}>{total}</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">{approved} Approved</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{pending} Pending</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">{rejected} Rejected</span>
        {withdrawn > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">{withdrawn} Withdrawn</span>}
      </div>
    </div>
  );
}

function TopTakerCard({ title, takers, loading }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="text-xs font-700 text-gray-400 uppercase tracking-widest mb-3">{title}</div>
      {loading ? (
        <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
      ) : takers.length === 0 ? (
        <div className="text-sm text-gray-400 py-2">No data</div>
      ) : (
        <div className="space-y-2">
          {takers.map((t, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: i === 0 ? "#2b3c6b" : "#3f548f" }}
              >
                {getInitials(t.empName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-600 text-gray-800 truncate">{t.empName}</div>
                <div className="text-xs text-gray-400">{normalizeLocation(t.location)} · {t.empId}</div>
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: "#2b3c6b18", color: "#2b3c6b" }}
              >
                {t.count}x
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AllRequestsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [campusFilter, setCampusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:9090/getAllRequest");
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  const allRows = useMemo(() => data ? flattenRequests(data) : [], [data]);
  const summary = useMemo(() => data ? buildSummary(data) : null, [data]);

  const filtered = useMemo(() => {
    let rows = [...allRows];
    if (typeFilter !== "All") rows = rows.filter(r => r.type === typeFilter);
    if (statusFilter !== "All") rows = rows.filter(r => r.status === statusFilter);
    if (campusFilter !== "All") rows = rows.filter(r => r.location === campusFilter);
    if (search.trim()) {
      const s = search.toLowerCase();
      rows = rows.filter(r =>
        (r.empName || "").toLowerCase().includes(s) ||
        (r.empId || "").toLowerCase().includes(s) ||
        (r.adminEmpId || "").toLowerCase().includes(s) ||
        (r.reason || "").toLowerCase().includes(s)
      );
    }
    rows.sort((a, b) => {
      const va = (a[sortKey] || "").toString().toLowerCase();
      const vb = (b[sortKey] || "").toString().toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return rows;
  }, [allRows, typeFilter, statusFilter, campusFilter, search, sortKey, sortDir]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  function SortArrow({ k }) {
    if (sortKey !== k) return <span className="text-gray-300 ml-1 text-xs">↕</span>;
    return <span className="ml-1 text-xs" style={{ color: "#2b3c6b" }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const TYPES = ["All", "Leave", "OD", "Permission"];
  const STATUSES = ["All", "Approved", "Pending", "Rejected", "Withdrawn"];
  const CAMPUSES = ["All", "Palakkad", "Chittoor"];

  const thClass = "px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer select-none whitespace-nowrap hover:text-gray-600 transition-colors";
  const tdClass = "px-4 py-3 text-sm text-gray-700 align-middle";

  return (
    <div className="bg-[#f9fafb] min-h-screen p-7 font-sans">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#2b3c6b] tracking-tight">All Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Faculty leave, OD & permission requests — both campuses</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-white border border-gray-200 text-[#2b3c6b] hover:bg-gray-50 transition-colors"
        >
          <span>↻</span> Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <div>
            <div className="text-sm font-semibold text-red-800">Failed to load requests</div>
            <div className="text-xs text-red-600 mt-0.5">{error}</div>
          </div>
          <button onClick={fetchData} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-700 hover:bg-red-50">Retry</button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {loading || !summary ? (
          [1,2,3].map(i => <div key={i} className="h-28 bg-white rounded-xl border border-gray-200 animate-pulse" />)
        ) : (
          <>
            <SummaryCard label="Leaves" icon="🌿" accent="#2b3c6b" {...summary.leave} />
            <SummaryCard label="On Duty" icon="📋" accent="#3f548f" {...summary.od} />
            <SummaryCard label="Permissions" icon="🔑" accent="#5b74af" {...summary.permission} />
          </>
        )}
      </div>

      {/* Top Takers */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <TopTakerCard title="Top leave takers" takers={data?.topLeaveTakers || []} loading={loading} />
        <TopTakerCard title="Top OD takers" takers={data?.topOdTakers || []} loading={loading} />
        <TopTakerCard title="Top permission takers" takers={data?.topPermissionTakers || []} loading={loading} />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

        {/* Table header + filters */}
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <div className="text-sm font-bold text-[#2b3c6b] mr-2">
            Request log
            {!loading && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                {filtered.length} of {allRows.length} records
              </span>
            )}
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
            {TYPES.map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`text-xs font-semibold px-3 py-1 rounded-md transition-all ${
                  typeFilter === t
                    ? "bg-[#2b3c6b] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-xs font-semibold px-3 py-1 rounded-md transition-all ${
                  statusFilter === s
                    ? "bg-[#2b3c6b] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Campus filter */}
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
            {CAMPUSES.map(c => (
              <button
                key={c}
                onClick={() => setCampusFilter(c)}
                className={`text-xs font-semibold px-3 py-1 rounded-md transition-all ${
                  campusFilter === c
                    ? "bg-[#2b3c6b] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, ID, reason..."
            className="ml-auto text-xs px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-[#3f548f] w-52 placeholder-gray-400"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto" style={{ maxHeight: 500, overflowY: "auto" }}>
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-white z-10 border-b border-gray-100 shadow-sm">
              <tr>
                <th className={thClass} onClick={() => toggleSort("empName")}>
                  Faculty <SortArrow k="empName" />
                </th>
                <th className={thClass} onClick={() => toggleSort("adminEmpId")}>
                  Reporting Admin <SortArrow k="adminEmpId" />
                </th>
                <th className={thClass} onClick={() => toggleSort("type")}>
                  Type <SortArrow k="type" />
                </th>
                <th className={thClass} onClick={() => toggleSort("subType")}>
                  Sub-type <SortArrow k="subType" />
                </th>
                <th className={thClass} onClick={() => toggleSort("date")}>
                  Date <SortArrow k="date" />
                </th>
                <th className={thClass} onClick={() => toggleSort("location")}>
                  Campus <SortArrow k="location" />
                </th>
                <th className={thClass}>Days</th>
                <th className={thClass}>Reason</th>
                <th className={thClass} onClick={() => toggleSort("status")}>
                  Status <SortArrow k="status" />
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [1,2,3,4,5,6].map(i => <SkeletonRow key={i} />)
                : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={9} className="text-center py-16 text-sm text-gray-400">
                        {search ? `No results for "${search}"` : "No requests found"}
                      </td>
                    </tr>
                  )
                  : filtered.map((row, i) => {
                    const statusSt = STATUS_STYLES[row.status] || STATUS_STYLES.Pending;
                    const typeSt = TYPE_STYLES[row.type] || "";
                    const campusSt = CAMPUS_STYLES[row.location] || "bg-gray-100 text-gray-600";
                    return (
                      <tr
                        key={i}
                        className="border-b border-gray-50 hover:bg-[#f9fafb] transition-colors"
                      >
                        {/* Faculty */}
                        <td className={tdClass}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                              style={{ background: row.location === "Palakkad" ? "#3f548f" : "#2b3c6b" }}
                            >
                              {getInitials(row.empName)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-800 text-xs">{row.empName}</div>
                              <div className="text-gray-400 text-xs font-mono">{row.empId}</div>
                            </div>
                          </div>
                        </td>

                        {/* Admin */}
                        <td className={tdClass}>
                          <span className="font-mono text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                            {row.adminEmpId}
                          </span>
                        </td>

                        {/* Type */}
                        <td className={tdClass}>
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${typeSt}`}>
                            {row.type}
                          </span>
                        </td>

                        {/* Sub-type */}
                        <td className={tdClass}>
                          <span className="text-xs text-gray-600">{row.subType}</span>
                        </td>

                        {/* Date */}
                        <td className={tdClass}>
                          <div className="text-xs text-gray-700 font-medium">{row.date}</div>
                          {row.dateTo && row.dateTo !== row.date && (
                            <div className="text-xs text-gray-400">→ {row.dateTo}</div>
                          )}
                        </td>

                        {/* Campus */}
                        <td className={tdClass}>
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${campusSt}`}>
                            {row.location}
                          </span>
                        </td>

                        {/* Days */}
                        <td className={tdClass}>
                          <span className="text-xs text-gray-600">{row.noOfDays}</span>
                        </td>

                        {/* Reason */}
                        <td className={tdClass} style={{ maxWidth: 200 }}>
                          <div className="text-xs text-gray-500 truncate" title={row.reason}>
                            {row.reason || "—"}
                          </div>
                        </td>

                        {/* Status */}
                        <td className={tdClass}>
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusSt.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusSt.dot}`} />
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
            <span>Showing {filtered.length} records</span>
            <span>
              {["Approved", "Pending", "Rejected", "Withdrawn"].map(s => {
                const cnt = filtered.filter(r => r.status === s).length;
                if (!cnt) return null;
                const st = STATUS_STYLES[s];
                return (
                  <span key={s} className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mr-1 ${st.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                    {cnt} {s}
                  </span>
                );
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
