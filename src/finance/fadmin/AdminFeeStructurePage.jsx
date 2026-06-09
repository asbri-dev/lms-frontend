import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../auth/useAuth";
import { API_BASE_URL } from "../../config/api";
import { exportFeeStructureCSV } from "../conf/exportFeeStructureCSV";
import {
  exportFeeStructureIndividualPDF,
  exportFeeStructureFullReportPDF,
} from "../conf/exportFeeStructurePDF";
import {
  Leaf,
  RefreshCw,
  AlertCircle,
  Search,
  X,
  FileText,
  Download,
  ChevronDown,
  Eye,
  Filter,
  BadgeCheck,
  Users,
  IndianRupee,
  Layers,
  FileSpreadsheet,
} from "lucide-react";

// ─── constants ────────────────────────────────────────────────────────────────

const fmt = (val) => {
  if (val === null || val === undefined) return "N/A";
  if (val === "NA") return "N/A";
  const num = Number(val);
  if (isNaN(num)) return val;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
};

const FIELD_SECTIONS = [
  {
    title: "Tuition Fees",
    color: "#16a34a",
    fields: [
      { key: "fixedTuitionFeePerYear", label: "Fixed Tuition / Year" },
      { key: "firstYearTuitionFee", label: "1st Year Tuition Fee" },
      { key: "secondYearTuitionFee", label: "2nd Year Tuition Fee" },
      { key: "thirdYearTuitionFee", label: "3rd Year Tuition Fee" },
    ],
  },
  {
    title: "One-Time Fees",
    color: "#2563EB",
    fields: [
      { key: "applicationFeeChittoor", label: "Application Fee (Chittoor)" },
      { key: "admissionFeePalakkad", label: "Admission Fee (Palakkad)" },
      { key: "ratificationFeeScSt", label: "Ratification Fee (SC/ST)" },
      { key: "ratificationFeeBcOc", label: "Ratification Fee (BC/OC)" },
      { key: "cautionDeposit", label: "Caution Deposit" },
      { key: "uniformFee", label: "Uniform Fee" },
      { key: "idCardFee", label: "ID Card Fee" },
      { key: "alumniFee", label: "Alumni Fee" },
      { key: "industrialTrainingFee", label: "Industrial & Training Fee" },
      { key: "affiliationFee", label: "Affiliation Fee" },
    ],
  },
  {
    title: "Annual Fees",
    color: "#7c3aed",
    fields: [
      { key: "bookFeePerYear", label: "Book Fee / Year" },
      { key: "libraryLaboratoryFeePerYear", label: "Library & Laboratory Fee / Year" },
    ],
  },
  {
    title: "Transport & Hostel",
    color: "#ea580c",
    fields: [
      { key: "transportFeePerYearBangarupalem", label: "Transport / Year (Bangarupalem)" },
      { key: "transportFeePerYearThumindapalyam", label: "Transport / Year (Thumindapalyam)" },
      { key: "hostelAndMessFee", label: "Hostel & Mess Fee" },
    ],
  },
];

// ─── detail modal ─────────────────────────────────────────────────────────────

function DetailModal({ record, onClose }) {
  if (!record) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ background: "#fff" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="px-6 py-5 flex items-start justify-between flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center">
              <FileText size={22} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-white font-extrabold text-lg leading-tight">
                {record.feeCode}
              </p>
              <p className="text-white/80 text-sm mt-0.5">{record.feeStructure}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors mt-0.5"
          >
            <X size={17} className="text-white" />
          </button>
        </div>

        {/* Meta badges */}
        <div
          className="px-6 py-3 flex flex-wrap gap-2 flex-shrink-0 border-b"
          style={{ background: "#f0fdf4", borderColor: "#dcfce7" }}
        >
          {[
            { label: record.admissionType, icon: BadgeCheck },
            { label: record.entryType, icon: Layers },
            { label: record.feeApplicableBatch || "N/A", icon: FileSpreadsheet },
          ].map(({ label, icon: Icon }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: "#dcfce7", color: "#15803d" }}
            >
              <Icon size={11} strokeWidth={2.5} />
              {label}
            </span>
          ))}
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ml-auto"
            style={{ background: "#E9F3FF", color: "#2563EB" }}
          >
            <Users size={11} strokeWidth={2} />
            {record.applicableStudentsCodes}
          </span>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {FIELD_SECTIONS.map((section) => (
            <div key={section.title}>
              {/* Section header */}
              <div
                className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl"
                style={{ background: section.color + "15" }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: section.color }}
                />
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: section.color }}
                >
                  {section.title}
                </span>
              </div>

              <div
                className="rounded-2xl border overflow-hidden divide-y"
                style={{ borderColor: "#E2E8F0" }}
              >
                {section.fields.map((f, i) => {
                  const raw = record[f.key];
                  const isNA = raw === null || raw === undefined || raw === "NA";
                  return (
                    <div
                      key={f.key}
                      className="flex items-center justify-between px-4 py-2.5"
                      style={{
                        background: i % 2 === 0 ? "#fff" : "#f8fafc",
                      }}
                    >
                      <span className="text-sm" style={{ color: "#64748B" }}>
                        {f.label}
                      </span>
                      <span
                        className="text-sm font-bold"
                        style={{ color: isNA ? "#CBD5E1" : "#0F172A" }}
                      >
                        {isNA ? "N/A" : fmt(raw)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex-shrink-0 border-t flex justify-end"
          style={{ borderColor: "#E2E8F0" }}
        >
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:bg-slate-50"
            style={{ borderColor: "#E2E8F0", color: "#64748B" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── filter select ────────────────────────────────────────────────────────────

function FilterSelect({ label, value, options, onChange }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2"
        style={{
          background: value ? "#dcfce7" : "#fff",
          color: value ? "#15803d" : "#64748B",
          borderColor: value ? "#16a34a" : "#E2E8F0",
          focusRingColor: "#16a34a",
          minWidth: "140px",
        }}
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: "#94A3B8" }}
      />
    </div>
  );
}

// ─── export dropdown ──────────────────────────────────────────────────────────

function ExportDropdown({ onCSV, onIndividualPDF, onFullPDF }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:shadow-md"
        style={{ background: "#fff", color: "#16a34a", borderColor: "#dcfce7" }}
      >
        <Download size={15} />
        Export
        <ChevronDown size={13} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 mt-2 w-52 rounded-2xl shadow-xl border z-20 overflow-hidden"
            style={{ background: "#fff", borderColor: "#E2E8F0" }}
          >
            {[
              { icon: FileSpreadsheet, label: "Export CSV", sub: "All fields", action: onCSV },
              { icon: FileText, label: "Individual PDFs", sub: "One per fee code", action: onIndividualPDF },
              { icon: FileText, label: "Full Report PDF", sub: "All records, landscape", action: onFullPDF },
            ].map(({ icon: Icon, label, sub, action }) => (
              <button
                key={label}
                onClick={() => { action(); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors text-left"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "#f0fdf4" }}
                >
                  <Icon size={15} style={{ color: "#16a34a" }} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>
                    {label}
                  </p>
                  <p className="text-xs" style={{ color: "#94A3B8" }}>
                    {sub}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function AdminFeeStructurePage() {
  const { user } = useAuth();
  const empId = user?.employeeId;

  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);

  // search & filters
  const [search, setSearch] = useState("");
  const [filterBatch, setFilterBatch] = useState("");
  const [filterAdmType, setFilterAdmType] = useState("");
  const [filterEntryType, setFilterEntryType] = useState("");
  const [filterDept, setFilterDept] = useState("");

  // detail modal
  const [selectedRecord, setSelectedRecord] = useState(null);

  // ── fetch ──
  const fetchData = useCallback(async () => {
    if (!empId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/feeStructure?empId=${empId}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      setAllData(Array.isArray(json) ? json : []);
      setLastSynced(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [empId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── filter options (dynamic from data) ──
  const filterOptions = useMemo(() => {
    const batches = [...new Set(allData.map((d) => d.feeApplicableBatch).filter(Boolean))].sort();
    const admTypes = [...new Set(allData.map((d) => d.admissionType).filter(Boolean))].sort();
    const entryTypes = [...new Set(allData.map((d) => d.entryType).filter(Boolean))].sort();
    // extract individual dept codes
    const deptCodes = [
      ...new Set(
        allData.flatMap((d) =>
          (d.applicableStudentsCodes || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        )
      ),
    ].sort();
    return { batches, admTypes, entryTypes, deptCodes };
  }, [allData]);

  // ── filtered data ──
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allData.filter((r) => {
      const matchSearch =
        !q ||
        r.feeCode?.toLowerCase().includes(q) ||
        r.feeStructure?.toLowerCase().includes(q) ||
        r.admissionType?.toLowerCase().includes(q) ||
        r.applicableStudentsCodes?.toLowerCase().includes(q);

      const matchBatch = !filterBatch || r.feeApplicableBatch === filterBatch;
      const matchAdm = !filterAdmType || r.admissionType === filterAdmType;
      const matchEntry = !filterEntryType || r.entryType === filterEntryType;
      const matchDept =
        !filterDept ||
        r.applicableStudentsCodes
          ?.split(",")
          .map((s) => s.trim())
          .includes(filterDept);

      return matchSearch && matchBatch && matchAdm && matchEntry && matchDept;
    });
  }, [allData, search, filterBatch, filterAdmType, filterEntryType, filterDept]);

  const activeFilterCount = [filterBatch, filterAdmType, filterEntryType, filterDept].filter(
    Boolean
  ).length;

  const resetFilters = () => {
    setSearch("");
    setFilterBatch("");
    setFilterAdmType("");
    setFilterEntryType("");
    setFilterDept("");
  };

  // ─── render ──────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen p-6 md:p-8"
      style={{ background: "#F8FAFC", fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap');`}</style>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm"
            style={{ background: "#dcfce7" }}
          >
            <Leaf size={22} style={{ color: "#16a34a" }} strokeWidth={2} />
          </div>
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "'DM Serif Display', serif", color: "#0F172A" }}
            >
              Fee Structure
            </h1>
            <p className="text-sm" style={{ color: "#64748B" }}>
              Manage and view all applicable fee structures
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {lastSynced && (
            <span className="text-xs" style={{ color: "#94A3B8" }}>
              Updated {lastSynced.toLocaleTimeString()}
            </span>
          )}
          <ExportDropdown
            onCSV={() => exportFeeStructureCSV(filtered)}
            onIndividualPDF={() => exportFeeStructureIndividualPDF(filtered)}
            onFullPDF={() => exportFeeStructureFullReportPDF(filtered)}
          />
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:shadow-md active:scale-95 disabled:opacity-50"
            style={{ background: "#fff", color: "#16a34a", borderColor: "#dcfce7" }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="rounded-2xl p-4 shadow-sm" style={{ background: "#dcfce7" }}>
            <Leaf
              size={40}
              style={{ color: "#16a34a" }}
              className="animate-pulse"
              strokeWidth={1.5}
            />
          </div>
          <p className="text-sm font-medium" style={{ color: "#64748B" }}>
            Loading fee structures…
          </p>
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-32 gap-5">
          <div className="rounded-2xl p-4" style={{ background: "#FEF2F2" }}>
            <AlertCircle size={40} style={{ color: "#ef4444" }} strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-base" style={{ color: "#0F172A" }}>
              Failed to load fee structures
            </p>
            <p className="text-sm mt-1" style={{ color: "#64748B" }}>
              {error}
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#16a34a" }}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* ── Content ── */}
      {!loading && !error && (
        <>
          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Structures", value: allData.length, icon: Layers, color: "#16a34a", bg: "#dcfce7" },
              { label: "Government", value: allData.filter((d) => d.admissionType === "Government").length, icon: BadgeCheck, color: "#2563EB", bg: "#E9F3FF" },
              { label: "Management", value: allData.filter((d) => d.admissionType === "Management").length, icon: IndianRupee, color: "#ea580c", bg: "#fff7ed" },
              { label: "Showing Now", value: filtered.length, icon: Filter, color: "#7c3aed", bg: "#f5f3ff" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div
                key={label}
                className="rounded-2xl border p-4 flex items-center gap-3"
                style={{ background: "#fff", borderColor: "#E2E8F0" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: bg }}
                >
                  <Icon size={18} style={{ color }} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>
                    {label}
                  </p>
                  <p className="text-xl font-extrabold" style={{ color: "#0F172A" }}>
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Search + Filters */}
          <div
            className="rounded-2xl border p-4 mb-6 flex flex-wrap gap-3 items-center"
            style={{ background: "#fff", borderColor: "#E2E8F0" }}
          >
            {/* Search */}
            <div className="relative flex-1 min-w-52">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "#94A3B8" }}
              />
              <input
                type="text"
                placeholder="Search fee code, structure, department…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 transition-all"
                style={{
                  borderColor: "#E2E8F0",
                  color: "#0F172A",
                  focusRingColor: "#16a34a",
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X size={13} style={{ color: "#94A3B8" }} />
                </button>
              )}
            </div>

            {/* Filters */}
            <FilterSelect
              label="Batch"
              value={filterBatch}
              options={filterOptions.batches}
              onChange={setFilterBatch}
            />
            <FilterSelect
              label="Admission Type"
              value={filterAdmType}
              options={filterOptions.admTypes}
              onChange={setFilterAdmType}
            />
            <FilterSelect
              label="Entry Type"
              value={filterEntryType}
              options={filterOptions.entryTypes}
              onChange={setFilterEntryType}
            />
            <FilterSelect
              label="Department Code"
              value={filterDept}
              options={filterOptions.deptCodes}
              onChange={setFilterDept}
            />

            {/* Reset */}
            {(activeFilterCount > 0 || search) && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-red-50"
                style={{ color: "#ef4444", border: "1px solid #fecaca" }}
              >
                <X size={13} />
                Reset
                {activeFilterCount > 0 && (
                  <span
                    className="ml-0.5 w-4 h-4 rounded-full text-xs flex items-center justify-center text-white"
                    style={{ background: "#ef4444" }}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="rounded-2xl p-4" style={{ background: "#f0fdf4" }}>
                <Search size={36} style={{ color: "#dcfce7" }} strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <p className="font-semibold" style={{ color: "#0F172A" }}>
                  No results found
                </p>
                <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>
                  Try adjusting your search or filters
                </p>
              </div>
              <button
                onClick={resetFilters}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#16a34a" }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: "#E2E8F0" }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "#f0fdf4" }}>
                      {[
                        "Fee Code",
                        "Fee Structure Name",
                        "Admission Type",
                        "Entry Type",
                        "Batch",
                        
                        "Applicable Codes",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider"
                          style={{ color: "#16a34a", whiteSpace: "nowrap" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((record) => (
                      <tr
                        key={record.feeCode}
                        className="border-t transition-colors hover:bg-green-50/40 cursor-pointer"
                        style={{ borderColor: "#F1F5F9" }}
                        onClick={() => setSelectedRecord(record)}
                      >
                        {/* Fee Code */}
                        <td className="px-5 py-4">
                          <span
                            className="font-bold text-xs px-2.5 py-1 rounded-lg"
                            style={{ background: "#dcfce7", color: "#15803d" }}
                          >
                            {record.feeCode}
                          </span>
                        </td>

                        {/* Fee Structure Name */}
                        <td className="px-5 py-4">
                          <p className="font-semibold max-w-48 truncate" style={{ color: "#0F172A" }} title={record.feeStructure}>
                            {record.feeStructure}
                          </p>
                        </td>

                        {/* Admission Type */}
                        <td className="px-5 py-4">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{
                              background: record.admissionType === "Government" ? "#E9F3FF" : "#fff7ed",
                              color: record.admissionType === "Government" ? "#2563EB" : "#ea580c",
                            }}
                          >
                            <BadgeCheck size={10} strokeWidth={2.5} />
                            {record.admissionType}
                          </span>
                        </td>

                        {/* Entry Type */}
                        <td className="px-5 py-4">
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{
                              background: record.entryType === "Regular" ? "#f0fdf4" : "#fdf4ff",
                              color: record.entryType === "Regular" ? "#16a34a" : "#7c3aed",
                            }}
                          >
                            {record.entryType}
                          </span>
                        </td>

                        {/* Batch */}
                        <td className="px-5 py-4 font-medium" style={{ color: "#64748B" }}>
                          {record.feeApplicableBatch || "N/A"}
                        </td>

                        

                        {/* Applicable Codes */}
                        <td className="px-5 py-4">
                          <p
                            className="text-xs max-w-40 truncate"
                            style={{ color: "#64748B" }}
                            title={record.applicableStudentsCodes}
                          >
                            {record.applicableStudentsCodes}
                          </p>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedRecord(record)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all hover:shadow-sm active:scale-95"
                            style={{
                              background: "#f0fdf4",
                              color: "#16a34a",
                              borderColor: "#dcfce7",
                            }}
                          >
                            <Eye size={13} strokeWidth={2} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table footer */}
              <div
                className="px-5 py-3 border-t flex items-center justify-between"
                style={{ background: "#f8fafc", borderColor: "#E2E8F0" }}
              >
                <p className="text-xs" style={{ color: "#94A3B8" }}>
                  Showing{" "}
                  <span className="font-bold" style={{ color: "#16a34a" }}>
                    {filtered.length}
                  </span>{" "}
                  of {allData.length} fee structures
                </p>
                <p className="text-xs" style={{ color: "#94A3B8" }}>
                  Click any row to view full details
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Detail Modal ── */}
      {selectedRecord && (
        <DetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
}
