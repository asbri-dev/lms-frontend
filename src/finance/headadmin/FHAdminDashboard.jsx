import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  AlertCircle,
  Inbox,
  Download,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  Filter,
  X,
  Sun,
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE_URL } from '../../config/api';


const API_URL = `${API_BASE_URL}/admin/fHDashBoard`;

const THEME = {
  primary: '#ea580c',
  light: '#fff7ed',
  mid: '#fed7aa',
};

const PAGE_SIZE = 25;

// Academic year runs July -> June. Before July -> previous cycle, July onward -> new cycle.
function getCurrentAcademicYear() {
  const now = new Date();
  const month = now.getMonth(); // 0 = Jan, 6 = Jul
  const year = now.getFullYear();
  if (month >= 6) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

function formatFeeType(feeType) {
  if (!feeType) return '';
  return feeType
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function formatCurrency(value) {
  const num = Number(value) || 0;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
}

export default function HeadAdminFeeDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeYear, setActiveYear] = useState(null);
  const [search, setSearch] = useState('');
  const [campusFilter, setCampusFilter] = useState('all');
  const [feeTypeFilter, setFeeTypeFilter] = useState('all');
  const [yearOfStudyFilter, setYearOfStudyFilter] = useState('all');
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, { method: 'GET' });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = await res.json();
      setData(json);

      const years = Object.keys(json);
      const current = getCurrentAcademicYear();
      setActiveYear(years.includes(current) ? current : years.sort().at(-1) || null);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
    setSearch('');
    setCampusFilter('all');
    setFeeTypeFilter('all');
    setYearOfStudyFilter('all');
  }, [activeYear]);

  const years = useMemo(() => (data ? Object.keys(data).sort() : []), [data]);
  const yearData = activeYear && data ? data[activeYear] : null;
const rows = useMemo(() => {
  const students = yearData?.students || [];

  // New API format: students is an object keyed by admissionNo
  if (!Array.isArray(students)) {
    return Object.values(students).flatMap((student) => {
      if (!Array.isArray(student.fees)) {
        return [student];
      }

      return student.fees.map((fee) => ({
        admissionNo: student.admissionNo,
        studentName: student.studentName,
        campus: student.campus,
        currentYear: student.currentYear,

        feeType: fee.feeType,
        totalAmount: fee.totalAmount,
        amountPaid: fee.amountPaid,
        totalFine: fee.totalFine,
        balanceIncludingFine: fee.balanceIncludingFine,
      }));
    });
  }

  // Old/flat API format
  return students;
}, [yearData]);

  const campusOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.campus))).filter(Boolean).sort(),
    [rows]
  );
  const feeTypeOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.feeType))).filter(Boolean).sort(),
    [rows]
  );
  const yearOfStudyOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.currentYear))).filter(Boolean).sort(),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (
        q &&
        !(
          r.studentName?.toLowerCase().includes(q) ||
          r.admissionNo?.toLowerCase().includes(q)
        )
      )
        return false;
      if (campusFilter !== 'all' && r.campus !== campusFilter) return false;
      if (feeTypeFilter !== 'all' && r.feeType !== feeTypeFilter) return false;
      if (yearOfStudyFilter !== 'all' && r.currentYear !== yearOfStudyFilter) return false;
      return true;
    });
  }, [rows, search, campusFilter, feeTypeFilter, yearOfStudyFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeFilterCount =
    [campusFilter, feeTypeFilter, yearOfStudyFilter].filter((v) => v !== 'all').length +
    (search.trim() ? 1 : 0);

  const clearFilters = () => {
    setSearch('');
    setCampusFilter('all');
    setFeeTypeFilter('all');
    setYearOfStudyFilter('all');
    setPage(1);
  };

  const handleExportPDF = () => {
    if (!filteredRows.length) {
      toast.error('No records to export');
      return;
    }
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.setTextColor(234, 88, 12);
    doc.text(`Fee Report — ${activeYear}`, 14, 16);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Aries Polytechnic · Generated ${new Date().toLocaleDateString('en-IN')}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [['Admission No', 'Name', 'Campus', 'Fee Type', 'Year', 'Total', 'Paid', 'Fine', 'Balance']],
      body: filteredRows.map((r) => [
        r.admissionNo,
        r.studentName,
        r.campus,
        formatFeeType(r.feeType),
        r.currentYear,
        formatCurrency(r.totalAmount),
        formatCurrency(r.amountPaid),
        formatCurrency(r.totalFine),
        formatCurrency(r.balanceIncludingFine),
      ]),
      headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 247, 237] },
      styles: { fontSize: 8, cellPadding: 3 },
    });

    doc.save(`fee-report-${activeYear}.pdf`);
    toast.success('PDF exported');
  };

  // ---------- Loading skeleton ----------
if (loading) {
  return (
    <div
      style={{ fontFamily: "'DM Sans', sans-serif", background: '#F8FAFC' }}
      className="min-h-[70vh] p-4 sm:p-6 flex flex-col items-center justify-center"
    >
      <style>{`
        @keyframes sunSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(42px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(42px) rotate(-360deg); }
        }
        @keyframes pulseRing {
          0%, 100% { transform: scale(0.92); opacity: 0.35; }
          50%      { transform: scale(1.08); opacity: 0.7; }
        }
        @keyframes barShine {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(220%); }
        }
        @keyframes fadeUpSoft {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%           { transform: translateY(-6px); opacity: 1; }
        }
        .load-sun   { animation: sunSpin 10s linear infinite; }
        .load-orbit { animation: orbit 3.2s linear infinite; }
        .load-ring  { animation: pulseRing 2.4s ease-in-out infinite; }
        .load-shine { animation: barShine 1.6s ease-in-out infinite; }
        .load-fade  { animation: fadeUpSoft 0.55s ease both; }
      `}</style>

      <div className="load-fade w-full max-w-md text-center">
        {/* Animated emblem */}
        <div className="relative mx-auto mb-8 h-28 w-28">
          {/* soft rings */}
          <div
            className="load-ring absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, #fed7aa 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute inset-3 rounded-full border-2 border-orange-200/60"
            style={{ boxShadow: '0 0 24px rgba(234,88,12,0.15)' }}
          />

          {/* rotating sun */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="load-sun text-orange-500">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.9" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* orbiting coin / fee dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="load-orbit">
              <div
                className="h-3 w-3 rounded-full bg-amber-400 shadow-md"
                style={{ boxShadow: '0 0 10px rgba(251,191,36,0.8)' }}
              />
            </div>
          </div>
        </div>

        {/* Copy */}
        <h2
          style={{ fontFamily: "'DM Serif Display', serif" }}
          className="text-xl sm:text-2xl text-slate-800 mb-1"
        >
          Loading Fee Dashboard
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Gathering student fees, balances &amp; campus data
        </p>

        {/* Progress bar */}
        <div className="relative mx-auto h-1.5 w-48 overflow-hidden rounded-full bg-orange-100">
          <div
            className="load-shine absolute inset-y-0 w-1/2 rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent, #ea580c, #fb923c, transparent)',
            }}
          />
        </div>

        {/* Bouncing dots */}
        <div className="mt-5 flex items-center justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-orange-400"
              style={{
                animation: `dotBounce 1.2s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>


      </div>
    </div>
  );
}

  // ---------- Error state ----------
  if (error) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="p-4 sm:p-6">
        <div className="max-w-md mx-auto mt-16 text-center rounded-2xl border border-orange-100 bg-white p-8 shadow-sm">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: THEME.light }}
          >
            <AlertCircle size={28} style={{ color: THEME.primary }} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Couldn't load the dashboard</h3>
          <p className="text-sm text-slate-500 mb-5">{error}</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
            style={{ background: THEME.primary }}
          >
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  // ---------- Empty (no years at all) ----------
  if (!years.length) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="p-4 sm:p-6">
        <div className="max-w-md mx-auto mt-16 text-center rounded-2xl border border-slate-200 bg-white p-8">
          <Inbox size={40} className="mx-auto mb-3 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No fee records yet</h3>
          <p className="text-sm text-slate-500">Data will appear here once fee structures are generated.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ fontFamily: "'DM Sans', sans-serif", background: '#F8FAFC' }}
      className="min-h-full p-4 sm:p-6 space-y-6"
    >
      {/* ===== Global animation styles ===== */}
      <style>{`
        @keyframes sun-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-sun {
          animation: sun-rotate 18s linear infinite;
        }
        .animate-fade-up {
          animation: fade-up 0.55s ease-out both;
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out both;
        }
        .stagger-1 { animation-delay: 0.05s; }
        .stagger-2 { animation-delay: 0.1s; }
        .stagger-3 { animation-delay: 0.15s; }
        .stagger-4 { animation-delay: 0.2s; }
        .stagger-5 { animation-delay: 0.25s; }
      `}</style>

      {/* ===== Welcome Card ===== */}
      <div
        className="rounded-2xl border border-orange-100 bg-white p-5 sm:p-6 shadow-sm animate-fade-up relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, #fff7ed 0%, #ffffff 60%)` }}
      >
        <div className="absolute -right-6 -top-6 opacity-20">
          <Sun size={110} className="text-orange-400 animate-sun" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm"
            style={{ background: `linear-gradient(135deg, ${THEME.primary}, #f97316)` }}
          >
            <Sun size={28} className="text-white animate-sun" style={{ animationDuration: '12s' }} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-600 mb-0.5">
              Good day, Head Admin
            </p>
            <h2 style={{ fontFamily: "'DM Serif Display', serif" }} className="text-xl sm:text-2xl text-slate-800">
              Welcome to Fee Dashboard
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Track collections, pending dues & fines across campuses for {activeYear}
            </p>
          </div>
        </div>
      </div>

      {/* ===== Header ===== */}
      <div
        className="rounded-2xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden animate-fade-up stagger-1"
        style={{ background: `linear-gradient(135deg, ${THEME.primary}, #f97316)` }}
      >
        {/* Decorative rotating sun */}
    
        <div className="absolute -right-4 bottom-0 h-24 w-24 rounded-full bg-white/10" />
      <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pr-14 sm:pr-20">
  {/* Soft orange light accents */}
  <div
    className="pointer-events-none absolute -left-8 -top-10 h-36 w-36 rounded-full opacity-40 blur-2xl"
    style={{ background: 'radial-gradient(circle, #fdba74 0%, transparent 70%)' }}
  />
  <div
    className="pointer-events-none absolute right-8 bottom-0 h-24 w-40 rounded-full opacity-30 blur-2xl"
    style={{ background: 'radial-gradient(circle, #fff7ed 0%, transparent 70%)' }}
  />

  <div className="relative">
    <p className="text-xs uppercase tracking-[0.2em] text-orange-100/90 mb-1.5 font-medium">
      Head Admin · Fee Overview
    </p>
    <h1
      style={{ fontFamily: "'DM Serif Display', serif" }}
      className="text-2xl sm:text-3xl text-white drop-shadow-sm"
    >
      Fee Dashboard
    </h1>
    <p className="text-sm text-orange-50/90 mt-1.5 flex items-center gap-2">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-200 shadow-[0_0_8px_rgba(253,186,116,0.8)]" />
      Aries Polytechnic — Palakkad &amp; Chittoor
    </p>
  </div>

  <button
    onClick={fetchData}
    className="relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white self-start
               bg-white/15 backdrop-blur-md border border-white/20
               shadow-[0_0_20px_rgba(255,255,255,0.12)]
               hover:bg-white/25 hover:shadow-[0_0_28px_rgba(253,186,116,0.35)]
               transition-all duration-300"
  >
    <RefreshCw size={15} className="opacity-90" />
    Refresh
  </button>
</div>
        {/* Academic year tabs */}
        <div className="relative mt-6 flex flex-wrap gap-2">
          {years.map((y) => {
            const isActive = y === activeYear;
            return (
              <button
                key={y}
                onClick={() => setActiveYear(y)}
                className="rounded-full px-4 py-1.5 text-sm font-medium transition hover:scale-105 active:scale-95"
                style={
                  isActive
                    ? { background: 'white', color: THEME.primary }
                    : { background: 'rgba(255,255,255,0.15)', color: 'white' }
                }
              >
                {y}
                {y === getCurrentAcademicYear() && (
                  <span className="ml-1.5 opacity-70 text-xs">· current</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== Stat cards ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={<Wallet size={18} />}
          label="Total Revenue"
          value={formatCurrency(yearData?.totalRevenue)}
          className="animate-fade-up stagger-1"
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Collected"
          value={formatCurrency(yearData?.revenueCollected)}
          accent="emerald"
          className="animate-fade-up stagger-2"
        />
        <StatCard
          icon={<TrendingDown size={18} />}
          label="Pending"
          value={formatCurrency(yearData?.pendingRevenue)}
          accent="rose"
          className="animate-fade-up stagger-3"
        />
        <StatCard
          icon={<Users size={18} />}
          label="Total Students"
          value={(yearData?.totalStudents ?? 0).toLocaleString('en-IN')}
          className="animate-fade-up stagger-4"
        />
        <StatCard
          icon={<GraduationCap size={18} />}
          label="Total Fine"
          value={formatCurrency(yearData?.totalFine)}
          className="animate-fade-up stagger-5"
        />
      </div>

      {/* ===== Toolbar ===== */}
      <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm space-y-3 animate-fade-up">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or admission number…"
              className="w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none transition focus:bg-white focus:border-orange-400"
            />
          </div>

          <FilterSelect
            value={campusFilter}
            onChange={(v) => {
              setCampusFilter(v);
              setPage(1);
            }}
            options={campusOptions}
            placeholder="All Campuses"
          />
          <FilterSelect
            value={feeTypeFilter}
            onChange={(v) => {
              setFeeTypeFilter(v);
              setPage(1);
            }}
            options={feeTypeOptions}
            placeholder="All Fee Types"
            format={formatFeeType}
          />
          <FilterSelect
            value={yearOfStudyFilter}
            onChange={(v) => {
              setYearOfStudyFilter(v);
              setPage(1);
            }}
            options={yearOfStudyOptions}
            placeholder="All Years"
          />

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90 hover:scale-[1.02] active:scale-95 whitespace-nowrap"
            style={{ background: THEME.primary }}
          >
            <Download size={15} /> Export PDF
          </button>
        </div>

        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-500 animate-fade-in">
            <Filter size={13} />
            {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} applied
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-orange-600 hover:underline font-medium"
            >
              <X size={12} /> Clear
            </button>
          </div>
        )}
      </div>

      {/* ===== Table ===== */}
      <div className="rounded-2xl border border-orange-100 bg-white shadow-sm overflow-hidden animate-fade-up">
        {filteredRows.length === 0 ? (
          <div className="text-center py-16 px-6">
            <Inbox size={40} className="mx-auto mb-3 text-slate-300" />
            <h3 className="text-base font-semibold text-slate-700 mb-1">No matching records</h3>
            <p className="text-sm text-slate-500 mb-4">Try adjusting your search or filters.</p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm font-medium hover:underline"
                style={{ color: THEME.primary }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: THEME.light }}>
                    <Th>Admission No</Th>
                    <Th>Name</Th>
                    <Th>Campus</Th>
                    <Th>Fee Type</Th>
                    <Th>Year</Th>
                    <Th align="right">Total</Th>
                    <Th align="right">Paid</Th>
                    <Th align="right">Fine</Th>
                    <Th align="right">Balance</Th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((r, i) => {
                    const balance = Number(r.balanceIncludingFine) || 0;
                    const isPaid = balance <= 0;
                    return (
                      <tr
                        key={`${r.admissionNo}-${r.feeType}-${i}`}
                        className="border-t border-slate-100 hover:bg-orange-50/40 transition"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">
                          {r.admissionNo}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                          {r.studentName}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{r.campus}</td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {formatFeeType(r.feeType)}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{r.currentYear}</td>
                        <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">
                          {formatCurrency(r.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">
                          {formatCurrency(r.amountPaid)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">
                          {formatCurrency(r.totalFine)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-1 text-xs"
                            style={
                              isPaid
                                ? { background: '#ecfdf5', color: '#059669' }
                                : { background: '#fff1f2', color: '#e11d48' }
                            }
                          >
                            {isPaid ? 'Paid' : formatCurrency(balance)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
              <p className="text-xs text-slate-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredRows.length)} of{' '}
                {filteredRows.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <span className="text-xs text-slate-500 px-1">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent, className = '' }) {
  const colorMap = {
    emerald: { bg: '#ecfdf5', color: '#059669' },
    rose: { bg: '#fff1f2', color: '#e11d48' },
    default: { bg: THEME.light, color: THEME.primary },
  };
  const c = colorMap[accent] || colorMap.default;
  return (
    <div
      className={`rounded-xl border border-orange-100 bg-white p-4 shadow-sm transition hover:shadow-md hover:-translate-y-0.5 ${className}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: c.bg, color: c.color }}
        >
          {icon}
        </span>
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <p className="text-lg font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function Th({ children, align = 'left' }) {
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-orange-700 whitespace-nowrap ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

function FilterSelect({ value, onChange, options, placeholder, format }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600 outline-none transition focus:bg-white focus:border-orange-400 min-w-[150px]"
    >
      <option value="all">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {format ? format(opt) : opt}
        </option>
      ))}
    </select>
  );
}