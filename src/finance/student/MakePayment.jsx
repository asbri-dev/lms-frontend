import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/useAuth";
import { API_BASE_URL } from "../../config/api";
import {
  Snowflake,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CalendarDays,
  IndianRupee,
  X,
  Loader2,
  BadgeAlert,
  PartyPopper,
  ShieldCheck,
  Receipt,
  CreditCard,
  Wallet,
  ChevronRight,
} from "lucide-react";

// ─── constants ───────────────────────────────────────────────────────────────

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

const getFeeLabel = (name) => {
  if (!name) return name;
  // handle prefixed names like "secondYearTuitionFee"
  const suffixMatch = name.match(/^(?:first|second|third|fourth)Year(.+)$/i);//
  if (suffixMatch) {
    const base = suffixMatch[1].charAt(0).toLowerCase() + suffixMatch[1].slice(1);
    const prefix = name.match(/^(\w+?)Year/i)[1];
    const yearMap = { first: "1st", second: "2nd", third: "3rd", fourth: "4th" };
    const yr = yearMap[prefix.toLowerCase()] ?? prefix;
    return `${FEE_LABELS[base] ?? base} (${yr} Year)`;
  }
  return FEE_LABELS[name] ?? name;
};

const fmt = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(val) || 0);

const now = () =>
  new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ─── modals ──────────────────────────────────────────────────────────────────

function Backdrop({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>/
    </div>
  );
}

// Confirmation Modal
function ConfirmModal({ fee, studentInfo, onConfirm, onClose, paying }) {
  const total = Number(fee.amountToBePaid) + Number(fee.fineAmount);
  return (
    <Backdrop onClose={!paying ? onClose : undefined}>
      <div
        className="rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ background: "#fff" }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg,#3D7DFC,#2563EB)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <CreditCard size={20} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-white font-bold text-base">Confirm Payment</p>
              <p className="text-white/70 text-xs">Review before proceeding</p>
            </div>
          </div>
          {!paying && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X size={16} className="text-white" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Student info strip */}
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "#E9F3FF" }}
          >
            <Snowflake size={18} style={{ color: "#3D7DFC" }} strokeWidth={2} />
            <div>
              <p className="text-sm font-bold" style={{ color: "#0F172A" }}>
                {studentInfo.studentName}
              </p>
              <p className="text-xs" style={{ color: "#64748B" }}>
                {studentInfo.admissionNumber} &nbsp;•&nbsp; {studentInfo.currentAcademicYear}
              </p>
            </div>
          </div>

          {/* Fee details */}
          <div
            className="rounded-2xl border divide-y"
            style={{ borderColor: "#E2E8F0", divideColor: "#E2E8F0" }}
          >
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-sm" style={{ color: "#64748B" }}>Fee Type</span>
              <span className="text-sm font-semibold" style={{ color: "#0F172A" }}>
                {getFeeLabel(fee.feeName)}
              </span>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-sm" style={{ color: "#64748B" }}>Amount</span>
              <span className="text-sm font-semibold" style={{ color: "#0F172A" }}>
                {fmt(fee.amountToBePaid)}
              </span>
            </div>
            {Number(fee.fineAmount) > 0 && (
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm flex items-center gap-1.5" style={{ color: "#f59e0b" }}>
                  <AlertTriangle size={13} strokeWidth={2} /> Fine
                </span>
                <span className="text-sm font-semibold" style={{ color: "#f59e0b" }}>
                  + {fmt(fee.fineAmount)}
                </span>
              </div>
            )}
            <div
              className="flex justify-between items-center px-4 py-3 rounded-b-2xl"
              style={{ background: "#EEF4FF" }}
            >
              <span className="text-sm font-bold" style={{ color: "#3D7DFC" }}>Total Payable</span>
              <span className="text-lg font-extrabold" style={{ color: "#3D7DFC" }}>
                {fmt(total)}
              </span>
            </div>
          </div>

          {/* Due date */}
          {fee.dueDate && fee.dueDate !== "To be Announced" && (
            <div className="flex items-center gap-2 text-xs" style={{ color: "#94A3B8" }}>
              <CalendarDays size={13} style={{ color: "#3D7DFC" }} />
              Due by {fee.dueDate}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={paying}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold border transition-all hover:bg-slate-50 disabled:opacity-40"
            style={{ borderColor: "#E2E8F0", color: "#64748B" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={paying}
            className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg,#3D7DFC,#2563EB)",
              boxShadow: "0 4px 16px rgba(61,125,252,0.4)",
            }}
          >
            {paying ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <ShieldCheck size={15} />
                Pay Now
              </>
            )}
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

// Success Modal
function SuccessModal({ txn, fee, onClose }) {
  return (
    <Backdrop onClose={onClose}>
      <div
        className="rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ background: "#fff" }}
      >
        {/* Header */}
        <div className="px-6 pt-8 pb-4 flex flex-col items-center text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-lg"
            style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}
          >
            <CheckCircle2 size={40} className="text-white" strokeWidth={2} />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <PartyPopper size={18} style={{ color: "#f59e0b" }} />
            <h2 className="text-xl font-extrabold" style={{ color: "#0F172A", fontFamily: "'DM Serif Display', serif" }}>
              Payment Successful!
            </h2>
            <PartyPopper size={18} style={{ color: "#f59e0b" }} />
          </div>
          <p className="text-sm" style={{ color: "#64748B" }}>
            Your fee has been paid successfully.
          </p>
        </div>

        {/* Transaction details */}
        <div className="px-6 pb-2">
          <div
            className="rounded-2xl border divide-y"
            style={{ borderColor: "#E2E8F0" }}
          >
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>
                Transaction ID
              </span>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-lg"
                style={{ background: "#E9F3FF", color: "#3D7DFC" }}
              >
                {txn.transactionId}
              </span>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>
                Fee Paid
              </span>
              <span className="text-sm font-semibold" style={{ color: "#0F172A" }}>
                {getFeeLabel(fee.feeName)}
              </span>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>
                Amount
              </span>
              <span className="text-sm font-bold" style={{ color: "#16a34a" }}>
                {fmt(Number(fee.amountToBePaid) + Number(fee.fineAmount))}
              </span>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>
                Date & Time
              </span>
              <span className="text-xs" style={{ color: "#64748B" }}>
                {now()}
              </span>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>
                Status
              </span>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ background: "#f0fdf4", color: "#16a34a" }}
              >
                <CheckCircle2 size={11} strokeWidth={2.5} /> Success
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
            style={{
              background: "linear-gradient(135deg,#3D7DFC,#2563EB)",
              boxShadow: "0 4px 16px rgba(61,125,252,0.35)",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

// Error Modal
function ErrorModal({ message, onClose, onRetry }) {
  return (
    <Backdrop onClose={onClose}>
      <div
        className="rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ background: "#fff" }}
      >
        <div className="px-6 pt-8 pb-4 flex flex-col items-center text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{ background: "#FEF2F2" }}
          >
            <AlertCircle size={40} style={{ color: "#ef4444" }} strokeWidth={1.8} />
          </div>
          <h2 className="text-xl font-extrabold mb-1" style={{ color: "#0F172A", fontFamily: "'DM Serif Display', serif" }}>
            Payment Failed
          </h2>
          <p className="text-sm px-4" style={{ color: "#64748B" }}>
            {message || "Something went wrong while processing your payment. Please try again."}
          </p>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold border transition-all hover:bg-slate-50"
            style={{ borderColor: "#E2E8F0", color: "#64748B" }}
          >
            Close
          </button>
          <button
            onClick={onRetry}
            className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: "#ef4444", boxShadow: "0 4px 16px rgba(239,68,68,0.3)" }}
          >
            Try Again
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

// ─── fee card ────────────────────────────────────────────────────────────────

function FeeCard({ fee, onPay }) {
  const hasFine = Number(fee.fineAmount) > 0;
  const total = Number(fee.amountToBePaid) + Number(fee.fineAmount);
  const isTBA = fee.dueDate === "To be Announced";

  return (
    <div
      className="rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md"
      style={{
        background: "#fff",
        borderColor: "#E2E8F0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Left */}
      <div className="flex items-start gap-4 flex-1">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: "#E9F3FF" }}
        >
          <Receipt size={20} style={{ color: "#3D7DFC" }} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-base" style={{ color: "#0F172A" }}>
              {getFeeLabel(fee.feeName)}
            </p>
            {hasFine && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: "#fffbeb", color: "#f59e0b" }}
              >
                <AlertTriangle size={10} strokeWidth={2.5} />
                Fine: {fmt(fee.fineAmount)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {/* Amount */}
            <div className="flex items-center gap-1">
              <IndianRupee size={13} style={{ color: "#94A3B8" }} />
              <span className="text-sm font-semibold" style={{ color: "#0F172A" }}>
                {fmt(fee.amountToBePaid)}
              </span>
            </div>

            {/* Due date */}
            <div className="flex items-center gap-1.5">
              <CalendarDays size={13} style={{ color: isTBA ? "#94A3B8" : "#3D7DFC" }} />
              {isTBA ? (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "#F1F5F9", color: "#94A3B8" }}
                >
                  TBA
                </span>
              ) : (
                <span className="text-xs font-medium" style={{ color: "#64748B" }}>
                  Due {fee.dueDate}
                </span>
              )}
            </div>

            {/* Status badge */}
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: "#FEF2F2", color: "#ef4444" }}
            >
              <Clock size={10} strokeWidth={2.5} />
              Unpaid
            </span>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4 sm:flex-col sm:items-end">
        <div className="text-right">
          <p className="text-xs font-medium" style={{ color: "#94A3B8" }}>
            Total Payable
          </p>
          <p className="text-lg font-extrabold" style={{ color: "#3D7DFC" }}>
            {fmt(total)}
          </p>
        </div>
        <button
          onClick={() => onPay(fee)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 whitespace-nowrap"
          style={{
            background: "linear-gradient(135deg,#3D7DFC,#2563EB)",
            boxShadow: "0 4px 14px rgba(61,125,252,0.35)",
          }}
        >
          <CreditCard size={15} />
          Pay Now
        </button>
      </div>
    </div>
  );
}

// ─── empty state ─────────────────────────────────────────────────────────────

function AllPaidState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
        style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}
      >
        <CheckCircle2 size={36} className="text-white" strokeWidth={2} />
      </div>
      <div className="text-center">
        <p className="text-xl font-bold" style={{ color: "#0F172A", fontFamily: "'DM Serif Display', serif" }}>
          All Fees Cleared!
        </p>
        <p className="text-sm mt-1" style={{ color: "#64748B" }}>
          You have no pending payments. Great job! 🎉
        </p>
      </div>
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function PaymentPage() {
  
  const { user } = useAuth();
  const admissionNo = user?.admissionNumber;

  const [pageData, setPageData] = useState(null);
  const [unpaidFees, setUnpaidFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null);

  // modal states
  const [selectedFee, setSelectedFee] = useState(null); // opens confirm modal
  const [paying, setPaying] = useState(false);
  const [successTxn, setSuccessTxn] = useState(null); // { transactionId }
  const [paidFee, setPaidFee] = useState(null);
  const [payError, setPayError] = useState(null);

  // ── fetch dashboard ──
  const fetchDashboard = useCallback(async () => {
    if (!admissionNo) return;
    setLoading(true);
    setPageError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/makePayment?admissionNo=${admissionNo}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      setPageData(json);
      setUnpaidFees((json.fees ?? []).filter((f) => f.feeStatus === "Unpaid"));
    } catch (err) {
      setPageError(err.message);
    } finally {
      setLoading(false);
    }
  }, [admissionNo]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ── pay handler ──
  const handlePay = async () => {
    if (!selectedFee || !pageData) return;
    setPaying(true);
    try {
      const payload = {
        studentName: pageData.studentName,
        admissionNumber: pageData.admissionNumber,
        currentAcademicYear: pageData.currentAcademicYear,
        amountPaid: selectedFee.amountPaid,
        dueDate: selectedFee.dueDate,
        fineAmount: selectedFee.fineAmount,
        amountToBePaid: selectedFee.amountToBePaid,
        feeStatus: selectedFee.feeStatus,
        feeName: selectedFee.feeName,
      };

      const res = await fetch(`${API_BASE_URL}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.status !== "success") {
        throw new Error(data.message || "Payment was not successful.");
      }

      // success
      setPaidFee(selectedFee);
      setSuccessTxn(data);
      setSelectedFee(null);
      // remove from list
      setUnpaidFees((prev) => prev.filter((f) => f.feeName !== selectedFee.feeName));
    } catch (err) {
      setSelectedFee(null);
      setPayError(err.message);
    } finally {
      setPaying(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessTxn(null);
    setPaidFee(null);
  };

  const handleErrorClose = () => setPayError(null);

  const handleErrorRetry = () => {
    setPayError(null);
    if (paidFee) setSelectedFee(paidFee);
  };

  // ─── render ──────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen p-6 md:p-8"
      style={{ background: "#F8FAFC", fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap');`}</style>

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm"
            style={{ background: "#E9F3FF" }}
          >
            <Wallet size={22} style={{ color: "#3D7DFC" }} strokeWidth={2} />
          </div>
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "'DM Serif Display', serif", color: "#0F172A" }}
            >
              Make a Payment
            </h1>
            <p className="text-sm" style={{ color: "#64748B" }}>
              All your pending fee dues in one place
            </p>
          </div>
        </div>

        <button
          onClick={fetchDashboard}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:shadow-md active:scale-95 disabled:opacity-50 self-start sm:self-auto"
          style={{ background: "#fff", color: "#3D7DFC", borderColor: "#D8E4FA" }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="rounded-2xl p-4 shadow-sm" style={{ background: "#E9F3FF" }}>
            <Snowflake
              size={40}
              style={{ color: "#3D7DFC" }}
              className="animate-spin"
              strokeWidth={1.5}
            />
          </div>
          <p className="text-sm font-medium" style={{ color: "#64748B" }}>
            Loading payment details…
          </p>
        </div>
      )}

      {/* ── Page Error ── */}
      {!loading && pageError && (
        <div className="flex flex-col items-center justify-center py-32 gap-5">
          <div className="rounded-2xl p-4" style={{ background: "#FEF2F2" }}>
            <AlertCircle size={40} style={{ color: "#ef4444" }} strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-base" style={{ color: "#0F172A" }}>
              Failed to load fees
            </p>
            <p className="text-sm mt-1" style={{ color: "#64748B" }}>
              {pageError}
            </p>
          </div>
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#3D7DFC" }}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* ── Content ── */}
      {!loading && !pageError && pageData && (
        <>
          {/* Student + summary strip */}
          <div
            className="rounded-2xl p-5 mb-6 flex flex-wrap items-center justify-between gap-4 border"
            style={{ background: "#fff", borderColor: "#E2E8F0" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: "#E9F3FF" }}
              >
                <Snowflake size={20} style={{ color: "#3D7DFC" }} strokeWidth={2} />
              </div>
              <div>
                <p className="font-bold" style={{ color: "#0F172A" }}>
                  {pageData.studentName}
                </p>
                <p className="text-xs" style={{ color: "#64748B" }}>
                  {pageData.admissionNumber} &nbsp;•&nbsp; {pageData.currentAcademicYear}
                </p>
              </div>
            </div>

            <div className="flex gap-6 flex-wrap">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "#94A3B8" }}>
                  Balance Due
                </p>
                <p className="text-lg font-extrabold" style={{ color: "#ef4444" }}>
                  {fmt(pageData.totals?.balanceDue)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "#94A3B8" }}>
                  Total Fine
                </p>
                <p
                  className="text-lg font-extrabold"
                  style={{ color: Number(pageData.totals?.totalFine) > 0 ? "#f59e0b" : "#CBD5E1" }}
                >
                  {fmt(pageData.totals?.totalFine)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "#94A3B8" }}>
                  Pending Fees
                </p>
                <p className="text-lg font-extrabold" style={{ color: "#3D7DFC" }}>
                  {unpaidFees.length}
                </p>
              </div>
            </div>
          </div>

          {/* Section label */}
          {unpaidFees.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <ChevronRight size={16} style={{ color: "#3D7DFC" }} />
              <h2 className="text-base font-bold" style={{ color: "#0F172A" }}>
                Pending Payments
              </h2>
              <span
                className="ml-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
                style={{ background: "#E9F3FF", color: "#3D7DFC" }}
              >
                {unpaidFees.length}
              </span>
            </div>
          )}

          {/* Fee cards */}
          {unpaidFees.length === 0 ? (
            <AllPaidState />
          ) : (
            <div className="flex flex-col gap-3">
              {unpaidFees.map((fee, idx) => (
                <FeeCard key={`${fee.feeName}-${idx}`} fee={fee} onPay={setSelectedFee} />
              ))}
            </div>
          )}

          {/* Fine notice */}
          {unpaidFees.some((f) => Number(f.fineAmount) > 0) && (
            <div
              className="mt-5 rounded-2xl p-4 flex items-start gap-3 border"
              style={{ background: "#fffbeb", borderColor: "#fde68a" }}
            >
              <BadgeAlert size={18} style={{ color: "#f59e0b" }} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm" style={{ color: "#92400e" }}>
                Some fees have an additional fine included in the payable amount. Please clear dues at the earliest to avoid further charges.
              </p>
            </div>
          )}
        </>
      )}

      {/* ── Modals ── */}
      {selectedFee && pageData && (
        <ConfirmModal
          fee={selectedFee}
          studentInfo={pageData}
          onConfirm={handlePay}
          onClose={() => !paying && setSelectedFee(null)}
          paying={paying}
        />
      )}

      {successTxn && paidFee && (
        <SuccessModal
          txn={successTxn}
          fee={paidFee}
          onClose={handleSuccessClose}
        />
      )}

      {payError && (
        <ErrorModal
          message={payError}
          onClose={handleErrorClose}
          onRetry={handleErrorRetry}
        />
      )}
    </div>
  );
}
