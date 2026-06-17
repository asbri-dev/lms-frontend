import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Leaf, IndianRupee, TrendingUp, Clock, AlertTriangle,
  RefreshCw, Search, ChevronLeft, ChevronRight,
  MapPin, Users, Filter, X
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { API_BASE_URL } from "../../config/api";
import { useAuth } from "../../auth/useAuth";

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt = (val) =>
  Number(val).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const PAGE_SIZE = 10;

// ── Leaf decorative bg ────────────────────────────────────────────────────────
function LeafBg() {
  const leaves = [
    { size: 90,  x: "4%",  y: "8%",  op: 0.06, dur: 20, rot: 30  },
    { size: 60,  x: "90%", y: "4%",  op: 0.07, dur: 25, rot: -20 },
    { size: 110, x: "94%", y: "60%", op: 0.05, dur: 32, rot: 45  },
    { size: 45,  x: "1%",  y: "75%", op: 0.07, dur: 22, rot: -35 },
    { size: 70,  x: "48%", y: "1%",  op: 0.05, dur: 28, rot: 15  },
  ];
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:0 }}>
      {leaves.map((l, i) => (
        <div key={i} style={{
          position:"absolute", left:l.x, top:l.y,
          color:"#16a34a", opacity:l.op,
          transform:`rotate(${l.rot}deg)`,
          animation:`sway ${l.dur}s ease-in-out infinite alternate`,
        }}>
          <Leaf size={l.size} strokeWidth={1} />
        </div>
      ))}
      <style>{`
        @keyframes sway { from{transform:rotate(var(--r,-10deg)) scale(1)} to{transform:rotate(calc(var(--r,-10deg) + 18deg)) scale(1.04)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent, delay }) {
  return (
    <div style={{
      background:"#fff", borderRadius:16,
      border:`1.5px solid ${accent}25`,
      padding:"20px 22px",
      display:"flex", flexDirection:"column", gap:10,
      position:"relative", overflow:"hidden",
      boxShadow:`0 2px 16px ${accent}10`,
      animation:"fadeUp .5s ease both",
      animationDelay: delay,
    }}>
      <div style={{
        position:"absolute", top:-18, right:-18,
        width:80, height:80, borderRadius:"50%",
        background:`${accent}10`,
      }} />
      <div style={{
        width:42, height:42, borderRadius:12,
        background:`${accent}15`,
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        {Icon && <Icon size={20} color={accent} strokeWidth={2} />}
      </div>
      <div>
        <p style={{ fontSize:12, color:"#64748b", margin:"0 0 4px", fontFamily:"'DM Sans',sans-serif" }}>{label}</p>
        <p style={{ fontSize:22, fontWeight:700, color:"#0f172a", margin:0, fontFamily:"'DM Sans',sans-serif", letterSpacing:"-0.5px" }}>
          ₹{fmt(value)}
        </p>
        {sub && <p style={{ fontSize:11, color:accent, margin:"4px 0 0", fontWeight:500 }}>{sub}</p>}
      </div>
    </div>
  );
}

// ── Custom Pie Tooltip ─────────────────────────────────────────────────────────
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div style={{
      background:"#fff", border:"1.5px solid #dcfce7",
      borderRadius:10, padding:"10px 14px",
      boxShadow:"0 4px 20px #16a34a15",
      fontFamily:"'DM Sans',sans-serif",
    }}>
      <p style={{ margin:"0 0 4px", fontWeight:600, fontSize:13, color:"#0f172a" }}>{name}</p>
      <p style={{ margin:0, fontSize:14, fontWeight:700, color:"#16a34a" }}>₹{fmt(value)}</p>
    </div>
  );
}

// ── Student Row ───────────────────────────────────────────────────────────────
function StudentRow({ student, index }) {
  const paid    = Number(student.amountPaid);
  const total   = Number(student.totalAmount);
  const pct     = total > 0 ? Math.round((paid / total) * 100) : 0;
  const hasFine = Number(student.totalFine) > 0;
  return (
    <tr style={{
      animation:"fadeUp .4s ease both",
      animationDelay:`${index * 0.035}s`,
      borderBottom:"1px solid #f0fdf4",
      transition:"background .15s",
      cursor:"default",
    }}
      onMouseEnter={e => e.currentTarget.style.background = "#f0fdf4"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <td style={{ padding:"13px 16px", fontSize:13, color:"#64748b", fontWeight:500 }}>{student.admissionNo}</td>
      <td style={{ padding:"13px 16px" }}>
        <p style={{ margin:0, fontWeight:600, fontSize:13, color:"#0f172a" }}>{student.studentName}</p>
        <p style={{ margin:"2px 0 0", fontSize:11, color:"#94a3b8" }}>{student.currentYear}</p>
      </td>
      <td style={{ padding:"13px 16px", fontSize:13, color:"#334155", textAlign:"right", fontWeight:500 }}>
        ₹{fmt(student.totalAmount)}
      </td>
      <td style={{ padding:"13px 16px", textAlign:"right" }}>
        <p style={{ margin:0, fontSize:13, color:"#16a34a", fontWeight:600 }}>₹{fmt(student.amountPaid)}</p>
        <div style={{ marginTop:4, height:3, borderRadius:4, background:"#dcfce7", minWidth:60 }}>
          <div style={{
            height:"100%", width:`${pct}%`,
            background:"#16a34a", borderRadius:4,
            transition:"width .6s ease",
          }} />
        </div>
      </td>
      <td style={{ padding:"13px 16px", textAlign:"right" }}>
        <p style={{ margin:0, fontSize:13, color:"#ea580c", fontWeight:600 }}>
          ₹{fmt(student.balanceIncludingFine)}
        </p>
      </td>
      <td style={{ padding:"13px 16px", textAlign:"right" }}>
        {hasFine ? (
          <span style={{
            display:"inline-flex", alignItems:"center", gap:4,
            fontSize:11, fontWeight:600,
            background:"#fff7ed", color:"#c2410c",
            border:"1px solid #fed7aa",
            borderRadius:20, padding:"3px 10px",
          }}>
            <AlertTriangle size={10} /> ₹{fmt(student.totalFine)}
          </span>
        ) : (
          <span style={{ fontSize:11, color:"#94a3b8" }}>—</span>
        )}
      </td>
      <td style={{ padding:"13px 16px", textAlign:"center" }}>
        <span style={{
          fontSize:11, fontWeight:600,
          padding:"4px 10px", borderRadius:20,
          background: paid >= total ? "#f0fdf4" : "#fff7ed",
          color:       paid >= total ? "#15803d" : "#c2410c",
          border:      `1px solid ${paid >= total ? "#bbf7d0" : "#fed7aa"}`,
          display:"inline-flex", alignItems:"center", gap:5,
        }}>
          <span style={{
            width:6, height:6, borderRadius:"50%", display:"inline-block",
            background: paid >= total ? "#16a34a" : "#ea580c",
          }} />
          {paid >= total ? "Paid" : paid > 0 ? "Partial" : "Unpaid"}
        </span>
      </td>
    </tr>
  );
}

// ── Main Admin Dashboard ──────────────────────────────────────────────────────
export default function FAdminDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const { user } = useAuth();
  

  // filters
  const [searchAdm, setSearchAdm]   = useState("");
  const [yearFilter, setYearFilter] = useState("All");
  const [page, setPage]             = useState(1);

 const fetchDashboard = useCallback(async () => {
  setLoading(true);
  setError(null);

  try {
    const res = await fetch(
      `${API_BASE_URL}/admin/feeAdminDashBoardDetails?empId=${user.employeeId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const result = await res.json();

    setData(result);
    setLastSync(new Date());
    

  } catch (err) {
    setError(err.message || "Failed to load dashboard");
  } finally {
    setLoading(false);
  }
}, [user.employeeId]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // reset page on filter change
  useEffect(() => { setPage(1); }, [searchAdm, yearFilter]);

  // derived data
  const years = useMemo(() => {
    if (!data) return [];
    const s = new Set(data.students.map(s => s.currentYear));
    return ["All", ...Array.from(s).sort()];
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.students.filter(s => {
      const matchYear = yearFilter === "All" || s.currentYear === yearFilter;
      const matchAdm  = s.admissionNo.toLowerCase().includes(searchAdm.toLowerCase()) ||
                        s.studentName.toLowerCase().includes(searchAdm.toLowerCase());
      return matchYear && matchAdm;
    });
  }, [data, yearFilter, searchAdm]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pieData = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Collected", value: Number(data.revenueCollected) },
      { name: "Pending",   value: Number(data.pendingRevenue)   },
    ];
  }, [data]);

  const PIE_COLORS = ["#16a34a", "#ea580c"];

  // ── Loading ──
  if (loading) return (
    <div style={{
      minHeight:"100vh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      background:"linear-gradient(135deg,#f0fdf4 0%,#fafffe 60%,#dcfce7 100%)",
      fontFamily:"'DM Sans',sans-serif",
    }}>
      <LeafBg />
      <div style={{ position:"relative", zIndex:1, textAlign:"center" }}>
        <div style={{ animation:"spin 3s linear infinite", color:"#16a34a", marginBottom:16 }}>
          <Leaf size={48} strokeWidth={1.5} />
        </div>
        <p style={{ color:"#16a34a", fontWeight:600, fontSize:15 }}>Loading admin dashboard…</p>
      </div>
    </div>
  );

  // ── Error ──
  if (error) return (
    <div style={{
      minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"linear-gradient(135deg,#f0fdf4 0%,#fafffe 100%)",
      fontFamily:"'DM Sans',sans-serif",
    }}>
      <div style={{
        background:"#fff", borderRadius:16, padding:40, textAlign:"center",
        border:"1.5px solid #fecaca", maxWidth:360,
      }}>
        <AlertTriangle size={40} color="#ef4444" style={{ marginBottom:12 }} />
        <p style={{ fontWeight:700, fontSize:16, color:"#0f172a", margin:"0 0 6px" }}>Failed to load</p>
        <p style={{ fontSize:13, color:"#64748b", margin:"0 0 20px" }}>{error}</p>
        <button onClick={fetchDashboard} style={{
          background:"#16a34a", color:"#fff", border:"none",
          borderRadius:10, padding:"10px 24px", cursor:"pointer",
          fontWeight:600, fontSize:13, fontFamily:"inherit",
        }}>Try Again</button>
      </div>
    </div>
  );

  const hasActiveFilter = searchAdm !== "" || yearFilter !== "All";

  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(135deg,#f0fdf4 0%,#fafffe 55%,#dcfce7 100%)",
      fontFamily:"'DM Sans',sans-serif",
      position:"relative",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet" />
      <LeafBg />

      <div style={{ position:"relative", zIndex:1, maxWidth:1200, margin:"0 auto", padding:"28px 20px 48px" }}>

        {/* ── Header ── */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          marginBottom:28, flexWrap:"wrap", gap:12,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{
              width:48, height:48, borderRadius:14,
              background:"linear-gradient(135deg,#16a34a,#4ade80)",
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 4px 14px #16a34a40",
            }}>
              <Leaf size={24} color="#fff" strokeWidth={2} />
            </div>
            <div>
              <p style={{ margin:0, fontSize:12, color:"#16a34a", fontWeight:600, letterSpacing:".06em", textTransform:"uppercase" }}>
                Admin Portal
              </p>
              <p style={{ margin:0, fontSize:20, fontWeight:700, color:"#0f172a", fontFamily:"'DM Serif Display',serif", letterSpacing:"-0.3px" }}>
                Fee Dashboard
              </p>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {lastSync && (
              <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>
                Synced {lastSync.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })}
              </p>
            )}
            <button onClick={fetchDashboard} style={{
              display:"flex", alignItems:"center", gap:6,
              background:"#fff", border:"1.5px solid #dcfce7",
              borderRadius:10, padding:"8px 14px", cursor:"pointer",
              fontSize:12, fontWeight:600, color:"#16a34a", fontFamily:"inherit",
              boxShadow:"0 1px 4px #16a34a10",
            }}>
              <RefreshCw size={13} strokeWidth={2.5} /> Refresh
            </button>
          </div>
        </div>

        {/* ── Welcome Card ── */}
        <div style={{
          background:"linear-gradient(120deg,#16a34a 0%,#22c55e 60%,#4ade80 100%)",
          borderRadius:20, padding:"28px 32px",
          marginBottom:24, position:"relative", overflow:"hidden",
          boxShadow:"0 8px 32px #16a34a35",
          animation:"fadeUp .5s ease both",
        }}>
          {/* decorative leaves */}
          <div style={{ position:"absolute", right:28, top:"50%", transform:"translateY(-50%)", opacity:.12 }}>
            <Leaf size={120} color="#fff" strokeWidth={1} />
          </div>
          <div style={{ position:"absolute", right:140, top:8, opacity:.08 }}>
            <Leaf size={60} color="#fff" strokeWidth={1} />
          </div>

          <div style={{ position:"relative", zIndex:1 }}>
            <p style={{ margin:"0 0 4px", fontSize:13, color:"rgba(255,255,255,.75)", fontWeight:500 }}>
              Welcome back 👋
            </p>
            <h1 style={{
              margin:"0 0 16px", fontSize:26, fontWeight:700, color:"#fff",
              fontFamily:"'DM Serif Display',serif", letterSpacing:"-0.5px",
            }}>
              {user.name || user.employeeId}
            </h1>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {[
                { icon: Users,  label: `${data.totalStudents||0} Students` },
                { icon: MapPin, label: data.campus },
              ].map(({ icon: Icon, label }) => (
                <span key={label} style={{
                  background:"rgba(255,255,255,.18)", backdropFilter:"blur(4px)",
                  borderRadius:8, padding:"5px 12px", fontSize:12, color:"#fff", fontWeight:500,
                  border:"1px solid rgba(255,255,255,.25)",
                  display:"inline-flex", alignItems:"center", gap:6,
                }}>
                  {Icon && <Icon size={13} strokeWidth={2.2} />} {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── 4 Stat Cards ── */}
        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
          gap:16, marginBottom:24,
        }}>
          <StatCard icon={IndianRupee}  label="Total Revenue"      value={data.totalRevenue}      sub="Overall fee amount"         accent="#16a34a" delay=".05s" />
          <StatCard icon={TrendingUp}   label="Revenue Collected"  value={data.revenueCollected}  sub="Payments received"          accent="#0284c7" delay=".1s"  />
          <StatCard icon={Clock}        label="Pending Revenue"    value={data.pendingRevenue}    sub="Yet to be collected"        accent="#ea580c" delay=".15s" />
          <StatCard icon={AlertTriangle}label="Total Fine"         value={data.totalFine}         sub={`${data.totalStudents} students`} accent="#7c3aed" delay=".2s"  />
        </div>

        {/* ── Pie Chart + Summary ── */}
        <div style={{
          display:"grid", gridTemplateColumns:"1fr 1fr",
          gap:16, marginBottom:24,
          animation:"fadeUp .5s .22s ease both",
        }}>
          {/* Pie */}
          <div style={{
            background:"#fff", borderRadius:16, padding:"20px 24px",
            border:"1.5px solid #dcfce7",
            boxShadow:"0 2px 16px #16a34a0a",
          }}>
            <h3 style={{ margin:"0 0 4px", fontSize:15, fontWeight:700, color:"#0f172a" }}>Revenue Split</h3>
            <p style={{ margin:"0 0 16px", fontSize:12, color:"#94a3b8" }}>Collected vs Pending</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  animationBegin={200}
                  animationDuration={800}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle" iconSize={10}
                  formatter={(val) => (
                    <span style={{ fontSize:12, color:"#334155", fontFamily:"'DM Sans',sans-serif" }}>{val}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Collection summary */}
          <div style={{
            background:"#fff", borderRadius:16, padding:"20px 24px",
            border:"1.5px solid #dcfce7",
            boxShadow:"0 2px 16px #16a34a0a",
            display:"flex", flexDirection:"column", justifyContent:"space-between",
          }}>
            <div>
              <h3 style={{ margin:"0 0 4px", fontSize:15, fontWeight:700, color:"#0f172a" }}>Collection Summary</h3>
              <p style={{ margin:"0 0 20px", fontSize:12, color:"#94a3b8" }}>{data.campus} Campus</p>
            </div>

            {[
              { label:"Total Revenue",     value: data.totalRevenue,     color:"#16a34a" },
              { label:"Revenue Collected", value: data.revenueCollected, color:"#0284c7" },
              { label:"Pending Revenue",   value: data.pendingRevenue,   color:"#ea580c" },
              { label:"Total Fine",        value: data.totalFine,        color:"#7c3aed" },
            ].map(({ label, value, color }) => {
              const pct = Number(data.totalRevenue) > 0
                ? Math.round((Number(value) / Number(data.totalRevenue)) * 100) : 0;
              return (
                <div key={label} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <span style={{ fontSize:12, color:"#64748b", fontWeight:500 }}>{label}</span>
                    <span style={{ fontSize:12, fontWeight:700, color }}> ₹{fmt(value)}</span>
                  </div>
                  <div style={{ height:5, borderRadius:4, background:"#f1f5f9" }}>
                    <div style={{
                      height:"100%", width:`${pct}%`,
                      background:color, borderRadius:4,
                      transition:"width .8s ease",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Students Table ── */}
        <div style={{
          background:"#fff", borderRadius:16, overflow:"hidden",
          border:"1.5px solid #dcfce7",
          boxShadow:"0 2px 20px #16a34a0a",
          animation:"fadeUp .5s .28s ease both",
        }}>
          {/* Table Header */}
          <div style={{
            padding:"18px 20px",
            borderBottom:"2px solid #f0fdf4",
            display:"flex", alignItems:"center",
            justifyContent:"space-between", flexWrap:"wrap", gap:12,
          }}>
            <div>
              <h2 style={{ margin:0, fontSize:16, fontWeight:700, color:"#0f172a" }}>Student Fee Status</h2>
              <p style={{ margin:"3px 0 0", fontSize:12, color:"#94a3b8" }}>
                {filtered.length} of {data.students.length} students
                {hasActiveFilter && " (filtered)"}
              </p>
            </div>

            {/* Filters */}
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
              {/* Search */}
              <div style={{ position:"relative" }}>
                <Search size={14} color="#94a3b8" style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)" }} />
                <input
                  value={searchAdm}
                  onChange={e => setSearchAdm(e.target.value)}
                  placeholder="Name or Adm. No."
                  style={{
                    paddingLeft:32, paddingRight:searchAdm ? 28 : 12,
                    paddingTop:8, paddingBottom:8,
                    border:"1.5px solid #dcfce7", borderRadius:10,
                    fontSize:12, outline:"none", width:190,
                    fontFamily:"'DM Sans',sans-serif", color:"#0f172a",
                    background:"#fafffe",
                    transition:"border .15s",
                  }}
                  onFocus={e => e.target.style.borderColor = "#16a34a"}
                  onBlur={e  => e.target.style.borderColor = "#dcfce7"}
                />
                {searchAdm && (
                  <X size={13} color="#94a3b8" style={{
                    position:"absolute", right:9, top:"50%", transform:"translateY(-50%)",
                    cursor:"pointer",
                  }} onClick={() => setSearchAdm("")} />
                )}
              </div>

              {/* Year filter */}
              <div style={{ position:"relative" }}>
                <Filter size={13} color="#94a3b8" style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)" }} />
                <select
                  value={yearFilter}
                  onChange={e => setYearFilter(e.target.value)}
                  style={{
                    paddingLeft:28, paddingRight:12,
                    paddingTop:8, paddingBottom:8,
                    border:"1.5px solid #dcfce7", borderRadius:10,
                    fontSize:12, outline:"none", cursor:"pointer",
                    fontFamily:"'DM Sans',sans-serif", color:"#0f172a",
                    background:"#fafffe", appearance:"none",
                  }}
                >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {/* Clear */}
              {hasActiveFilter && (
                <button
                  onClick={() => { setSearchAdm(""); setYearFilter("All"); }}
                  style={{
                    display:"flex", alignItems:"center", gap:5,
                    background:"#fff7ed", border:"1px solid #fed7aa",
                    borderRadius:8, padding:"7px 12px", cursor:"pointer",
                    fontSize:12, fontWeight:500, color:"#c2410c", fontFamily:"inherit",
                  }}
                >
                  <X size={12} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Column labels */}
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"#f8fffe", borderBottom:"1px solid #dcfce7" }}>
                  {["Adm. No", "Student", "Total Amount", "Amount Paid", "Balance", "Fine", "Status"].map((h, i) => (
                    <th key={h} style={{
                      padding:"10px 16px", fontSize:11, fontWeight:600,
                      color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em",
                      textAlign: i <= 1 ? "left" : i === 6 ? "center" : "right",
                      whiteSpace:"nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign:"center", padding:"40px 0", color:"#94a3b8", fontSize:13 }}>
                      No students match the current filters.
                    </td>
                  </tr>
                ) : (
                  paginated.map((s, i) => <StudentRow key={s.admissionNo} student={s} index={i} />)
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"14px 20px", borderTop:"1.5px solid #f0fdf4",
            flexWrap:"wrap", gap:10,
          }}>
            <p style={{ fontSize:12, color:"#94a3b8", margin:0 }}>
              Showing {filtered.length === 0 ? 0 : (page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              <button
                onClick={() => setPage(p => Math.max(1, p-1))}
                disabled={page === 1}
                style={{
                  width:32, height:32, borderRadius:8,
                  border:"1.5px solid #dcfce7", background:"#fff",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color: page === 1 ? "#cbd5e1" : "#16a34a",
                  opacity: page === 1 ? .5 : 1,
                }}
              >
                <ChevronLeft size={15} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i+1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx-1] > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "…" ? (
                    <span key={`e${i}`} style={{ fontSize:13, color:"#94a3b8", padding:"0 2px" }}>…</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p)} style={{
                      width:32, height:32, borderRadius:8,
                      border: p === page ? "none" : "1.5px solid #dcfce7",
                      background: p === page ? "#16a34a" : "#fff",
                      color: p === page ? "#fff" : "#334155",
                      fontWeight: p === page ? 700 : 500,
                      cursor:"pointer", fontSize:13, fontFamily:"inherit",
                    }}>{p}</button>
                  )
                )
              }

              <button
                onClick={() => setPage(p => Math.min(totalPages, p+1))}
                disabled={page === totalPages}
                style={{
                  width:32, height:32, borderRadius:8,
                  border:"1.5px solid #dcfce7", background:"#fff",
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color: page === totalPages ? "#cbd5e1" : "#16a34a",
                  opacity: page === totalPages ? .5 : 1,
                }}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        <p style={{ textAlign:"center", fontSize:11, color:"#94a3b8", marginTop:24 }}>
          Data is refreshed in real-time · {data.campus} Campus · Admin: {user.employeeId}
        </p>
      </div>
    </div>
  );
}
