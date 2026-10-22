
import { useEffect, useMemo, useState, useCallback } from "react";
import { API_BASE_URL } from "../../../config/api";

const API_BASE = API_BASE_URL;

const DETAILS_URL = `${API_BASE}/reports/ackDetails`;
const DOWNLOAD_URL = `${API_BASE}/reports/ack/download`;

const PRIMARY = "#2b3c6b";
const SECONDARY = "#3f548f";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// API returns "True" / "true" / "False" / "false" as strings
const toBool = (v) => String(v).trim().toLowerCase() === "true";

const formatDate = (v) => {
  if (!v || String(v).toUpperCase() === "NA") return null;

  const d = new Date(v);

  return isNaN(d)
    ? v
    : d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const normalize = (r) => {
  const coc = toBool(r.cocAckStatus);
  const leave = toBool(r.leaveAckStatus);

  return {
    empId: r.empId,
    name: (r.empName || "").replace(/\s+/g, " ").trim(),
    campus: r.collegeLocation,
    dept: r.empDept,
    joined: r.dateOfJoining,
    coc,
    leave,
    ackAt: r.ackAt,
    status:
      coc && leave
        ? "Completed"
        : coc || leave
        ? "Partial"
        : "Pending",
  };
};

const STATUS_STYLES = {
  Completed: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
  },
  Partial: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    border: "border-amber-200",
  },
  Pending: {
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    border: "border-red-200",
  },
};

function PolicyBadge({ done }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
        done
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-gray-200 bg-gray-50 text-gray-500"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          done ? "bg-emerald-500" : "bg-gray-400"
        }`}
      />

      {done ? "Acknowledged" : "Not yet"}
    </span>
  );
}

function StatCard({ label, value, type }) {
  const config = {
    total: {
      icon: "👥",
      iconBg: "bg-indigo-50",
      iconText: "text-[#2b3c6b]",
      valueText: "text-[#2b3c6b]",
    },
    completed: {
      icon: "✓",
      iconBg: "bg-emerald-50",
      iconText: "text-emerald-600",
      valueText: "text-emerald-600",
    },
    partial: {
      icon: "◐",
      iconBg: "bg-amber-50",
      iconText: "text-amber-600",
      valueText: "text-amber-600",
    },
    pending: {
      icon: "!",
      iconBg: "bg-red-50",
      iconText: "text-red-600",
      valueText: "text-red-600",
    },
  };

  const item = config[type];

  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>

          <p
            className={`mt-2 text-3xl font-bold tracking-tight ${item.valueText}`}
          >
            {value}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold ${item.iconBg} ${item.iconText}`}
        >
          {item.icon}
        </div>
      </div>

      <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: "100%",
            background:
              type === "completed"
                ? "#10b981"
                : type === "partial"
                ? "#f59e0b"
                : type === "pending"
                ? "#ef4444"
                : PRIMARY,
          }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${style.bg} ${style.text} ${style.border}`}
    >
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}

export default function AckDetailsReport() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState("");
  const [campus, setCampus] = useState("ALL");
  const [dept, setDept] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  const pageSize = 15;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(DETAILS_URL, {
        headers: authHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }

      const data = await res.json();

      setRows((Array.isArray(data) ? data : []).map(normalize));
    } catch (e) {
      setError(e.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const departments = useMemo(
    () => [...new Set(rows.map((r) => r.dept))].sort(),
    [rows]
  );

  const campuses = useMemo(
    () => [...new Set(rows.map((r) => r.campus))].sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter(
      (r) =>
        (campus === "ALL" || r.campus === campus) &&
        (dept === "ALL" || r.dept === dept) &&
        (status === "ALL" || r.status === status) &&
        (!q ||
          r.name.toLowerCase().includes(q) ||
          r.empId.toLowerCase().includes(q))
    );
  }, [rows, search, campus, dept, status]);

  useEffect(() => {
    setPage(1);
  }, [search, campus, dept, status]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      completed: rows.filter((r) => r.status === "Completed").length,
      partial: rows.filter((r) => r.status === "Partial").length,
      pending: rows.filter((r) => r.status === "Pending").length,
    }),
    [rows]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const pageRows = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handleExport = async () => {
    setExporting(true);

    try {
      const res = await fetch(DOWNLOAD_URL, {
        headers: authHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Download failed (${res.status})`);
      }

      const blob = await res.blob();

      let filename = "acknowledgement-report.xlsx";

      const cd = res.headers.get("Content-Disposition");

      const match =
        cd &&
        /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd);

      if (match) {
        filename = decodeURIComponent(match[1]);
      }

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;
      a.download = filename;

      document.body.appendChild(a);

      a.click();

      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-4 sm:p-6 lg:p-7">
      <div className="mx-auto max-w-[1800px] space-y-6">

        {/* =========================================================
            HEADER
        ========================================================= */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2b3c6b] to-[#3f548f] px-6 py-6 text-white shadow-lg sm:px-7">
          <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 right-24 h-64 w-64 rounded-full bg-white/5" />

          <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-lg bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                  Super Admin
                </span>

                <span className="text-white/50">/</span>

                <span className="text-sm text-white/80">
                  Reports
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Policy Acknowledgement Report
              </h1>

              <p className="mt-1 text-sm text-white/75">
                Monitor Code of Conduct and Leave Policy acknowledgement
                across employees.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={load}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className={loading ? "animate-spin" : ""}>↻</span>
                {loading ? "Refreshing..." : "Refresh"}
              </button>

              <button
                onClick={handleExport}
                disabled={exporting || loading}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#2b3c6b] shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>↓</span>
                {exporting ? "Exporting..." : "Export Excel"}
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================
            STATISTICS
        ========================================================= */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Employees"
            value={stats.total}
            type="total"
          />

          <StatCard
            label="Both Acknowledged"
            value={stats.completed}
            type="completed"
          />

          <StatCard
            label="Partially Done"
            value={stats.partial}
            type="partial"
          />

          <StatCard
            label="Pending"
            value={stats.pending}
            type="pending"
          />
        </div>

        {/* =========================================================
            FILTERS
        ========================================================= */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-1">
            <h2 className="text-base font-bold text-gray-800">
              Report Filters
            </h2>

            <p className="text-xs text-gray-500">
              Search and filter acknowledgement records.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">

            {/* Search */}
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                ⌕
              </span>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee or ID"
                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#3f548f] focus:bg-white focus:ring-2 focus:ring-[#3f548f]/10"
              />
            </div>

            {/* Campus */}
            <select
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none transition focus:border-[#3f548f] focus:bg-white focus:ring-2 focus:ring-[#3f548f]/10"
            >
              <option value="ALL">All Campuses</option>

              {campuses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Department */}
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none transition focus:border-[#3f548f] focus:bg-white focus:ring-2 focus:ring-[#3f548f]/10"
            >
              <option value="ALL">All Departments</option>

              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Status */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none transition focus:border-[#3f548f] focus:bg-white focus:ring-2 focus:ring-[#3f548f]/10"
            >
              <option value="ALL">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Partial">Partial</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        {/* =========================================================
            TABLE
        ========================================================= */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* Table Header */}
          <div className="flex flex-col justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-bold text-gray-800">
                Employee Acknowledgement Details
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Showing filtered employee policy status.
              </p>
            </div>

            <div className="rounded-lg bg-[#2b3c6b]/5 px-3 py-1.5 text-xs font-semibold text-[#2b3c6b]">
              {filtered.length} Records
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-sm">

              <thead>
                <tr className="border-b border-gray-100 bg-[#f8f9fc] text-left">
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                    Employee
                  </th>

                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                    Campus
                  </th>

                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                    Department
                  </th>

                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                    Joined
                  </th>

                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                    Code of Conduct
                  </th>

                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                    Leave Policy
                  </th>

                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                    Acknowledged At
                  </th>

                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {/* Loading */}
                {loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-14 text-center"
                    >
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#2b3c6b]" />

                        <span className="text-sm font-medium text-gray-500">
                          Loading acknowledgement report...
                        </span>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Error */}
                {!loading && error && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-14 text-center"
                    >
                      <div className="mx-auto max-w-md">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                          !
                        </div>

                        <p className="text-sm font-semibold text-red-600">
                          {error}
                        </p>

                        <button
                          onClick={load}
                          className="mt-3 text-sm font-semibold text-[#2b3c6b] underline underline-offset-4 hover:text-[#3f548f]"
                        >
                          Retry
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Empty */}
                {!loading &&
                  !error &&
                  pageRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-14 text-center"
                      >
                        <div className="mx-auto max-w-md">
                          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                            ⌕
                          </div>

                          <p className="text-sm font-semibold text-gray-700">
                            No employees found
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            No employees match the selected filters.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}

                {/* Data */}
                {!loading &&
                  !error &&
                  pageRows.map((r) => (
                    <tr
                      key={r.empId}
                      className="group transition hover:bg-[#f8f9fc]"
                    >
                      {/* Employee */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2b3c6b]/10 text-sm font-bold text-[#2b3c6b]">
                            {(r.name || "E")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <div className="font-semibold text-gray-800">
                              {r.name}
                            </div>

                            <div className="mt-0.5 text-xs font-medium text-gray-400">
                              {r.empId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Campus */}
                      <td className="px-5 py-4">
                        <span className="font-medium text-gray-700">
                          {r.campus || "—"}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="px-5 py-4">
                        <span className="font-medium text-gray-700">
                          {r.dept || "—"}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="px-5 py-4 text-gray-600">
                        {formatDate(r.joined) || "—"}
                      </td>

                      {/* Code of Conduct */}
                      <td className="px-5 py-4">
                        <PolicyBadge done={r.coc} />
                      </td>

                      {/* Leave Policy */}
                      <td className="px-5 py-4">
                        <PolicyBadge done={r.leave} />
                      </td>

                      {/* Acknowledged */}
                      <td className="px-5 py-4 text-gray-600">
                        {formatDate(r.ackAt) || "—"}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* =========================================================
              PAGINATION
          ========================================================= */}
          <div className="flex flex-col gap-3 border-t border-gray-100 bg-[#fafbfc] px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">

            <div className="text-xs font-medium text-gray-500">
              Showing{" "}
              <span className="font-semibold text-gray-700">
                {filtered.length === 0
                  ? 0
                  : (page - 1) * pageSize + 1}
              </span>
              {" – "}
              <span className="font-semibold text-gray-700">
                {Math.min(page * pageSize, filtered.length)}
              </span>
              {" of "}
              <span className="font-semibold text-gray-700">
                {filtered.length}
              </span>
              {" employees"}
            </div>

            <div className="flex items-center gap-2">

              <button
                onClick={() =>
                  setPage((p) => Math.max(1, p - 1))
                }
                disabled={page === 1}
                className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-600 transition hover:border-[#3f548f] hover:text-[#2b3c6b] disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Prev
              </button>

              <div className="rounded-lg bg-[#2b3c6b] px-3.5 py-2 text-xs font-bold text-white shadow-sm">
                {page}
                <span className="mx-1 text-white/50">
                  /
                </span>
                {totalPages}
              </div>

              <button
                onClick={() =>
                  setPage((p) =>
                    Math.min(totalPages, p + 1)
                  )
                }
                disabled={page === totalPages}
                className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-600 transition hover:border-[#3f548f] hover:text-[#2b3c6b] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
