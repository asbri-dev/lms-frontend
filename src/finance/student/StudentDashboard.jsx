import { useState, useEffect, useCallback } from "react";
import {
  Snowflake, GraduationCap, IndianRupee, CheckCircle2,
  Wallet, CalendarClock, AlertTriangle, ChevronRight,
  RefreshCw, MapPin, BookOpen, User, Clock, Loader2
} from "lucide-react";
import { useAuth } from "../../auth/useAuth"; // adjust path as needed
import { API_BASE_URL } from "../../config/api";// your axios instance

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (val) =>
  Number(val).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const feeLabel = (key) => {
  const map = {
    tuitionFee: "Tuition Fee",
    transportationFee: "Transportation Fee",
    cautionDeposit: "Caution Deposit",
    bookFee: "Book Fee",
    uniformFee: "Uniform Fee",
    libraryAndLaboratoryFee: "Library & Lab Fee",
    industrialAndTrainingFee: "Industrial & Training",
    ratificationFee: "Ratification Fee",
    affiliationFee: "Affiliation Fee",
    alumniFee: "Alumni Fee",
    idCardFee: "ID Card Fee",
    applicationFee: "Application Fee",
    hostelAndMessFee: "Hostel & Mess Fee",
  };
  return map[key] || key;
};

const statusStyle = (status) => {
  if (status === "Paid")
    return { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0", dot: "#16a34a" };
  if (status === "Partial")
    return { bg: "#fffbeb", color: "#b45309", border: "#fde68a", dot: "#d97706" };
  return { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa", dot: "#ea580c" };
};

// ── Snowflake decorative bg ───────────────────────────────────────────────────
function SnowflakeBg() {
  const flakes = [
    { size: 80, x: "5%",  y: "10%", op: 0.06, dur: 18 },
    { size: 50, x: "88%", y: "5%",  op: 0.08, dur: 22 },
    { size: 120,x: "92%", y: "55%", op: 0.05, dur: 30 },
    { size: 40, x: "2%",  y: "70%", op: 0.07, dur: 25 },
    { size: 65, x: "50%", y: "2%",  op: 0.05, dur: 20 },
  ];
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:0 }}>
      {flakes.map((f, i) => (
        <div key={i} style={{
          position:"absolute", left:f.x, top:f.y,
          color:"#3D7DFC", opacity:f.op,
          animation:`spin ${f.dur}s linear infinite`,
        }}>
          <Snowflake size={f.size} strokeWidth={1} />
        </div>
      ))}
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent, delay }) {
  return (
    <div style={{
      background:"#fff",
      borderRadius:16,
      border:`1.5px solid ${accent}30`,
      padding:"20px 22px",
      display:"flex", flexDirection:"column", gap:10,
      position:"relative", overflow:"hidden",
      boxShadow:`0 2px 16px ${accent}12`,
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
        {Icon && <Icon size={20} color={accent} strokeWidth={2} /> }
      </div>
      <div>
        <p style={{ fontSize:12, color:"#64748b", margin:"0 0 4px", fontFamily:"'DM Sans',sans-serif" }}>{label}</p>
        <p style={{ fontSize:22, fontWeight:700, color:"#0f172a", margin:0, fontFamily:"'DM Sans',sans-serif", letterSpacing:"-0.5px" }}>
          ₹{fmt(value)}
        </p>
        {sub && <p style={{ fontSize:11, color: accent, margin:"4px 0 0", fontWeight:500 }}>{sub}</p>}
      </div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

// ── Info Chip ─────────────────────────────────────────────────────────────────
function Chip({ icon: Icon, label }) {
  return (
    <div style={{
      display:"inline-flex", alignItems:"center", gap:6,
      background:"#E9F3FF", borderRadius:8,
      padding:"5px 11px", fontSize:12, color:"#1e4db7", fontWeight:500,
    }}>
      {Icon && <Icon size={13} strokeWidth={2.2} />}
      {label}
    </div>
  );
}

// ── Fee Row ───────────────────────────────────────────────────────────────────
function FeeRow({ fee, index }) {
  const st = statusStyle(fee.feeStatus);
  const paid = Number(fee.amountPaid);
  const total = Number(fee.amountToBePaid);
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;

  return (
    <div style={{
      display:"grid",
      gridTemplateColumns:"1fr 100px 100px 100px 110px",
      gap:12, alignItems:"center",
      padding:"14px 20px",
      borderBottom:"1px solid #f1f5f9",
      animation:"fadeUp .4s ease both",
      animationDelay:`${index * 0.04}s`,
      transition:"background .15s",
    }}
      onMouseEnter={e => e.currentTarget.style.background = "#f8faff"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <div>
        <p style={{ margin:0, fontWeight:600, fontSize:13, color:"#0f172a" }}>
          {feeLabel(fee.typeOfFee)}
        </p>
        {Number(fee.fineAmount) > 0 && (
          <p style={{ margin:"3px 0 0", fontSize:11, color:"#ef4444", display:"flex", alignItems:"center", gap:4 }}>
            <AlertTriangle size={11} /> Fine: ₹{fmt(fee.fineAmount)}
          </p>
        )}
      </div>
      <p style={{ margin:0, fontSize:13, color:"#334155", textAlign:"right", fontWeight:500 }}>₹{fmt(fee.amountToBePaid)}</p>
      <p style={{ margin:0, fontSize:13, color:"#16a34a", textAlign:"right", fontWeight:500 }}>₹{fmt(fee.amountPaid)}</p>
      <div style={{ textAlign:"right" }}>
        <p style={{ margin:0, fontSize:13, color:"#3D7DFC", fontWeight:600 }}>₹{fmt(total - paid)}</p>
        <div style={{ marginTop:4, height:3, borderRadius:4, background:"#e2e8f0" }}>
          <div style={{ height:"100%", width:`${pct}%`, background:"#3D7DFC", borderRadius:4, transition:"width .6s ease" }} />
        </div>
      </div>
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <span style={{
          fontSize:11, fontWeight:600,
          padding:"4px 10px", borderRadius:20,
          background: st.bg, color: st.color,
          border:`1px solid ${st.border}`,
          display:"flex", alignItems:"center", gap:5,
        }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background: st.dot, display:"inline-block" }} />
          {fee.feeStatus}
        </span>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [lastSync, setLastSync] = useState(null);
    const { user } = useAuth(); // expects user.admissionNo or user.studentAdmissionNumber
  const admissionNo = user.admissionNumber;

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
          `${API_BASE_URL}/myDashboard?admissionNo=${(admissionNo)}`,
          { method: "GET", headers: { "Content-Type": "application/json" } }
        );
      const responseData = await res.json();
      setData(responseData);
      setLastSync(new Date());
    } catch (err) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [admissionNo]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // ── Loading ──
  if (loading) return (
    <div style={{
      minHeight:"100vh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      background:"linear-gradient(135deg,#E9F3FF 0%,#f8faff 60%,#D8E4FA 100%)",
      fontFamily:"'DM Sans',sans-serif",
    }}>
      <SnowflakeBg />
      <div style={{ position:"relative", zIndex:1, textAlign:"center" }}>
        <div style={{ animation:"spin 2s linear infinite", color:"#3D7DFC", marginBottom:16 }}>
          <Snowflake size={48} strokeWidth={1.5} />
        </div>
        <p style={{ color:"#3D7DFC", fontWeight:600, fontSize:15 }}>Loading your dashboard…</p>
      </div>
    </div>
  );

  // ── Error ──
  if (error) return (
    <div style={{
      minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"linear-gradient(135deg,#E9F3FF 0%,#f8faff 100%)",
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
          background:"#3D7DFC", color:"#fff", border:"none",
          borderRadius:10, padding:"10px 24px", cursor:"pointer",
          fontWeight:600, fontSize:13, fontFamily:"inherit",
        }}>
          Try Again
        </button>
      </div>
    </div>
  );

  const { studInfo, fees, totals } = data;

  // nearest due date (excluding "To be Announced")
  const nextDue = fees
    .filter(f => f.dueDate !== "To be Announced" && f.feeStatus !== "Paid")
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0]?.dueDate || "—";

  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(135deg,#E9F3FF 0%,#f8faff 55%,#D8E4FA 100%)",
      fontFamily:"'DM Sans',sans-serif",
      position:"relative",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet" />
      <SnowflakeBg />

      <div style={{ position:"relative", zIndex:1, maxWidth:1180, margin:"0 auto", padding:"28px 20px 48px" }}>

        {/* ── Header ── */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          marginBottom:28, flexWrap:"wrap", gap:12,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{
              width:48, height:48, borderRadius:14,
              background:"linear-gradient(135deg,#3D7DFC,#6fa3ff)",
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 4px 14px #3D7DFC40",
            }}>
              <Snowflake size={24} color="#fff" strokeWidth={2} />
            </div>
            <div>
              <p style={{ margin:0, fontSize:12, color:"#3D7DFC", fontWeight:600, letterSpacing:".06em", textTransform:"uppercase" }}>
                Student Portal
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
              background:"#fff", border:"1.5px solid #D8E4FA",
              borderRadius:10, padding:"8px 14px", cursor:"pointer",
              fontSize:12, fontWeight:600, color:"#3D7DFC", fontFamily:"inherit",
              boxShadow:"0 1px 4px #3D7DFC10",
            }}>
              <RefreshCw size={13} strokeWidth={2.5} /> Refresh
            </button>
          </div>
        </div>

        {/* ── Welcome Card ── */}
        <div style={{
          background:"linear-gradient(120deg,#3D7DFC 0%,#5b93ff 60%,#80aeff 100%)",
          borderRadius:20, padding:"28px 32px",
          marginBottom:24, position:"relative", overflow:"hidden",
          boxShadow:"0 8px 32px #3D7DFC35",
          animation:"fadeUp .5s ease both",
        }}>
          {/* decorative snowflakes inside card */}
          <div style={{ position:"absolute", right:24, top:"50%", transform:"translateY(-50%)", opacity:.15 }}>
            <Snowflake size={110} color="#fff" strokeWidth={1} style={{ animation:"spin 25s linear infinite" }} />
          </div>
          <div style={{ position:"absolute", right:120, top:10, opacity:.08 }}>
            <Snowflake size={55} color="#fff" strokeWidth={1} style={{ animation:"spin 18s linear infinite reverse" }} />
          </div>

          <div style={{ position:"relative", zIndex:1 }}>
            <p style={{ margin:"0 0 4px", fontSize:13, color:"rgba(255,255,255,.75)", fontWeight:500 }}>
              Welcome back 👋
            </p>
            <h1 style={{
              margin:"0 0 16px", fontSize:26, fontWeight:700, color:"#fff",
              fontFamily:"'DM Serif Display',serif", letterSpacing:"-0.5px",
            }}>
              {studInfo.studentFullName}
            </h1>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              <span style={{
                background:"rgba(255,255,255,.18)", backdropFilter:"blur(4px)",
                borderRadius:8, padding:"5px 12px", fontSize:12, color:"#fff", fontWeight:500,
                border:"1px solid rgba(255,255,255,.25)",
              }}>
                {studInfo.studentAdmissionNumber}
              </span>
              <span style={{
                background:"rgba(255,255,255,.18)", backdropFilter:"blur(4px)",
                borderRadius:8, padding:"5px 12px", fontSize:12, color:"#fff", fontWeight:500,
                border:"1px solid rgba(255,255,255,.25)",
              }}>
                {studInfo.studentDepartment} · Sem {studInfo.currentSemester}
              </span>
              <span style={{
                background:"rgba(255,255,255,.18)", backdropFilter:"blur(4px)",
                borderRadius:8, padding:"5px 12px", fontSize:12, color:"#fff", fontWeight:500,
                border:"1px solid rgba(255,255,255,.25)",
              }}>
                {studInfo.studentCampus}
              </span>
              <span style={{
                background:"rgba(255,255,255,.18)", backdropFilter:"blur(4px)",
                borderRadius:8, padding:"5px 12px", fontSize:12, color:"#fff", fontWeight:500,
                border:"1px solid rgba(255,255,255,.25)",
              }}>
                AY {studInfo.currentAcademicYear}
              </span>
            </div>
          </div>
        </div>

        {/* ── 4 Stat Cards ── */}
        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
          gap:16, marginBottom:24,
        }}>
          <StatCard
            icon={IndianRupee}
            label="Total Amount"
            value={totals.totalAmount}
            sub={`Fine: ₹${fmt(totals.totalFine)}`}
            accent="#3D7DFC"
            delay=".05s"
          />
          <StatCard
            icon={CheckCircle2}
            label="Amount Paid"
            value={totals.amountPaid}
            sub={totals.amountPaid === "0" ? "No payments yet" : "Payments recorded"}
            accent="#16a34a"
            delay=".1s"
          />
          <StatCard
            icon={Wallet}
            label="Balance Due"
            value={totals.balanceIncludingFine}
            sub={`Excl. fine: ₹${fmt(totals.balanceExcludingFine)}`}
            accent="#ea580c"
            delay=".15s"
          />
          <StatCard
            icon={CalendarClock}
            label="Next Due Date"
            value={0}
            sub={nextDue}
            accent="#7c3aed"
            delay=".2s"
          />
        </div>

        {/* ── Info strip ── */}
        <div style={{
          background:"#fff", borderRadius:14, padding:"14px 20px",
          marginBottom:24, display:"flex", flexWrap:"wrap", gap:10,
          border:"1.5px solid #E9F3FF",
          boxShadow:"0 1px 8px #3D7DFC08",
          animation:"fadeUp .5s .22s ease both",
        }}>
          <Chip icon={User}     label={`${studInfo.casteCategory} · ${studInfo.studentType}`} />
          <Chip icon={BookOpen} label={`Fee Code: ${studInfo.applicableFeeCode}`} />
          <Chip icon={MapPin}   label={studInfo.studentCampus} />
          <Chip icon={Clock}    label={`Semester ${studInfo.currentSemester}`} />
          <Chip icon={GraduationCap} label={studInfo.feeType} />
        </div>

        {/* ── Fee Breakdown Table ── */}
        <div style={{
          background:"#fff", borderRadius:16, overflow:"hidden",
          border:"1.5px solid #E9F3FF",
          boxShadow:"0 2px 20px #3D7DFC0a",
          animation:"fadeUp .5s .25s ease both",
        }}>
          {/* table header */}
          <div style={{
            padding:"18px 20px",
            borderBottom:"2px solid #E9F3FF",
            display:"flex", alignItems:"center", justifyContent:"space-between",
          }}>
            <div>
              <h2 style={{ margin:0, fontSize:16, fontWeight:700, color:"#0f172a" }}>Fee Breakdown</h2>
              <p style={{ margin:"3px 0 0", fontSize:12, color:"#94a3b8" }}>
                {fees.length} fee items · AY {studInfo.currentAcademicYear}
              </p>
            </div>
            <div style={{
              background:"#E9F3FF", borderRadius:8, padding:"6px 14px",
              fontSize:12, fontWeight:600, color:"#3D7DFC",
            }}>
              {fees.filter(f => f.feeStatus === "Paid").length}/{fees.length} Paid
            </div>
          </div>

          {/* column labels */}
          <div style={{
            display:"grid",
            gridTemplateColumns:"1fr 100px 100px 100px 110px",
            gap:12, padding:"10px 20px",
            background:"#f8faff",
            borderBottom:"1px solid #E9F3FF",
          }}>
            {["Fee Type","Total","Paid","Balance","Status"].map((h, i) => (
              <p key={h} style={{
                margin:0, fontSize:11, fontWeight:600, color:"#94a3b8",
                textTransform:"uppercase", letterSpacing:".06em",
                textAlign: i === 0 ? "left" : "right",
              }}>{h}</p>
            ))}
          </div>

          {/* rows */}
          {fees.map((fee, i) => <FeeRow key={fee.typeOfFee} fee={fee} index={i} />)}

          {/* totals footer */}
          <div style={{
            display:"grid",
            gridTemplateColumns:"1fr 100px 100px 100px 110px",
            gap:12, padding:"16px 20px",
            background:"linear-gradient(90deg,#E9F3FF 0%,#f0f6ff 100%)",
            borderTop:"2px solid #D8E4FA",
          }}>
            <p style={{ margin:0, fontWeight:700, fontSize:13, color:"#0f172a" }}>Total</p>
            <p style={{ margin:0, fontWeight:700, fontSize:13, color:"#0f172a", textAlign:"right" }}>₹{fmt(totals.totalAmount)}</p>
            <p style={{ margin:0, fontWeight:700, fontSize:13, color:"#16a34a", textAlign:"right" }}>₹{fmt(totals.amountPaid)}</p>
            <p style={{ margin:0, fontWeight:700, fontSize:13, color:"#3D7DFC", textAlign:"right" }}>₹{fmt(totals.balanceIncludingFine)}</p>
            <div />
          </div>
        </div>

        {/* footer */}
        <p style={{ textAlign:"center", fontSize:11, color:"#94a3b8", marginTop:24 }}>
          Data is refreshed in real-time from the institution server · {studInfo.studentCampus} Campus
        </p>
      </div>
    </div>
  );
}
