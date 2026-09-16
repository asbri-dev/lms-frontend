import { useState, useEffect, useMemo } from "react";
import {
  Search,
  X,
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet,
  TrendingDown,
  MapPin,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../../config/api";

// ─── Fee type human-readable label map ───────────────────────────────────────
const FEE_LABELS = {
  firstYearBookFee: "1st Year Book Fee",
  firstYearTuitionFee: "1st Year Tuition Fee",
  firstYearBusFee: "1st Year Bus Fee",
  firstYearUniformFee: "1st Year Uniform Fee",
  firstYearAffiliationFee: "1st Year Affiliation Fee",
  oneOneTuitionFee: "1st Yr Sem 1 Tuition Fee",
  oneOneBusFee: "1st Yr Sem 1 Bus Fee",
  oneTwoTuitionFee: "1st Yr Sem 2 Tuition Fee",
  oneTwoBusFee: "1st Yr Sem 2 Bus Fee",
  twoOneTuitionFee: "2nd Yr Sem 1 Tuition Fee",
  twoOneBusFee: "2nd Yr Sem 1 Bus Fee",
  twoTwoTuitionFee: "2nd Yr Sem 2 Tuition Fee",
  twoTwoBusFee: "2nd Yr Sem 2 Bus Fee",
  threeOneTuitionFee: "3rd Yr Sem 1 Tuition Fee",
  threeOneBusFee: "3rd Yr Sem 1 Bus Fee",
  threeTwoTuitionFee: "3rd Yr Sem 2 Tuition Fee",
  threeTwoBusFee: "3rd Yr Sem 2 Bus Fee",
  uniformFee: "Uniform Fee",
  affiliationFee: "Affiliation Fee",
  examFee: "Exam Fee",
  labFee: "Lab Fee",
  libraryFee: "Library Fee",
  sportsFee: "Sports Fee",
  admissionFee: "Admission Fee",
  cautionDeposit: "Caution Deposit",
  developmentFee: "Development Fee",
  hostelFee: "Hostel Fee",
  messFee: "Mess Fee",
};

const feeLabel = (key) => {
  if (!key) return "—";
  if (FEE_LABELS[key]) return FEE_LABELS[key];
  // Fallback: camelCase → "Camel Case"
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
};

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ row }) => {
  if (row.error) {
    return (
      <span
        title={row.error}
        style={{
          background: "#fee2e2",
          color: "#dc2626",
          border: "1px solid #fca5a5",
          fontSize: 11,
          fontWeight: 600,
          borderRadius: 99,
          padding: "3px 10px",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          cursor: "help",
          whiteSpace: "nowrap",
        }}
      >
        <AlertTriangle size={11} />
        Error
      </span>
    );
  }
  if (row.statusAfterWaiveOff === "Waived") {
    return (
      <span
        style={{
          background: "#dcfce7",
          color: "#16a34a",
          border: "1px solid #86efac",
          fontSize: 11,
          fontWeight: 600,
          borderRadius: 99,
          padding: "3px 10px",
          whiteSpace: "nowrap",
        }}
      >
        ✓ Waived
      </span>
    );
  }
  if (row.statusAfterWaiveOff === "Partial") {
    return (
      <span
        style={{
          background: "#fef9c3",
          color: "#a16207",
          border: "1px solid #fde047",
          fontSize: 11,
          fontWeight: 600,
          borderRadius: 99,
          padding: "3px 10px",
          whiteSpace: "nowrap",
        }}
      >
        ~ Partial
      </span>
    );
  }
  return (
    <span
      style={{
        background: "#f1f5f9",
        color: "#64748b",
        border: "1px solid #e2e8f0",
        fontSize: 11,
        fontWeight: 600,
        borderRadius: 99,
        padding: "3px 10px",
      }}
    >
      {row.statusAfterWaiveOff || "—"}
    </span>
  );
};

// ─── Location micro-label ─────────────────────────────────────────────────────
const LocationPill = ({ loc }) => {
  const isChittoor = loc?.toLowerCase() === "chittoor";
  return (
    <span
      style={{
        background: isChittoor ? "#eff6ff" : "#f0fdf4",
        color: isChittoor ? "#1d4ed8" : "#15803d",
        border: `1px solid ${isChittoor ? "#bfdbfe" : "#bbf7d0"}`,
        fontSize: 10,
        fontWeight: 700,
        borderRadius: 99,
        padding: "2px 9px",
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      {loc || "—"}
    </span>
  );
};

// ─── Shimmer skeleton row ─────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr>
    {Array.from({ length: 9 }).map((_, i) => (
      <td key={i} style={{ padding: "14px 16px" }}>
        <div
          style={{
            height: 13,
            borderRadius: 6,
            background:
              "linear-gradient(90deg,#fed7aa 0%,#fff7ed 50%,#fed7aa 100%)",
            backgroundSize: "200% 100%",
            animation: "whShimmer 1.5s infinite",
          }}
        />
      </td>
    ))}
  </tr>
);

// ─── Main page ────────────────────────────────────────────────────────────────
export default function WaiveOffHistoryPage() {


  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("All");
  const [dept, setDept] = useState("All");
  const [acadYear, setAcadYear] = useState("All");

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/waiveOffHistory`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      const merged = [
        ...(json.chittoorWaiveOffDetails || []),
        ...(json.palakkadWaiveOffDetails || []),
      ];
      setRawData(merged);
    } catch (err) {
      setError(err.message || "Failed to load waive-off history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Distinct filter options ───────────────────────────────────────────────
  const deptOptions = useMemo(() => {
    const s = new Set(rawData.map((r) => r.studeDept).filter(Boolean));
    return ["All", ...Array.from(s).sort()];
  }, [rawData]);

  const yearOptions = useMemo(() => {
    const s = new Set(rawData.map((r) => r.academicYear || "N/A"));
    return ["All", ...Array.from(s).sort()];
  }, [rawData]);

  // ── Filtered rows ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rawData.filter((r) => {
      if (
        locationFilter !== "All" &&
        r.location?.toLowerCase() !== locationFilter.toLowerCase()
      )
        return false;
      if (dept !== "All" && r.studeDept !== dept) return false;
      if (acadYear !== "All" && (r.academicYear || "N/A") !== acadYear)
        return false;
      if (
        q &&
        !r.studentName?.toLowerCase().includes(q) &&
        !r.admissionNo?.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [rawData, search, locationFilter, dept, acadYear]);

  // ── Summary stats (based on filtered) ────────────────────────────────────
  const stats = useMemo(() => {
    const totalAmt = filtered.reduce(
      (sum, r) => sum + (parseFloat(r.waiveOffAmount) || 0),
      0
    );
    const chittoor = filtered.filter(
      (r) => r.location?.toLowerCase() === "chittoor"
    ).length;
    const palakkad = filtered.filter(
      (r) => r.location?.toLowerCase() === "palakkad"
    ).length;
    return { total: filtered.length, totalAmt, chittoor, palakkad };
  }, [filtered]);

  const hasActiveFilters =
    search || locationFilter !== "All" || dept !== "All" || acadYear !== "All";

  const clearFilters = () => {
    setSearch("");
    setLocationFilter("All");
    setDept("All");
    setAcadYear("All");
  };

  // ── Excel download ────────────────────────────────────────────────────────
  const downloadExcel = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/downloadWaiveOffHist`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "WaiveOff_History.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Excel downloaded successfully");
    } catch (err) {
      console.log(err);
      toast.error("Failed to download Excel. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');

        @keyframes whShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes whFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .wh-page * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }

        .wh-table tr:hover td { background: #fff7ed !important; }

        .wh-select {
          border: 1.5px solid #fed7aa;
          border-radius: 10px;
          padding: 8px 32px 8px 12px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          background: white;
          color: #1e293b;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ea580c' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          cursor: pointer;
          outline: none;
          transition: border-color 0.18s;
          min-width: 148px;
        }
        .wh-select:focus { border-color: #ea580c; }

        .wh-loc-pill {
          padding: 7px 18px;
          border-radius: 99px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: 1.5px solid transparent;
          transition: all 0.18s;
          white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
        }
        .wh-loc-pill-active  { background: #ea580c; color: white; border-color: #ea580c; }
        .wh-loc-pill-inactive { background: white; color: #ea580c; border-color: #fed7aa; }
        .wh-loc-pill-inactive:hover { background: #fff7ed; border-color: #ea580c; }

        .wh-dl-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 12px;
          border: none;
          background: white;
          color: #ea580c;
          font-weight: 700;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: box-shadow 0.18s, transform 0.18s;
          box-shadow: 0 2px 10px rgba(234,88,12,0.18);
          white-space: nowrap;
        }
        .wh-dl-btn:hover:not(:disabled) { box-shadow: 0 4px 18px rgba(234,88,12,0.28); transform: translateY(-1px); }
        .wh-dl-btn:disabled { opacity: 0.62; cursor: not-allowed; transform: none; }

        .wh-stat-card {
          background: white;
          border-radius: 14px;
          padding: 18px 22px;
          border: 1.5px solid #fed7aa;
          display: flex;
          align-items: center;
          gap: 14px;
          flex: 1;
          min-width: 155px;
          animation: whFadeUp 0.4s ease both;
          box-shadow: 0 1px 4px rgba(234,88,12,0.06);
        }
        .wh-stat-icon {
          width: 42px; height: 42px; border-radius: 12px;
          background: #fff7ed;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .wh-retry-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          border-radius: 12px;
          border: none;
          background: #ea580c;
          color: white;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.18s;
        }
        .wh-retry-btn:hover { background: #c2410c; }

        .wh-clear-filter-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 8px 14px;
          border-radius: 10px;
          border: 1.5px solid #fca5a5;
          background: #fff1f2;
          color: #dc2626;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.15s;
        }
        .wh-clear-filter-btn:hover { background: #fee2e2; }
      `}</style>

      <div
        className="wh-page"
        style={{
          padding: "28px 24px",
          background: "#F8FAFC",
          minHeight: "100vh",
          animation: "whFadeUp 0.35s ease both",
        }}
      >
        {/* ── Gradient header ───────────────────────────────────────────────── */}
        <div
          style={{
            background:
              "linear-gradient(135deg, #ffedd5, #fdba74)",
            borderRadius: 20,
            padding: "32px 36px",
            marginBottom: 24,
            position: "relative",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          {/* Decorative circles */}
          <div
            style={{
              position: "absolute",
              top: -48,
              right: -48,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.07)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -28,
              right: 140,
              width: 110,
              height: 110,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              pointerEvents: "none",
            }}
          />

          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  background: "hsla(33, 19%, 91%, 0.97)",
                  borderRadius: 10,
                  padding: "6px 8px",
                  display: "inline-flex",
                }}
              >
                <TrendingDown size={22} color="orange" />
              </div>
              <span
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: 26,
                  fontWeight: 400,
                  color: "black",
                  letterSpacing: "-0.3px",
                }}
              >
                Waive Off History
              </span>
            </div>
            <p
              style={{
                color: "black",
                fontSize: 13,
                margin: 0,
                fontWeight: 400,
              }}
            >
              Fee waiver records across Chittoor &amp; Palakkad campuses
            </p>
          </div>

          <button
            className="wh-dl-btn"
            onClick={downloadExcel}
            disabled={downloading || loading}
          >
            <FileSpreadsheet size={16} />
            {downloading ? "Downloading…" : "Download Excel"}
          </button>
        </div>

        {/* ── Summary stat cards ────────────────────────────────────────────── */}
        {!loading && !error && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              marginBottom: 24,
            }}
          >
            {[
              {
                label: "Total Records",
                value: stats.total,
                icon: <Users size={18} color="#ea580c" />,
                delay: "0s",
              },
              {
                label: "Total Waived",
                value: `₹${stats.totalAmt.toLocaleString("en-IN")}`,
                icon: <TrendingDown size={18} color="#ea580c" />,
                delay: "0.07s",
              },
              {
                label: "Chittoor",
                value: stats.chittoor,
                icon: <MapPin size={18} color="#1d4ed8" />,
                delay: "0.14s",
              },
              {
                label: "Palakkad",
                value: stats.palakkad,
                icon: <MapPin size={18} color="#15803d" />,
                delay: "0.21s",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="wh-stat-card"
                style={{ animationDelay: s.delay }}
              >
                <div className="wh-stat-icon">{s.icon}</div>
                <div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: "#1e293b",
                      lineHeight: 1.1,
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#94a3b8",
                      fontWeight: 500,
                      marginTop: 2,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Filter bar ────────────────────────────────────────────────────── */}
        {!loading && !error && (
          <div
            style={{
              background: "white",
              border: "1.5px solid #fed7aa",
              borderRadius: 16,
              padding: "18px 22px",
              marginBottom: 20,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
            }}
          >
            {/* Search */}
            <div style={{ position: "relative", flex: "1 1 220px" }}>
              <Search
                size={15}
                style={{
                  position: "absolute",
                  left: 11,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#ea580c",
                  pointerEvents: "none",
                }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or admission no."
                style={{
                  width: "100%",
                  border: "1.5px solid #fed7aa",
                  borderRadius: 10,
                  padding: "8px 32px 8px 34px",
                  fontSize: 13,
                  fontFamily: "'DM Sans', sans-serif",
                  outline: "none",
                  color: "#1e293b",
                  transition: "border-color 0.18s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#ea580c")}
                onBlur={(e) => (e.target.style.borderColor = "#fed7aa")}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8",
                    padding: 0,
                    display: "flex",
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Location pills */}
            <div style={{ display: "flex", gap: 6 }}>
              {["All", "Chittoor", "Palakkad"].map((l) => (
                <button
                  key={l}
                  className={`wh-loc-pill ${
                    locationFilter === l
                      ? "wh-loc-pill-active"
                      : "wh-loc-pill-inactive"
                  }`}
                  onClick={() => setLocationFilter(l)}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Department */}
            <select
              className="wh-select"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
            >
              {deptOptions.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>

            {/* Academic Year */}
            <select
              className="wh-select"
              value={acadYear}
              onChange={(e) => setAcadYear(e.target.value)}
            >
              {yearOptions.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button className="wh-clear-filter-btn" onClick={clearFilters}>
                <X size={12} />
                Clear
              </button>
            )}
          </div>
        )}

        {/* ── Loading skeleton ──────────────────────────────────────────────── */}
        {loading && (
          <div
            style={{
              background: "white",
              borderRadius: 16,
              border: "1.5px solid #fed7aa",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    background:
                      "linear-gradient(90deg,#fff7ed 0%,#fed7aa33 100%)",
                  }}
                >
                  {[
                    "Adm. No",
                    "Student",
                    "Dept",
                    "Fee Type",
                    "Acad. Year",
                    "Amount",
                    "Basis",
                    "Status",
                    "Location",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "13px 16px",
                        textAlign: "left",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#9a3412",
                        letterSpacing: "0.03em",
                        whiteSpace: "nowrap",
                        borderBottom: "1.5px solid #fed7aa",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Error state ───────────────────────────────────────────────────── */}
        {!loading && error && (
          <div
            style={{
              background: "white",
              borderRadius: 16,
              border: "1.5px solid #fca5a5",
              padding: "56px 24px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#fee2e2",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <AlertTriangle size={26} color="#dc2626" />
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#1e293b",
                marginBottom: 6,
              }}
            >
              Failed to load waive-off records
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>
              {error}
            </div>
            <button className="wh-retry-btn" onClick={fetchData}>
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        )}

        {/* ── Data table ────────────────────────────────────────────────────── */}
        {!loading && !error && (
          <div
            style={{
              background: "white",
              borderRadius: 16,
              border: "1.5px solid #fed7aa",
              overflow: "hidden",
              boxShadow: "0 2px 12px rgba(234,88,12,0.06)",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table
                className="wh-table"
                style={{ width: "100%", borderCollapse: "collapse" }}
              >
                <thead>
                  <tr
                    style={{
                      background:
                        "linear-gradient(90deg,#fff7ed 0%,#fed7aa44 100%)",
                    }}
                  >
                    {[
                      "Adm. No",
                      "Student",
                      "Dept",
                      "Fee Type",
                      "Acad. Year",
                      "Amount",
                      "Basis",
                      "Status",
                      "Location",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "13px 16px",
                          textAlign: "left",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#9a3412",
                          letterSpacing: "0.03em",
                          whiteSpace: "nowrap",
                          borderBottom: "1.5px solid #fed7aa",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {/* ── Empty state ─────────────────────────────────────────── */}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        style={{ padding: "64px 24px", textAlign: "center" }}
                      >
                        <div
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: "50%",
                            background: "#fff7ed",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 14,
                          }}
                        >
                          <Search size={22} color="#ea580c" />
                        </div>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#1e293b",
                            marginBottom: 6,
                          }}
                        >
                          {rawData.length === 0
                            ? "No waive-off records found"
                            : "No records match your filters"}
                        </div>
                        <div style={{ fontSize: 13, color: "#94a3b8" }}>
                          {rawData.length === 0
                            ? "Waive-off entries will appear here once created."
                            : "Try adjusting your search or filter criteria."}
                        </div>
                        {hasActiveFilters && (
                          <button
                            onClick={clearFilters}
                            style={{
                              marginTop: 16,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "8px 18px",
                              borderRadius: 10,
                              border: "1.5px solid #fed7aa",
                              background: "#fff7ed",
                              color: "#ea580c",
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: "pointer",
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            <X size={13} />
                            Clear filters
                          </button>
                        )}
                      </td>
                    </tr>
                  )}

                  {/* ── Data rows ───────────────────────────────────────────── */}
                  {filtered.map((row, idx) => (
                    <tr
                      key={`${row.admissionNo}-${row.waiveOffFeeType}-${idx}`}
                      style={{
                        background: row.error
                          ? "#fff5f5"
                          : idx % 2 === 0
                          ? "white"
                          : "#fffbf8",
                        borderBottom: "1px solid #fef3c7",
                        transition: "background 0.14s",
                      }}
                    >
                      {/* Adm. No */}
                      <td
                        style={{
                          padding: "13px 16px",
                          fontFamily: "monospace",
                          fontSize: 12,
                          color: "#1e293b",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.admissionNo || "—"}
                      </td>

                      {/* Student */}
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#1e293b",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.studentName || "—"}
                      </td>

                      {/* Dept */}
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: 13,
                          color: "#475569",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.studeDept || "—"}
                      </td>

                      {/* Fee Type */}
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: 13,
                          color: "#374151",
                          maxWidth: 210,
                        }}
                      >
                        {feeLabel(row.waiveOffFeeType)}
                      </td>

                      {/* Academic Year */}
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: 13,
                          color: row.academicYear ? "#374151" : "#94a3b8",
                          fontStyle: row.academicYear ? "normal" : "italic",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.academicYear || "N/A"}
                      </td>

                      {/* Amount */}
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#ea580c",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ₹
                        {parseFloat(row.waiveOffAmount || 0).toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      {/* Basis */}
                      <td
                        style={{ padding: "13px 16px", whiteSpace: "nowrap" }}
                      >
                        <span
                          style={{
                            background: "#fff7ed",
                            color: "#c2410c",
                            border: "1px solid #fed7aa",
                            fontSize: 11,
                            fontWeight: 600,
                            borderRadius: 99,
                            padding: "3px 10px",
                          }}
                        >
                          {row.waiveOffBasedOn || "—"}
                        </span>
                      </td>

                      {/* Status */}
                      <td
                        style={{ padding: "13px 16px", whiteSpace: "nowrap" }}
                      >
                        <StatusBadge row={row} />
                      </td>

                      {/* Location */}
                      <td
                        style={{ padding: "13px 16px", whiteSpace: "nowrap" }}
                      >
                        <LocationPill loc={row.location} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            {filtered.length > 0 && (
              <div
                style={{
                  padding: "12px 22px",
                  borderTop: "1px solid #fed7aa",
                  background: "#fffbf8",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  Showing{" "}
                  <strong style={{ color: "#ea580c" }}>{filtered.length}</strong>{" "}
                  of{" "}
                  <strong style={{ color: "#1e293b" }}>{rawData.length}</strong>{" "}
                  records
                </span>
                {hasActiveFilters && (
                  <span style={{ fontSize: 11, color: "#cbd5e1" }}>
                    Filters applied
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
