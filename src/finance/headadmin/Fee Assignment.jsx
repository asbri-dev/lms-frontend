import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  ChevronDown,
  ChevronRight,
  MapPin,
  GraduationCap,
  User,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  Inbox,
  X,
  Wallet,
  CheckCircle2,
  Clock,
  Loader2,
  Sun,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../auth/useAuth";
import { API_BASE_URL } from "../../config/api";

/* ============================================================
   THEME — Head Admin / Sun ☀️ Orange
   ============================================================ */
const THEME = {
  primary: "#ea580c",
  deep: "#c2410c",
  light: "#fff7ed",
  mid: "#fed7aa",
  pageBg: "#F8FAFC",
};

/* ============================================================
   FEE NAME → HUMAN LABEL  (inline, no separate util)
   ============================================================ */
const PLAIN_LABELS = {
  admissionFee: "Admission Fee",
  cautionDeposit: "Caution Deposit",
  alumniFee: "Alumni Fee",
  idCardFee: "ID Card Fee",
  applicationFee: "Application Fee",
  affiliationFee: "Affiliation Fee",
  uniformFee: "Uniform Fee",
  uniformAndDrawingFee: "Uniform & Drawing Fee",
  industrialTrainingFee: "Industrial Training Fee",
  ratificationFee: "Ratification Fee",
  libraryLaboratoryFee: "Library & Laboratory Fee",
  specialFee: "Special Fee",
};

const BOOK_LABELS = {
  firstYearBookFee: "Year 1 · Book Fee",
  secondYearBookFee: "Year 2 · Book Fee",
  thirdYearBookFee: "Year 3 · Book Fee",
};

const YEAR_WORD = { one: "Year 1", two: "Year 2", three: "Year 3" };
const SEM_WORD = { one: "Sem 1", two: "Sem 2" };
const TYPE_LABEL = {
  TuitionFee: "Tuition Fee",
  BusFee: "Bus Fee",
  HMFee: "Hostel & Mess Fee",
};

function humanizeFeeName(raw) {
  if (!raw) return "";
  if (PLAIN_LABELS[raw]) return PLAIN_LABELS[raw];
  if (BOOK_LABELS[raw]) return BOOK_LABELS[raw];
  for (const [y, yLabel] of Object.entries(YEAR_WORD)) {
    if (!raw.startsWith(y)) continue;
    const rest = raw.slice(y.length);
    for (const [s, sLabel] of Object.entries(SEM_WORD)) {
      const cap = s.charAt(0).toUpperCase() + s.slice(1);
      if (!rest.startsWith(cap)) continue;
      const suffix = rest.slice(cap.length);
      const typeLabel = TYPE_LABEL[suffix] || suffix.replace(/([A-Z])/g, " $1").trim();
      return `${yLabel} · ${sLabel} · ${typeLabel}`;
    }
  }
  return raw.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();
}

/* ============================================================
   PARSE ACADEMIC YEAR KEY
   e.g. "firstAcademicYear 2026-2027" → { ordinal:"first", label:"Year 1 (2026–2027)", yearNum:1 }
   ============================================================ */
const ORDINAL_MAP = {
  first: { label: "Year 1", num: 1 },
  second: { label: "Year 2", num: 2 },
  third: { label: "Year 3", num: 3 },
};

function parseAcademicYearKey(key) {
  const match = key.match(/^(first|second|third)AcademicYear\s*(.*)$/i);
  if (!match) return { label: key, num: 0 };
  const { label, num } = ORDINAL_MAP[match[1].toLowerCase()] || { label: key, num: 0 };
  const range = match[2]?.trim().replace("-", "–");
  return { label: range ? `${label} · ${range}` : label, num };
}

/* ============================================================
   HELPERS
   ============================================================ */
function fmt(v) {
  return `₹${(Number(v) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v.replace(" ", "T"));
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function statusStyle(s) {
  const k = (s || "").toLowerCase();
  if (k === "paid") return { bg: "#dcfce7", fg: "#16a34a", Icon: CheckCircle2 };
  if (k === "partial") return { bg: "#fef9c3", fg: "#ca8a04", Icon: Clock };
  return { bg: "#fee2e2", fg: "#dc2626", Icon: AlertCircle };
}

// Map addYear number → ordinal prefix to match the API key
const YEAR_NUM_TO_ORDINAL = { "1": "first", "2": "second", "3": "third" };

const YEAR_LABELS = {
  firstYear: "First Year",
  secondYear: "Second Year",
  thirdYear: "Third Year",
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function FeeAssignmentPage() {
  const { user } = useAuth();

  /* ---- directory (sidebar) ---- */
  const [directory, setDirectory] = useState(null);
  const [dirLoading, setDirLoading] = useState(true);
  const [dirError, setDirError] = useState(null);

  const [expandedLocations, setExpandedLocations] = useState({ Chittoor: true, Palakkad: true });
  const [expandedYears, setExpandedYears] = useState({});
  const [search, setSearch] = useState("");

  /* ---- selected student + fee structure ---- */
  const [selectedStudent, setSelectedStudent] = useState(null);
  // feeStructure shape: { "firstAcademicYear 2026-2027": [...], ... }
  const [feeStructure, setFeeStructure] = useState(null);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError, setFeeError] = useState(null);

  /* ---- add fee form ---- */
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFeeType, setAddFeeType] = useState("");
  const [customFeeType, setCustomFeeType] = useState("");
  const [addYear, setAddYear] = useState("1");
  const [addSemester, setAddSemester] = useState("1");
  const [addAmount, setAddAmount] = useState("");
  const [addReason, setAddReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [removingKey, setRemovingKey] = useState(null); // "groupKey::typeOfFee"

  /* ======================for wave off===============================*/
  const [showWaiveForm, setShowWaiveForm] = useState(false);
const [waiveFeeType, setWaiveFeeType] = useState("");
const [waiveFeeLabel, setWaiveFeeLabel] = useState("Merit"); // or whatever default
const [waiveAmount, setWaiveAmount] = useState("");
const [waiveSubmitting, setWaiveSubmitting] = useState(false);

  /* ---- fetch directory ---- */
  const loadDirectory = useCallback(async () => {
    setDirLoading(true);
    setDirError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/getFeeAdjDetails`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      setDirectory(await res.json());
    } catch (e) {
      setDirError(e.message);
    } finally {
      setDirLoading(false);
    }
  }, []);

  useEffect(() => { loadDirectory(); }, [loadDirectory]);

  /* ---- fetch fee structure ---- */
const loadFeeStructure = useCallback(async (admissionNo) => {
  setFeeLoading(true);
  setFeeError(null);
  setFeeStructure(null); // clear stale data on every reload
  try {
    const res = await fetch(
      `${API_BASE_URL}/myFeeStructure?admissionNo=${encodeURIComponent(admissionNo)}`,
      { method: "GET", headers: { "Content-Type": "application/json" } }
    );

    // Try to parse JSON regardless — we need the body for error messages
    let body;
    try {
      body = await res.json();
    } catch {
      throw new Error(`Server returned ${res.status} with no JSON body`);
    }

    if (!res.ok) {
      // 404 = no ledger exists yet → treat as empty, not an error
      if (res.status === 404) {
        setFeeStructure({});   // empty object → academicYearGroups will be []
        return;
      }
      // Any other non-2xx → surface the real message from the API
      throw new Error(body?.message || `Request failed (${res.status})`);
    }

    setFeeStructure(body);
  } catch (e) {
    setFeeError(e.message);
  } finally {
    setFeeLoading(false);
  }
}, []);

const handleSelectStudent = (student, location) => {
  setSelectedStudent({ ...student, location });
  setShowAddForm(false);
  setFeeStructure(null);   // ← already there ✓ — just confirming this stays
  setFeeError(null);       // ← ADD THIS: clear any previous error banner
  loadFeeStructure(student.admissionNo);
};

 //  const handleWaiveFeeTypeChange = (e) => {
  const handleWaiveOff = async (e) => {
  e.preventDefault();
  if (!selectedStudent) return;
  if (!waiveFeeType) return toast.error("Select a fee type to waive");
  if (!waiveAmount || Number(waiveAmount) <= 0) return toast.error("Enter a valid amount");

  const payload = {
    location: selectedStudent.location,
    waiveOffBy: user?.employeeId,          // from useAuth
    waiveOffTo: selectedStudent.admissionNo,
    waiveOffFee: waiveFeeLabel || "Merit",
    waiveOffFeeType: waiveFeeType,
    waiveOffAmount: waiveAmount,
  };

  setWaiveSubmitting(true);
  try {
    const res = await fetch(`${API_BASE_URL}/admin/waiveOff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed (${res.status})`);
    toast.success("Fee waived successfully");
    setShowWaiveForm(false);
    // reset fields
    setWaiveFeeType("");
    setWaiveAmount("");
    loadFeeStructure(selectedStudent.admissionNo); // refresh the list
  } catch (err) {
    toast.error(err.message || "Failed to waive fee");
  } finally {
    setWaiveSubmitting(false);
  }
};

  /* ---- derived: academic year groups sorted by year number ---- */
  const academicYearGroups = useMemo(() => {
    if (!feeStructure) return [];
    return Object.entries(feeStructure)
      .map(([key, fees]) => ({ key, fees: fees || [], ...parseAcademicYearKey(key) }))
      .sort((a, b) => a.num - b.num);
  }, [feeStructure]);

  /* ---- derived: totals across all groups ---- */
  const totals = useMemo(() => {
    const allFees = academicYearGroups.flatMap((g) => g.fees);
    return {
      total: allFees.reduce((s, f) => s + (Number(f.amountToBePaid) || 0), 0),
      paid: allFees.reduce((s, f) => s + (Number(f.amountPaid) || 0), 0),
      fine: allFees.reduce((s, f) => s + (Number(f.fineAmount) || 0), 0),
      get balance() { return this.total - this.paid; },
    };
  }, [academicYearGroups]);

  /* ---- fee type options for selected student's location ---- */
  const feeTypeOptions = useMemo(() => {
    if (!directory || !selectedStudent) return [];
    const key = `${selectedStudent.location}FeeTypes`;
    return (directory[key]?.feeTypes || [])
      .map((obj) => Object.values(obj)[0])
      .filter(Boolean);
  }, [directory, selectedStudent]);

  /* ---- sidebar helpers ---- */
  const locationBlocks = useMemo(() => {
    if (!directory) return [];
    const q = search.trim().toLowerCase();
    return ["Chittoor", "Palakkad"].map((loc) => {
      const locData = directory[loc] || {};
      const years = Object.keys(locData)
        .filter((k) => Array.isArray(locData[k]))
        .map((yearKey) => {
          let students = locData[yearKey] || [];
          if (q) students = students.filter(
            (s) => s.studentName?.toLowerCase().includes(q) || s.admissionNo?.toLowerCase().includes(q)
          );
          return { yearKey, students };
        })
        .filter((y) => y.students.length > 0);
      return { location: loc, years };
    });
  }, [directory, search]);

  const toggleLocation = (loc) =>
    setExpandedLocations((p) => ({ ...p, [loc]: !p[loc] }));
  const toggleYear = (loc, y) => {
    const k = `${loc}-${y}`;
    setExpandedYears((p) => ({ ...p, [k]: !p[k] }));
  };

  /* ---- add fee ---- */
  const resetForm = () => {
    setAddFeeType(""); setCustomFeeType(""); setAddYear("1");
    setAddSemester("1"); setAddAmount(""); setAddReason("");
  };

  const handleAddFee = async (e) => {
    e.preventDefault();
    const finalFeeType = addFeeType === "__custom__" ? customFeeType.trim() : addFeeType;
    if (!finalFeeType) return toast.error("Select or enter a fee type");
    if (!addAmount || Number(addAmount) <= 0) return toast.error("Enter a valid amount");
    if (!addReason.trim()) return toast.error("Reason is required");

    const payload = {
      admissionNo: selectedStudent.admissionNo,
      studentName: selectedStudent.studentName,
      semester: addSemester,
      year: addYear,
      feeType: finalFeeType,
      feeAmount: addAmount,
      location: selectedStudent.location,
      createdBy: user?.employeeId,
      reason: addReason.trim(),
    };

    // Optimistic: find matching academic year group key
    const ordinal = YEAR_NUM_TO_ORDINAL[addYear];
    const matchingGroupKey = feeStructure
      ? Object.keys(feeStructure).find((k) => k.toLowerCase().startsWith(ordinal + "academicyear"))
      : null;

    const optimisticFee = {
      typeOfFee: finalFeeType,
      amountToBePaid: addAmount,
      amountPaid: "0",
      feeStatus: "Unpaid",
      fineAmount: "0",
      dueDate: null,
      __optimistic: true,
    };

    if (matchingGroupKey) {
      setFeeStructure((prev) => ({
        ...prev,
        [matchingGroupKey]: [...(prev[matchingGroupKey] || []), optimisticFee],
      }));
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/feeAdjustments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      toast.success("Fee added successfully");
      resetForm();
      setShowAddForm(false);
      loadFeeStructure(selectedStudent.admissionNo);
    } catch (err) {
      toast.error(err.message || "Failed to add fee");
      if (matchingGroupKey) {
        setFeeStructure((prev) => ({
          ...prev,
          [matchingGroupKey]: (prev[matchingGroupKey] || []).filter((f) => !f.__optimistic),
        }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ---- remove fee ---- */
  const handleRemoveFee = async (groupKey, fee) => {
    if (!selectedStudent) return;
    if (!window.confirm(`Remove "${humanizeFeeName(fee.typeOfFee)}"?`)) return;

    const rKey = `${groupKey}::${fee.typeOfFee}`;
    const prevFees = feeStructure[groupKey] || [];

    setRemovingKey(rKey);
    // Optimistic removal
    setFeeStructure((prev) => ({
      ...prev,
      [groupKey]: (prev[groupKey] || []).filter((f) => f.typeOfFee !== fee.typeOfFee),
    }));

    const payload = {
      admissionNo: selectedStudent.admissionNo,
      studentName: selectedStudent.studentName,
      semester: addSemester,
      year: addYear,
      feeType: fee.typeOfFee,
      feeAmount: fee.amountToBePaid,
      location: selectedStudent.location,
      createdBy: user?.employeeId,
      reason: "Removed by Head Admin",
    };

    try {
      const res = await fetch(`${API_BASE_URL}/admin/deleteFeeAdjustments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      toast.success("Fee removed");
      loadFeeStructure(selectedStudent.admissionNo);
    } catch (err) {
      toast.error(err.message || "Failed to remove fee");
      setFeeStructure((prev) => ({ ...prev, [groupKey]: prevFees }));
    } finally {
      setRemovingKey(null);
    }
  };

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="min-h-full w-full" style={{ background: THEME.pageBg }}>
      <style>{`
        @keyframes sunSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes barShine { 0% { transform: translateX(-100%); } 100% { transform: translateX(220%); } }
        @keyframes fadeUpSoft { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fee-fade { animation: fadeUpSoft .28s ease both; }
      `}</style>

      {/* ---- Gradient header ---- */}
<div
  className="px-6 py-6 sm:px-8 sm:py-8"
  style={{
    background: `linear-gradient(135deg, #ffedd5 0%, #fdba74 55%, #fb923c 100%)`,
  }}
>
  <div className="flex items-center justify-between flex-wrap gap-4">
    <div>
      <h1
        className="text-orange-950 text-2xl sm:text-3xl font-semibold"
        style={{ fontFamily: "'DM Serif Display', serif" }}
      >
        Fee Assignment
      </h1>

      <p className="text-orange-800 text-sm mt-1">
        Add or remove fee types for individual students, campus &amp; year wise
      </p>
    </div>

    <div
      className="px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2"
      style={{
        background: "rgba(255,255,255,0.45)",
        color: "#7c2d12",
        backdropFilter: "blur(6px)",
      }}
    >
      <Sun
        size={16}
        style={{ animation: "sunSpin 8s linear infinite" }}
      />
      Head Admin
    </div>
  </div>
</div>

      <div className="p-4 sm:p-6 flex flex-col lg:flex-row gap-5">
{/* ================ SIDEBAR ================ */}
<aside
  className="w-full lg:w-80 shrink-0 rounded-2xl overflow-hidden shadow-md"
  style={{
    background:
      "linear-gradient(165deg, #fff7ed 0%, #ffedd5 45%, #fed7aa 100%)",
  }}
>
  {/* search row */}
  <div className="p-4 border-b border-orange-200 flex items-center gap-2">
    <Sun
      size={16}
      className="text-orange-500 shrink-0"
      style={{ animation: "sunSpin 10s linear infinite" }}
    />

    <div className="relative flex-1">
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400"
      />

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name or admission no."
        className="
          w-full pl-9 pr-3 py-2 rounded-lg text-sm
          bg-white/70
          text-orange-900
          placeholder-orange-400
          border border-orange-200
          outline-none
          focus:bg-white
          focus:border-orange-400
          transition
        "
      />
    </div>
  </div>

          {/* list */}
          <div className="max-h-[70vh] overflow-y-auto">
            {dirLoading && <SidebarSkeleton />}

            {!dirLoading && dirError && (
              <div className="p-5 text-center">
                <AlertCircle size={22} className="mx-auto text-white mb-2" />
                <p className="text-white/85 text-sm mb-3">{dirError}</p>
                <button
                  onClick={loadDirectory}
                  className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full text-white"
                  style={{ background: "rgba(0,0,0,0.2)" }}
                >
                  <RefreshCw size={12} /> Retry
                </button>
              </div>
            )}

            {!dirLoading && !dirError && locationBlocks.every((l) => l.years.length === 0) && (
              <div className="p-6 text-center text-white/75 text-sm">
                <Inbox size={22} className="mx-auto mb-2" />
                No students found
              </div>
            )}

            {!dirLoading && !dirError && locationBlocks.map(({ location, years }) =>
              years.length === 0 ? null : (
                <div key={location} className="border-b border-white/15">
                  <button
                    onClick={() => toggleLocation(location)}
                    className="w-full flex items-center justify-between px-4 py-3 text-white hover:bg-white/10 transition"
                  >
                   <span className="flex items-center gap-2 text-sm font-semibold text-orange-600">
  <MapPin size={13} className="text-orange-500" />
  {location}
</span>
                    {expandedLocations[location]
                      ? <ChevronDown size={15} className="text-white/70" />
                      : <ChevronRight size={15} className="text-white/70" />}
                  </button>

                  {expandedLocations[location] && years.map(({ yearKey, students }) => {
                    const yk = `${location}-${yearKey}`;
                    const open = expandedYears[yk] ?? true;
                    return (
                      <div key={yk}>
                        <button
                          onClick={() => toggleYear(location, yearKey)}
                         className="w-full flex items-center justify-between pl-8 pr-4 py-2 text-orange-600 hover:bg-orange-50 transition text-xs font-semibold uppercase tracking-wide"
                        >
                          <span>{YEAR_LABELS[yearKey] || yearKey}</span>
                          <span className="flex items-center gap-1">
                            {students.length}
                            {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                          </span>
                        </button>

                        {open && students.map((s) => {
                          const active = selectedStudent?.admissionNo === s.admissionNo;
                          return (
                            <button
                              key={s.admissionNo}
                              onClick={() => handleSelectStudent(s, location)}
                              className="w-full text-left pl-9 pr-4 py-2.5 flex flex-col gap-0.5 transition"
                              style={{
                                background: active ? "rgba(255,255,255,0.22)" : "transparent",
                                borderLeft: active ? "3px solid white" : "3px solid transparent",
                              }}
                            >
                              <span className="text-sm text-gray-800 font-medium truncate">
                              {s.studentName}
                               </span>
                              <span className="text-[11px] text-gray-500 flex items-center gap-1.5">
                                {s.admissionNo}
                               <span
                               className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                               style={{
                                 background: "#fff7ed",
                                 color: "#ea580c",
                                 border: "1px solid #fed7aa",
                          }}
                              >
                                {s.feeCode}
                              </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </aside>

        {/* ================ MAIN PANEL ================ */}
        <main className="flex-1 min-w-0">
          {!selectedStudent && (
            <div className="h-full min-h-[420px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-slate-400 bg-white gap-3"
              style={{ borderColor: THEME.mid }}>
              <Sun size={36} style={{ color: THEME.mid }} />
              <p className="text-sm font-medium">Select a student to view &amp; manage their fees</p>
            </div>
          )}

          {selectedStudent && (
            <div className="fee-fade space-y-5">
              {/* ---- student header card ---- */}
              <div
                className="rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4"
                style={{ background: THEME.light, border: `1.5px solid ${THEME.mid}` }}
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: THEME.primary }}>
                    Selected Student
                  </p>
                  <h2
                    className="text-xl font-semibold text-slate-800"
                    style={{ fontFamily: "'DM Serif Display', serif" }}
                  >
                    {selectedStudent.studentName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                    <span className="font-mono">{selectedStudent.admissionNo}</span>
                    <span className="flex items-center gap-1">
                      <GraduationCap size={12} /> {selectedStudent.department}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: THEME.mid, color: THEME.deep }}
                    >
                      {selectedStudent.location}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: "rgba(234,88,12,0.12)", color: THEME.primary }}
                    >
                      {selectedStudent.feeCode}
                    </span>
                  </div>
                </div>
                  <button
                  onClick={() => setShowWaiveForm((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-full text-white shadow ..."
                  style={{ background: `linear-gradient(90deg, #0ea5e9, #38bdf8)` }} // different color so it’s distinct
                >
                  {showWaiveForm ? <X size={15} /> : <Wallet size={15} />} {/* or any icon */}
                  {showWaiveForm ? "Cancel" : "Waive Off"}
                </button>

                <button
                  onClick={() => setShowAddForm((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-full text-white shadow transition hover:brightness-95"
                  style={{ background: `linear-gradient(90deg, ${THEME.primary}, #f97316)` }}
                >
                  {showAddForm ? <X size={15} /> : <Plus size={15} />}
                  {showAddForm ? "Cancel" : "Add Fee"}
                </button>

              </div>

              {/* ---- totals strip ---- */}
              {feeStructure && !feeLoading && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <TotalChip label="Total" value={fmt(totals.total)} />
                  <TotalChip label="Paid" value={fmt(totals.paid)} tone="green" />
                  <TotalChip label="Fine" value={fmt(totals.fine)} tone="red" />
                  <TotalChip label="Balance Due" value={fmt(totals.balance)} tone="orange" />
                </div>
              )}

              {showWaiveForm && (
  <WaiveOffForm
    feeTypeOptions={feeTypeOptions}
    waiveFeeType={waiveFeeType}
    setWaiveFeeType={setWaiveFeeType}
    waiveFeeLabel={waiveFeeLabel}
    setWaiveFeeLabel={setWaiveFeeLabel}
    waiveAmount={waiveAmount}
    setWaiveAmount={setWaiveAmount}
    onSubmit={handleWaiveOff}
    onCancel={() => { setShowWaiveForm(false); /* reset */ }}
    submitting={waiveSubmitting}
  />
)}

              {/* ---- add fee form ---- */}
              {showAddForm && (
                <AddFeeForm
                  feeTypeOptions={feeTypeOptions}
                  addFeeType={addFeeType} setAddFeeType={setAddFeeType}
                  customFeeType={customFeeType} setCustomFeeType={setCustomFeeType}
                  addYear={addYear} setAddYear={setAddYear}
                  addSemester={addSemester} setAddSemester={setAddSemester}
                  addAmount={addAmount} setAddAmount={setAddAmount}
                  addReason={addReason} setAddReason={setAddReason}
                  onSubmit={handleAddFee}
                  onCancel={() => { setShowAddForm(false); resetForm(); }}
                  submitting={submitting}
                />
              )}

              {/* ---- fee structure ---- */}
              {feeLoading && !feeStructure && <FeeListSkeleton />}

              {!feeLoading && feeError && (
                <div
                  className="rounded-2xl p-6 flex flex-col items-center gap-3 bg-white shadow-sm"
                  style={{ border: `1px solid ${THEME.mid}` }}
                >
                  <AlertCircle size={22} style={{ color: THEME.primary }} />
                  <p className="text-sm text-slate-600">{feeError}</p>
                  <button
                    onClick={() => loadFeeStructure(selectedStudent.admissionNo)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full text-white"
                    style={{ background: THEME.primary }}
                  >
                    <RefreshCw size={12} /> Retry
                  </button>
                </div>
              )}

           {/* was: "No fees assigned to this student yet" */}
           {feeStructure && academicYearGroups.length === 0 && !feeLoading && (
             <div className="rounded-2xl bg-white shadow-sm p-8 text-center text-slate-400">
               <Inbox size={28} className="mx-auto mb-2" />
               <p className="text-sm">No fee ledger found for this student</p>
               <p className="text-xs mt-1 text-slate-300">Use "Add Fee" to create the first entry</p>
             </div>
           )}

              {feeStructure && academicYearGroups.map((group) => (
                <AcademicYearSection
                  key={group.key}
                  group={group}
                  removingKey={removingKey}
                  onRemove={handleRemoveFee}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* ============================================================
   ACADEMIC YEAR SECTION
   ============================================================ */
function AcademicYearSection({ group, removingKey, onRemove }) {
  const [open, setOpen] = useState(true);
  const groupTotal = group.fees.reduce((s, f) => s + (Number(f.amountToBePaid) || 0), 0);

  return (
    <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: `1px solid ${THEME.mid}` }}>
      {/* section header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-orange-50/50 transition"
        style={{ borderBottom: open ? `1px solid ${THEME.mid}` : "none" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: `linear-gradient(135deg, ${THEME.primary}, #f97316)` }}
          >
            {group.num}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{group.label}</p>
            <p className="text-xs text-slate-400">{group.fees.length} fee{group.fees.length !== 1 ? "s" : ""} · {fmt(groupTotal)}</p>
          </div>
        </div>
        {open
          ? <ChevronDown size={16} className="text-slate-400" />
          : <ChevronRight size={16} className="text-slate-400" />}
      </button>

      {open && (
        group.fees.length === 0 ? (
          <div className="px-5 py-6 text-center text-slate-400 text-sm">
            <Inbox size={20} className="mx-auto mb-1" />
            No fees in this year
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {group.fees.map((fee) => {
              const rKey = `${group.key}::${fee.typeOfFee}`;
              const isRemoving = removingKey === rKey;
              const { bg, fg, Icon } = statusStyle(fee.feeStatus);
              return (
                <li
                  key={fee.typeOfFee}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-orange-50/30 transition"
                  style={{ opacity: fee.__optimistic ? 0.55 : 1 }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {humanizeFeeName(fee.typeOfFee)}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-slate-500">
                      <span>To pay: <span className="font-semibold text-slate-700">{fmt(fee.amountToBePaid)}</span></span>
                      <span>Paid: {fmt(fee.amountPaid)}</span>
                      {Number(fee.fineAmount) > 0 && (
                        <span className="text-red-500">Fine: {fmt(fee.fineAmount)}</span>
                      )}
                      <span>Due: {fmtDate(fee.dueDate)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ background: bg, color: fg }}
                    >
                      <Icon size={11} />
                      {fee.feeStatus || "Unpaid"}
                    </span>
                    <button
                      onClick={() => onRemove(group.key, fee)}
                      disabled={isRemoving}
                      title="Remove fee"
                      className="p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                    >
                      {isRemoving
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Trash2 size={14} />}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      )}
    </div>
  );
}

/* ============================================================
   ADD FEE FORM
   ============================================================ */
function AddFeeForm({
  feeTypeOptions, addFeeType, setAddFeeType, customFeeType, setCustomFeeType,
  addYear, setAddYear, addSemester, setAddSemester,
  addAmount, setAddAmount, addReason, setAddReason,
  onSubmit, onCancel, submitting,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="fee-fade rounded-2xl bg-white shadow-sm p-5"
      style={{ border: `1.5px solid ${THEME.mid}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Wallet size={15} style={{ color: THEME.primary }} />
          Add New Fee
        </h3>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X size={15} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* fee type */}
        <div className={addFeeType === "__custom__" ? "" : "sm:col-span-2"}>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Fee Type</label>
          <select
            value={addFeeType}
            onChange={(e) => setAddFeeType(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 transition"
            required
          >
            <option value="">Select fee type…</option>
            {feeTypeOptions.map((ft) => (
              <option key={ft} value={ft}>{humanizeFeeName(ft)}</option>
            ))}
            <option value="__custom__">Other (type manually)</option>
          </select>
        </div>

        {addFeeType === "__custom__" && (
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Custom Fee Key</label>
            <input
              type="text"
              value={customFeeType}
              onChange={(e) => setCustomFeeType(e.target.value)}
              placeholder="e.g. twoTwoLabFee"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 transition"
              required
            />
          </div>
        )}

        {/* year */}
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Year</label>
          <select
            value={addYear}
            onChange={(e) => setAddYear(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 transition"
          >
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
          </select>
        </div>

        {/* semester */}
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Semester</label>
          <select
            value={addSemester}
            onChange={(e) => setAddSemester(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 transition"
          >
            <option value="1">Sem 1</option>
            <option value="2">Sem 2</option>
          </select>
        </div>

        {/* amount */}
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Fee Amount (₹)</label>
          <input
            type="number" min="0" step="0.01"
            value={addAmount}
            onChange={(e) => setAddAmount(e.target.value)}
            placeholder="12500"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 transition"
            required
          />
        </div>

        {/* reason */}
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Reason</label>
          <input
            type="text"
            value={addReason}
            onChange={(e) => setAddReason(e.target.value)}
            placeholder="e.g. Late registration adjustment"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 transition"
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-5">
        <button
          type="button" onClick={onCancel}
          className="px-4 py-2 rounded-full text-sm font-medium text-slate-500 hover:bg-slate-100 transition"
        >
          Cancel
        </button>
        <button
          type="submit" disabled={submitting}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold text-white shadow transition hover:brightness-95 disabled:opacity-60"
          style={{ background: `linear-gradient(90deg, ${THEME.primary}, #f97316)` }}
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          {submitting ? "Adding…" : "Add Fee"}
        </button>
      </div>
    </form>
  );
}


/* ============================================================
   WAIVE OFF FORM
   ============================================================ */
function WaiveOffForm({
  feeTypeOptions,
  waiveFeeType, setWaiveFeeType,
  waiveFeeLabel, setWaiveFeeLabel,
  waiveAmount, setWaiveAmount,
  onSubmit, onCancel, submitting,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="fee-fade rounded-2xl bg-white shadow-sm p-5"
      style={{ border: `1.5px solid ${THEME.mid}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Wallet size={15} style={{ color: THEME.primary }} />
          Waive Off Fee
        </h3>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X size={15} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Fee Type */}
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Fee Type</label>
          <select
            value={waiveFeeType}
            onChange={(e) => setWaiveFeeType(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 transition"
            required
          >
            <option value="">Select fee type…</option>
            {feeTypeOptions.map((ft) => (
              <option key={ft} value={ft}>{humanizeFeeName(ft)}</option>
            ))}
          </select>
        </div>

        {/* Waive Fee Label (e.g. Merit) */}
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Waive Off Reason / Label</label>
          <input
            type="text"
            value={waiveFeeLabel}
            onChange={(e) => setWaiveFeeLabel(e.target.value)}
            placeholder="e.g. Merit"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 transition"
            required
          />
        </div>

        {/* Amount */}
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Waive Amount (₹)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={waiveAmount}
            onChange={(e) => setWaiveAmount(e.target.value)}
            placeholder="750"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 transition"
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-5">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-full text-sm font-medium text-slate-500 hover:bg-slate-100 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold text-white shadow transition hover:brightness-95 disabled:opacity-60"
          style={{ background: `linear-gradient(90deg, ${THEME.primary}, #f97316)` }}
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          {submitting ? "Waiving…" : "Waive Off"}
        </button>
      </div>
    </form>
  );
}

/* ============================================================
   TOTAL CHIP
   ============================================================ */
function TotalChip({ label, value, tone }) {
  const tones = {
    green: { bg: "#dcfce7", fg: "#16a34a" },
    red: { bg: "#fee2e2", fg: "#dc2626" },
    orange: { bg: THEME.mid, fg: THEME.deep },
  };
  const { bg, fg } = tones[tone] || { bg: "white", fg: "#334155" };
  return (
    <div className="rounded-xl px-4 py-3 shadow-sm" style={{ background: bg, border: `1px solid ${tone ? "transparent" : "#e2e8f0"}` }}>
      <p className="text-[11px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: fg, opacity: 0.7 }}>
        {label}
      </p>
      <p className="text-base font-bold" style={{ color: fg }}>{value}</p>
    </div>
  );
}

/* ============================================================
   SKELETONS
   ============================================================ */
function SidebarSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="h-4 rounded-md bg-white/15 relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 w-1/3"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
              animation: "barShine 1.4s infinite",
            }}
          />
        </div>
      ))}
    </div>
  );
}

function FeeListSkeleton() {
  return (
    <div className="rounded-2xl bg-white shadow-sm p-5 space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center justify-between animate-pulse">
          <div className="space-y-2">
            <div className="h-3.5 w-44 bg-slate-200 rounded" />
            <div className="h-2.5 w-60 bg-slate-100 rounded" />
          </div>
          <div className="h-6 w-16 bg-slate-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}
