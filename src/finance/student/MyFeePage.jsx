import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/useAuth";
import { API_BASE_URL } from "../../config/api";
import {
  Snowflake,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CalendarDays,
  TrendingUp,
  Wallet,
  BadgeAlert,
  BookOpen,
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────

const FEE_LABELS = {
  uniformFee: "Uniform Fee",
  applicationFee: "Application Fee",
  idCardFee: "ID Card Fee",
  cautionDeposit: "Caution Deposit",
  ratificationFee: "Ratification Fee",
  alumniFee: "Alumni Fee",
  industrialAndTrainingFee: "Industrial & Training Fee",
  tuitionFee: "Tuition Fee",
  bookFee: "Book Fee",
  affiliationFee: "Affiliation Fee",
  transportationFee: "Transportation Fee",
  libraryAndLaboratoryFee: "Library & Laboratory Fee",
  hostelAndMessFee: "Hostel & Mess Fee",
};

const fmt = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(val) || 0);

const parseYearLabel = (key) => {
  // "firstAcademicYear 2023-2024" → { order: 1, label: "1st Year • 2023–2024", short: "Year 1" }
  const ordinals = { first: 1, second: 2, third: 3, fourth: 4 };
  const suffixes = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th" };
  const match = key.match(/^(\w+)AcademicYear\s(.+)$/i);
  if (!match) return { order: 99, label: key, short: key };
  const word = match[1].toLowerCase();
  const year = match[2].replace("-", "–");
  const num = ordinals[word] ?? 99;
  return {
    order: num,
    label: `${suffixes[num] ?? num} Year  •  ${year}`,
    short: `Year ${num}`,
    rawKey: key,
  };
};

const calcTotals = (fees) => {
  let totalAmount = 0,
    totalPaid = 0,
    totalFine = 0;
  fees.forEach((f) => {
    totalAmount += Number(f.amountToBePaid) || 0;
    totalPaid += Number(f.amountPaid) || 0;
    totalFine += Number(f.fineAmount) || 0;
  });
  const balance = totalAmount - totalPaid;
  return { totalAmount, totalPaid, totalFine, balance };
};

// ─── sub-components ─────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div
        className="rounded-2xl p-4 shadow-lg"
        style={{ background: "#E9F3FF" }}
      >
        <Snowflake
          size={40}
          style={{ color: "#3D7DFC" }}
          className="animate-spin"
          strokeWidth={1.5}
        />
      </div>
      <p className="text-sm font-medium" style={{ color: "#64748B" }}>
        Loading fee structure…
      </p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-5">
      <div
        className="rounded-2xl p-4"
        style={{ background: "#FEF2F2" }}
      >
        <AlertCircle size={40} style={{ color: "#ef4444" }} strokeWidth={1.5} />
      </div>
      <div className="text-center">
        <p className="font-semibold text-base" style={{ color: "#0F172A" }}>
          Failed to load fee data
        </p>
        <p className="text-sm mt-1" style={{ color: "#64748B" }}>
          {message || "Something went wrong. Please try again."}
        </p>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
        style={{ background: "#3D7DFC" }}
      >
        <RefreshCw size={15} />
        Retry
      </button>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color, bg, sub }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 border"
      style={{ background: "#fff", borderColor: "#E2E8F0" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#94A3B8" }}>
          {label}
        </span>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: bg }}
        >
          {Icon && <Icon size={18} style={{ color }} strokeWidth={2} />}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight" style={{ color: "#0F172A" }}>
          {value}
        </p>
        {sub && (
          <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const isPaid = status?.toLowerCase() === "paid";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{
        background: isPaid ? "#f0fdf4" : "#FEF2F2",
        color: isPaid ? "#16a34a" : "#ef4444",
      }}
    >
      {isPaid ? (
        <CheckCircle2 size={11} strokeWidth={2.5} />
      ) : (
        <Clock size={11} strokeWidth={2.5} />
      )}
      {status}
    </span>
  );
}

function FeeTable({ fees }) {
  if (!fees || fees.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 gap-3">
        <BookOpen size={36} style={{ color: "#D8E4FA" }} strokeWidth={1.5} />
        <p className="text-sm" style={{ color: "#94A3B8" }}>
          No fee records for this year.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "#E2E8F0" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: "#F8FAFC" }}>
            {["Fee Type", "Total Amount", "Amount Paid", "Fine", "Balance", "Due Date", "Status"].map(
              (h) => (
                <th
                  key={h}
                  className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#64748B", whiteSpace: "nowrap" }}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {fees.map((fee, idx) => {
            const balance = Number(fee.amountToBePaid) - Number(fee.amountPaid);
            const hasFine = Number(fee.fineAmount) > 0;
            return (
              <tr
                key={idx}
                className="border-t transition-colors hover:bg-blue-50/40"
                style={{ borderColor: "#F1F5F9" }}
              >
                {/* Fee Type */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {hasFine && (
                      <AlertTriangle
                        size={14}
                        style={{ color: "#f59e0b" }}
                        strokeWidth={2}
                      />
                    )}
                    <span className="font-medium" style={{ color: "#0F172A" }}>
                      {FEE_LABELS[fee.typeOfFee] || fee.typeOfFee}
                    </span>
                  </div>
                </td>

                {/* Total Amount */}
                <td className="px-5 py-4 font-semibold" style={{ color: "#0F172A" }}>
                  {fmt(fee.amountToBePaid)}
                </td>

                {/* Amount Paid */}
                <td className="px-5 py-4" style={{ color: "#16a34a" }}>
                  {fmt(fee.amountPaid)}
                </td>

                {/* Fine */}
                <td className="px-5 py-4">
                  {hasFine ? (
                    <span
                      className="font-semibold"
                      style={{ color: "#f59e0b" }}
                    >
                      {fmt(fee.fineAmount)}
                    </span>
                  ) : (
                    <span style={{ color: "#CBD5E1" }}>—</span>
                  )}
                </td>

                {/* Balance */}
                <td className="px-5 py-4 font-semibold" style={{ color: balance > 0 ? "#ef4444" : "#16a34a" }}>
                  {fmt(balance)}
                </td>

                {/* Due Date */}
                <td className="px-5 py-4">
                  {fee.dueDate === "To be Announced" ? (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ background: "#F1F5F9", color: "#94A3B8" }}
                    >
                      <CalendarDays size={11} />
                      TBA
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-medium"
                      style={{ color: "#64748B" }}
                    >
                      <CalendarDays size={12} style={{ color: "#3D7DFC" }} />
                      {fee.dueDate}
                    </span>
                  )}
                </td>

                {/* Status */}
                <td className="px-5 py-4">
                  <StatusBadge status={fee.feeStatus} />
                </td>
              </tr>
            );
          })}
        </tbody>
        {/* Table footer totals */}
        <tfoot>
          <tr style={{ background: "#EEF4FF", borderTop: "2px solid #D8E4FA" }}>
            <td className="px-5 py-3.5 font-bold text-xs uppercase tracking-wider" style={{ color: "#3D7DFC" }}>
              Year Total
            </td>
            <td className="px-5 py-3.5 font-bold" style={{ color: "#0F172A" }}>
              {fmt(fees.reduce((s, f) => s + Number(f.amountToBePaid), 0))}
            </td>
            <td className="px-5 py-3.5 font-bold" style={{ color: "#16a34a" }}>
              {fmt(fees.reduce((s, f) => s + Number(f.amountPaid), 0))}
            </td>
            <td className="px-5 py-3.5 font-bold" style={{ color: "#f59e0b" }}>
              {fmt(fees.reduce((s, f) => s + Number(f.fineAmount), 0))}
            </td>
            <td className="px-5 py-3.5 font-bold" style={{ color: "#ef4444" }}>
              {fmt(
                fees.reduce(
                  (s, f) => s + (Number(f.amountToBePaid) - Number(f.amountPaid)),
                  0
                )
              )}
            </td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function MyFeePage() {
  const { user } = useAuth();
  const admissionNo = user?.admissionNumber;

  const [data, setData] = useState(null);
  const [years, setYears] = useState([]); // [{ order, label, short, rawKey }]
  const [activeKey, setActiveKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);

  const fetchFees = useCallback(async () => {
    if (!admissionNo) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/myFeeStructure?admissionNo=${admissionNo}`,
        {  method: "GET", headers: { "Content-Type": "application/json" } }
      );
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();

      // Parse + sort year keys
      const parsed = Object.keys(json)
        .map((k) => parseYearLabel(k))
        .sort((a, b) => a.order - b.order);

      setData(json);
      setYears(parsed);
      setActiveKey(parsed[0]?.rawKey ?? null);
      setLastSynced(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [admissionNo]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  const activeFees = activeKey && data ? data[activeKey] ?? [] : [];
  const activeYear = years.find((y) => y.rawKey === activeKey);
  const totals = calcTotals(activeFees);

  // ── overall totals across ALL years ──
  const grandTotals = data
    ? calcTotals(Object.values(data).flat())
    : null;

  return (
    <div
      className="min-h-screen p-6 md:p-8"
      style={{ background: "#F8FAFC", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap');`}</style>

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm"
            style={{ background: "#E9F3FF" }}
          >
            <Snowflake size={22} style={{ color: "#3D7DFC" }} strokeWidth={2} />
          </div>
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "'DM Serif Display', serif", color: "#0F172A" }}
            >
              My Fee Structure
            </h1>
            <p className="text-sm" style={{ color: "#64748B" }}>
              Academic year-wise fee breakdown
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastSynced && (
            <span className="text-xs" style={{ color: "#94A3B8" }}>
              Updated {lastSynced.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchFees}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:shadow-md active:scale-95 disabled:opacity-50"
            style={{
              background: "#fff",
              color: "#3D7DFC",
              borderColor: "#D8E4FA",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── States ── */}
      {loading && <LoadingState />}
      {!loading && error && <ErrorState message={error} onRetry={fetchFees} />}

      {!loading && !error && data && (
        <>
          {/* ── Grand Total Banner ── */}
          {grandTotals && (
            <div
              className="rounded-2xl p-5 mb-8 flex flex-wrap gap-6 items-center border"
              style={{
                background: "linear-gradient(135deg, #3D7DFC 0%, #2563EB 100%)",
                borderColor: "transparent",
              }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-36">
                <Wallet size={20} className="text-white/80" />
                <div>
                  <p className="text-xs text-white/70 font-medium uppercase tracking-wider">
                    Overall Total
                  </p>
                  <p className="text-xl font-bold text-white">
                    {fmt(grandTotals.totalAmount)}
                  </p>
                </div>
              </div>
              <div className="w-px h-10 bg-white/20 hidden sm:block" />
              <div className="flex items-center gap-3 flex-1 min-w-36">
                <CheckCircle2 size={20} className="text-white/80" />
                <div>
                  <p className="text-xs text-white/70 font-medium uppercase tracking-wider">
                    Total Paid
                  </p>
                  <p className="text-xl font-bold text-white">
                    {fmt(grandTotals.totalPaid)}
                  </p>
                </div>
              </div>
              <div className="w-px h-10 bg-white/20 hidden sm:block" />
              <div className="flex items-center gap-3 flex-1 min-w-36">
                <TrendingUp size={20} className="text-white/80" />
                <div>
                  <p className="text-xs text-white/70 font-medium uppercase tracking-wider">
                    Total Balance
                  </p>
                  <p className="text-xl font-bold text-white">
                    {fmt(grandTotals.balance)}
                  </p>
                </div>
              </div>
              {grandTotals.totalFine > 0 && (
                <>
                  <div className="w-px h-10 bg-white/20 hidden sm:block" />
                  <div className="flex items-center gap-3 flex-1 min-w-36">
                    <BadgeAlert size={20} className="text-yellow-300" />
                    <div>
                      <p className="text-xs text-white/70 font-medium uppercase tracking-wider">
                        Total Fine
                      </p>
                      <p className="text-xl font-bold text-yellow-300">
                        {fmt(grandTotals.totalFine)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Year Tabs ── */}
          <div
            className="flex gap-2 mb-6 p-1.5 rounded-2xl w-fit"
            style={{ background: "#E9F3FF" }}
          >
            {years.map((y) => {
              const isActive = y.rawKey === activeKey;
              return (
                <button
                  key={y.rawKey}
                  onClick={() => setActiveKey(y.rawKey)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{
                    background: isActive ? "#3D7DFC" : "transparent",
                    color: isActive ? "#fff" : "#3D7DFC",
                    boxShadow: isActive
                      ? "0 2px 12px rgba(61,125,252,0.35)"
                      : "none",
                  }}
                >
                  {y.short}
                </button>
              );
            })}
          </div>

          {/* ── Active Year Label ── */}
          {activeYear && (
            <div className="flex items-center gap-2 mb-5">
              <ChevronRight size={16} style={{ color: "#3D7DFC" }} />
              <h2 className="text-base font-bold" style={{ color: "#0F172A" }}>
                {activeYear.label}
              </h2>
            </div>
          )}

          {/* ── Per-Year Summary Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SummaryCard
              icon={IndianRupee}
              label="Total Amount"
              value={fmt(totals.totalAmount)}
              color="#3D7DFC"
              bg="#E9F3FF"
            />
            <SummaryCard
              icon={CheckCircle2}
              label="Amount Paid"
              value={fmt(totals.totalPaid)}
              color="#16a34a"
              bg="#f0fdf4"
              sub={
                totals.totalAmount > 0
                  ? `${Math.round((totals.totalPaid / totals.totalAmount) * 100)}% of total`
                  : null
              }
            />
            <SummaryCard
              icon={Wallet}
              label="Balance Due"
              value={fmt(totals.balance)}
              color="#ef4444"
              bg="#FEF2F2"
            />
            <SummaryCard
              icon={BadgeAlert}
              label="Total Fine"
              value={fmt(totals.totalFine)}
              color="#f59e0b"
              bg="#fffbeb"
              sub={totals.totalFine === 0 ? "No fines" : "Pending fine"}
            />
          </div>

          {/* ── Fee Table ── */}
          <div
            className="rounded-2xl border p-1"
            style={{ background: "#fff", borderColor: "#E2E8F0" }}
          >
            <FeeTable fees={activeFees} />
          </div>
        </>
      )}
    </div>
  );
}
