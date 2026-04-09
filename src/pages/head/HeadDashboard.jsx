import { useState, useEffect, useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// ── Theme ─────────────────────────────────────────────────────────────────────
const C = {
  primary: "#2b3c6b",
  secondary: "#3f548f",
  white: "#ffffff",
  softBg: "#f9fafb",
  border: "#e5e7eb",
  borderLight: "#f3f4f6",
  textPrimary: "#111827",
  textSecond: "#6b7280",
  textMuted: "#9ca3af",
};

const PIE_PALAKKAD = ["#2b3c6b", "#3f548f", "#5b74af", "#7b94cf", "#9bb4ef", "#c0cfe8", "#d8e2f3"];
const PIE_CHITTOOR = ["#1e2f54", "#2b3c6b", "#3a4f8a", "#4e66a8", "#6880c0", "#8ea2d4", "#b4c0e2"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name = "") {
  return name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function deptCounts(arr = []) {
  const map = {};
  arr.forEach(e => {
    const d = (e.department || "Other").trim();
    map[d] = (map[d] || 0) + 1;
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

// ── Reusable UI ───────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: C.white, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: "20px 22px", ...style,
    }}>
      {children}
    </div>
  );
}

function CardHeader({ title, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>{title}</div>
      {right && <span style={{ fontSize: 11, color: C.textMuted }}>{right}</span>}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: C.textMuted,
      letterSpacing: 1, textTransform: "uppercase", marginBottom: 12, marginTop: 4,
    }}>
      {children}
    </div>
  );
}

function Skeleton({ w = "100%", h = 16, style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 6,
      background: "linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
      ...style,
    }} />
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accentColor, loading }) {
  return (
    <Card style={{ borderTop: `3px solid ${accentColor}` }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
        {label}
      </div>
      {loading
        ? <Skeleton h={32} w={60} style={{ marginBottom: 8 }} />
        : <div style={{ fontSize: 30, fontWeight: 700, color: accentColor, lineHeight: 1, letterSpacing: -1 }}>{value}</div>
      }
      <div style={{ fontSize: 12, color: C.textSecond, marginTop: 6 }}>{sub}</div>
    </Card>
  );
}

// ── Pie Chart Card ────────────────────────────────────────────────────────────
function DeptPieChart({ title, faculty, colors, loading }) {
  const data = useMemo(() => deptCounts(faculty).slice(0, 7).map(([name, value]) => ({ name, value })), [faculty]);

  return (
    <Card>
      <CardHeader title={title} right={`${faculty.length} staff`} />
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 220 }}>
          <Skeleton w={180} h={180} style={{ borderRadius: "50%" }} />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={88}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val, name) => [val, name]}
              contentStyle={{
                background: C.white, border: `1px solid ${C.border}`,
                borderRadius: 8, fontSize: 12, color: C.textPrimary,
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, color: C.textSecond, paddingTop: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

// ── Campus Summary Card ───────────────────────────────────────────────────────
function CampusCard({ campus, count, adminName, adminId, color, loading }) {
  return (
    <Card style={{ borderTop: `3px solid ${color}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>{campus} Campus</div>
        {loading
          ? <Skeleton w={40} h={28} />
          : <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{count}</div>
              <div style={{ fontSize: 10, color: C.textMuted }}>staff</div>
            </div>
        }
      </div>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {[1,2,3].map(i => <Skeleton key={i} h={12} />)}
        </div>
      ) : (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: color + "18", color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, flexShrink: 0,
          }}>
            {getInitials(adminName)}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary }}>{adminName}</div>
            <div style={{ fontSize: 10, color: C.textMuted }}>{adminId} · Campus Admin</div>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Admins Table ──────────────────────────────────────────────────────────────
function AdminsTable({ admins, loading }) {
  const thSt = {
    fontSize: 11, fontWeight: 600, color: C.textMuted,
    letterSpacing: 0.5, textTransform: "uppercase",
    padding: "0 16px 10px 0", textAlign: "left",
    borderBottom: `2px solid ${C.border}`,
  };
  const tdSt = {
    padding: "11px 16px 11px 0",
    borderBottom: `1px solid ${C.borderLight}`,
    fontSize: 13, color: C.textPrimary, verticalAlign: "middle",
  };
  const avatarPalette = [
    [C.primary + "18", C.primary],
    [C.secondary + "22", C.secondary],
    ["#f3f4f6", "#374151"],
  ];

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>{["Name", "Campus", "Role", "Username", "Contact", "Email"].map(h => <th key={h} style={thSt}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {loading
          ? [1,2,3].map(i => (
              <tr key={i}>
                {[1,2,3,4,5,6].map(j => (
                  <td key={j} style={tdSt}><Skeleton h={12} /></td>
                ))}
              </tr>
            ))
          : admins.map((a, i) => (
              <tr key={a.userName}>
                <td style={tdSt}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%",
                      background: avatarPalette[i % avatarPalette.length][0],
                      color: avatarPalette[i % avatarPalette.length][1],
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }}>
                      {getInitials(a.adminName)}
                    </div>
                    <span style={{ fontWeight: 500 }}>{a.adminName}</span>
                  </div>
                </td>
                <td style={tdSt}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                    background: a.collageLocation === "Palakkad" ? C.secondary + "18" : C.primary + "14",
                    color: a.collageLocation === "Palakkad" ? C.secondary : C.primary,
                  }}>{a.collageLocation}</span>
                </td>
                <td style={tdSt}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
                    background: a.adminRole === "HEAD" ? "#fef3c7" : "#f0fdf4",
                    color: a.adminRole === "HEAD" ? "#92400e" : "#166534",
                  }}>{a.adminRole}</span>
                </td>
                <td style={{ ...tdSt, fontFamily: "monospace", fontSize: 12, color: C.textSecond }}>{a.userName}</td>
                <td style={{ ...tdSt, fontSize: 12, color: C.textSecond }}>{a.contactNumber}</td>
                <td style={{ ...tdSt, fontSize: 12, color: C.textSecond }}>{a.email}</td>
              </tr>
            ))
        }
      </tbody>
    </table>
  );
}

// ── Faculty Table ─────────────────────────────────────────────────────────────
const SORT_FIELDS = [
  { key: "empName", label: "Name" },
  { key: "department", label: "Department" },
  { key: "empId", label: "Emp ID" },
];

function SortIcon({ sortKey, sortDir, k }) {
  if (sortKey !== k) return <span style={{ color: C.textMuted, marginLeft: 3 }}>↕</span>;
  return <span style={{ color: C.primary, marginLeft: 3 }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
}

function FacultyTable({ palakkad, chittoor, loading }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("empName");
  const [sortDir, setSortDir] = useState("asc");

  const allFaculty = useMemo(() => [
    ...(palakkad || []).map(e => ({ ...e, campus: "Palakkad" })),
    ...(chittoor || []).map(e => ({ ...e, campus: "Chittoor" })),
  ], [palakkad, chittoor]);

  const filtered = useMemo(() => {
    let data = [...allFaculty];
    if (filter !== "all") data = data.filter(e => e.campus === filter);
    if (search.trim()) {
      const s = search.toLowerCase();
      data = data.filter(e =>
        (e.empName || "").toLowerCase().includes(s) ||
        (e.department || "").toLowerCase().includes(s) ||
        (e.empId || "").toLowerCase().includes(s) ||
        (e.contactNumber || "").includes(s)
      );
    }
    data.sort((a, b) => {
      const va = (a[sortKey] || "").toString().toLowerCase();
      const vb = (b[sortKey] || "").toString().toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return data;
  }, [allFaculty, filter, search, sortKey, sortDir]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  const thSt = (k) => ({
    fontSize: 11, fontWeight: 600, color: C.textMuted,
    letterSpacing: 0.5, textTransform: "uppercase",
    padding: "0 12px 10px 0", textAlign: "left",
    borderBottom: `2px solid ${C.border}`,
    position: "sticky", top: 0, background: C.white, zIndex: 1,
    cursor: k ? "pointer" : "default", userSelect: "none",
  });
  const tdSt = {
    padding: "10px 12px 10px 0",
    borderBottom: `1px solid ${C.borderLight}`,
    fontSize: 13, color: C.textPrimary, verticalAlign: "middle",
  };

  return (
    <>
      {/* Filter + Sort + Search bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        {[["all", `All (${allFaculty.length})`], ["Palakkad", `Palakkad (${(palakkad||[]).length})`], ["Chittoor", `Chittoor (${(chittoor||[]).length})`]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            fontSize: 12, fontWeight: 500, padding: "5px 14px", borderRadius: 20,
            border: filter === val ? `1.5px solid ${C.primary}` : `1px solid ${C.border}`,
            background: filter === val ? C.primary : C.white,
            color: filter === val ? C.white : C.textSecond,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
          }}>
            {label}
          </button>
        ))}

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 4 }}>
          <span style={{ fontSize: 11, color: C.textMuted }}>Sort:</span>
          {SORT_FIELDS.map(f => (
            <button key={f.key} onClick={() => toggleSort(f.key)} style={{
              fontSize: 11, fontWeight: 500, padding: "4px 10px", borderRadius: 6,
              border: sortKey === f.key ? `1px solid ${C.primary}` : `1px solid ${C.border}`,
              background: sortKey === f.key ? C.primary + "10" : C.white,
              color: sortKey === f.key ? C.primary : C.textSecond,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              {f.label} {sortKey === f.key ? (sortDir === "asc" ? "↑" : "↓") : ""}
            </button>
          ))}
        </div>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, dept, ID, phone..."
          style={{
            marginLeft: "auto", fontSize: 12, padding: "7px 12px",
            borderRadius: 8, border: `1px solid ${C.border}`,
            background: C.softBg, color: C.textPrimary,
            fontFamily: "inherit", outline: "none", width: 230,
          }}
        />
      </div>

      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>
        Showing {filtered.length} of {allFaculty.length} records
      </div>

      <div style={{ maxHeight: 360, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thSt("empId")} onClick={() => toggleSort("empId")}>Emp ID <SortIcon k="empId" sortKey={sortKey} sortDir={sortDir} /></th>
              <th style={thSt("empName")} onClick={() => toggleSort("empName")}>Name <SortIcon k="empName" sortKey={sortKey} sortDir={sortDir} /></th>
              <th style={thSt("department")} onClick={() => toggleSort("department")}>Department <SortIcon k="department" sortKey={sortKey} sortDir={sortDir} /></th>
              <th style={thSt(null)}>Campus</th>
              <th style={thSt(null)}>Contact</th>
              <th style={thSt(null)}>Email</th>
              <th style={thSt(null)}>Reporting to</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? [1,2,3,4,5].map(i => (
                  <tr key={i}>
                    {[1,2,3,4,5,6,7].map(j => (
                      <td key={j} style={tdSt}><Skeleton h={12} /></td>
                    ))}
                  </tr>
                ))
              : filtered.map(e => (
                  <tr
                    key={e.empId + e.campus}
                    onMouseEnter={ev => ev.currentTarget.style.background = C.softBg}
                    onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ ...tdSt, fontFamily: "monospace", fontSize: 11, color: C.textMuted }}>{e.empId}</td>
                    <td style={{ ...tdSt, fontWeight: 500 }}>{e.empName}</td>
                    <td style={{ ...tdSt, fontSize: 12, color: C.textSecond }}>{e.department}</td>
                    <td style={tdSt}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20,
                        background: e.campus === "Palakkad" ? C.secondary + "14" : C.primary + "12",
                        color: e.campus === "Palakkad" ? C.secondary : C.primary,
                        display: "inline-flex", alignItems: "center", gap: 5,
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: e.campus === "Palakkad" ? C.secondary : C.primary }} />
                        {e.campus}
                      </span>
                    </td>
                    <td style={{ ...tdSt, fontSize: 12, color: C.textSecond }}>{e.contactNumber}</td>
                    <td style={{ ...tdSt, fontSize: 12, color: C.textSecond }}>{e.email}</td>
                    <td style={{ ...tdSt, fontSize: 11, color: C.textMuted }}>{e.reportingTo}</td>
                  </tr>
                ))
            }
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...tdSt, textAlign: "center", color: C.textMuted, padding: 32 }}>
                  No results found for "{search}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Error Banner ──────────────────────────────────────────────────────────────
function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{
      background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
      padding: "14px 18px", display: "flex", alignItems: "center",
      justifyContent: "space-between", marginBottom: 20,
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#991b1b" }}>Failed to load dashboard data</div>
        <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 2 }}>{message}</div>
      </div>
      <button onClick={onRetry} style={{
        fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 8,
        border: "1px solid #fca5a5", background: C.white, color: "#b91c1c",
        cursor: "pointer", fontFamily: "inherit",
      }}>
        Retry
      </button>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function HeadDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchDashboard() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:9090/head/dashboard");
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDashboard(); }, []);

  const palakkad = data?.PalakkadDetails || [];
  const chittoor = data?.ChittoorFacultyDetails || [];
  const admins   = data?.AdminDetails || [];
  const totalFaculty    = data?.FacultyCount ?? 0;
  const palakkadCount   = data?.palakkadFacultyCount ?? palakkad.length;
  const chittoorCount   = data?.ChittoorFacultyCount ?? chittoor.length;
  const adminCount      = data?.AdminCount ?? admins.length;
  const palakkadAdmin   = admins.find(a => a.collageLocation === "Palakkad");
  const chittoorAdminHead = admins.find(a => a.adminRole === "HEAD");

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div style={{
        background: C.softBg, minHeight: "100vh",
        padding: "28px 28px 48px",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      }}>

        {/* Page heading */}
        <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: C.primary, margin: 0, letterSpacing: -0.4 }}>
              Overview Dashboard
            </h1>
            <p style={{ fontSize: 13, color: C.textSecond, margin: "4px 0 0" }}>
              Both campuses · All faculty &amp; admins
            </p>
          </div>
          <button
            onClick={fetchDashboard}
            style={{
              fontSize: 12, fontWeight: 600, padding: "7px 16px", borderRadius: 8,
              border: `1px solid ${C.border}`, background: C.white, color: C.primary,
              cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            ↻ Refresh
          </button>
        </div>

        {/* Error */}
        {error && <ErrorBanner message={error} onRetry={fetchDashboard} />}

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 14, marginBottom: 28 }}>
          <StatCard label="Total Staff" value={totalFaculty} sub="Across both campuses" accentColor={C.primary} loading={loading} />
          <StatCard label="Palakkad Campus" value={palakkadCount} sub={`${totalFaculty ? Math.round((palakkadCount/totalFaculty)*100) : 0}% of total staff`} accentColor={C.secondary} loading={loading} />
          <StatCard label="Chittoor Campus" value={chittoorCount} sub={`${totalFaculty ? Math.round((chittoorCount/totalFaculty)*100) : 0}% of total staff`} accentColor={C.primary} loading={loading} />
          <StatCard label="Administrators" value={adminCount} sub="1 Head · 2 Admins" accentColor={C.secondary} loading={loading} />
        </div>

        {/* Campus summary + Pie charts */}
        <SectionLabel>Campus breakdown</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <CampusCard
            campus="Palakkad" count={palakkadCount}
            adminName={palakkadAdmin?.adminName || "Dr.Raji Rajan"}
            adminId={palakkadAdmin?.userName || "AREP20172"}
            color={C.secondary} loading={loading}
          />
          <CampusCard
            campus="Chittoor" count={chittoorCount}
            adminName={chittoorAdminHead?.adminName || "MP.Sudeesh Kumar"}
            adminId={chittoorAdminHead?.userName || "AREC20390"}
            color={C.primary} loading={loading}
          />
        </div>

        {/* Department Pie Charts */}
        <SectionLabel>Department distribution</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <DeptPieChart title="Palakkad — departments" faculty={palakkad} colors={PIE_PALAKKAD} loading={loading} />
          <DeptPieChart title="Chittoor — departments" faculty={chittoor} colors={PIE_CHITTOOR} loading={loading} />
        </div>

        {/* Admins */}
        <SectionLabel>Admin accounts</SectionLabel>
        <Card style={{ marginBottom: 24 }}>
          <CardHeader title="Administrators" right={`${adminCount} total`} />
          <AdminsTable admins={admins} loading={loading} />
        </Card>

        {/* Faculty Table */}
        <SectionLabel>Faculty directory</SectionLabel>
        <Card>
          <CardHeader title="All faculty" right={`${totalFaculty} members`} />
          <FacultyTable palakkad={palakkad} chittoor={chittoor} loading={loading} />
        </Card>

      </div>
    </>
  );
}
