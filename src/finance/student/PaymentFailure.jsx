import { useNavigate, useLocation } from "react-router-dom";
import {
  XCircle,
  CreditCard,
  CalendarDays,
  User,
  Hash,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  Receipt,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";

// ── fee label map (same as MakePayment.jsx) ──────────────────────────────────
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
  if (!name) return "—";
  const suffixMatch = name.match(/^(?:first|second|third|fourth)Year(.+)$/i);
  if (suffixMatch) {
    const base =
      suffixMatch[1].charAt(0).toLowerCase() + suffixMatch[1].slice(1);
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

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const s = String(dateStr);
  if (s.length < 8) return dateStr;
  const y  = s.slice(0, 4);
  const mo = s.slice(4, 6);
  const d  = s.slice(6, 8);
  const h  = s.length >= 10 ? s.slice(8, 10) : "00";
  const mi = s.length >= 12 ? s.slice(10, 12) : "00";
  return new Date(`${y}-${mo}-${d}T${h}:${mi}`).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ── detail row ────────────────────────────────────────────────────────────────
function DetailRow({ icon: Icon, label, value, mono = false }) {
  return (
    <div
      className="flex items-center justify-between gap-4 px-4 py-3"
      style={{ borderBottom: "1px solid #E2E8F0" }}
    >
      <div className="flex items-center gap-2 flex-shrink-0">
        {Icon && <Icon size={14} style={{ color: "#94A3B8" }} strokeWidth={2} />}
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "#94A3B8" }}
        >
          {label}
        </span>
      </div>
      <span
        className={`text-sm font-semibold text-right ${mono ? "font-mono text-xs" : ""}`}
        style={{ color: "#0F172A" }}
      >
        {value || "—"}
      </span>
    </div>
  );
}

// ── tips ─────────────────────────────────────────────────────────────────────
const TIPS = [
  "Check your bank account balance and try again",
  "Try a different payment method (UPI / Net Banking)",

];

// ── main ─────────────────────────────────────────────────────────────────────
export default function PaymentFailure() {
  const { state } = useLocation();
  const navigate  = useNavigate();
  const txnData   = state?.txnData;

  if (!txnData) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#F8FAFC" }}
      >
        <div className="text-center">
          <p className="text-sm" style={{ color: "#64748B" }}>
            No transaction data found.
          </p>
          <button
            onClick={() => navigate("/student/fees-page")}
            className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#3D7DFC" }}
          >
            Back to Fees
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-10 px-4 flex items-center justify-center"
      style={{ background: "#F8FAFC", fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap');`}</style>

      <div
        className="rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
        style={{ background: "#fff", border: "1px solid #E2E8F0" }}
      >
        {/* Top bar */}
        <div
          className="h-1.5 w-full"
          style={{ background: "linear-gradient(90deg,#ef4444,#f87171)" }}
        />

        {/* ── Failure Header ── */}
        <div
          className="px-8 py-8 flex flex-col items-center text-center"
          style={{ background: "linear-gradient(180deg,#fef2f2,#fff)" }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{ background: "#FEE2E2" }}
          >
            <XCircle size={44} style={{ color: "#ef4444" }} strokeWidth={1.8} />
          </div>

          <h1
            className="text-2xl font-bold mb-1"
            style={{
              color: "#0F172A",
              fontFamily: "'DM Serif Display', serif",
            }}
          >
            Payment Failed
          </h1>
          <p className="text-sm px-4" style={{ color: "#64748B" }}>
            {txnData.transactionStatus || "Your payment could not be processed"}
          </p>

          {/* Amount attempted */}
          {txnData.amount && (
            <div
              className="mt-4 px-6 py-3 rounded-2xl"
              style={{ background: "#FEF2F2", border: "1px solid #fecaca" }}
            >
              <p className="text-xs font-medium mb-0.5" style={{ color: "#ef4444" }}>
                Amount Attempted
              </p>
              <p className="text-2xl font-extrabold" style={{ color: "#ef4444" }}>
                {fmt(txnData.amount)}
              </p>
            </div>
          )}
        </div>

        {/* ── Transaction Details ── */}
        <div className="px-6 pb-2">
          <div className="flex items-center gap-2 mb-3">
            <Receipt size={15} style={{ color: "#94A3B8" }} />
            <p
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: "#94A3B8" }}
            >
              Attempt Details
            </p>
          </div>

          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid #E2E8F0" }}
          >
            {txnData.studentName && (
              <DetailRow icon={User} label="Student Name" value={txnData.studentName} />
            )}
            {txnData.admissionNo && (
              <DetailRow icon={Hash} label="Admission No." value={txnData.admissionNo} mono />
            )}
            {txnData.feesName && (
              <DetailRow icon={Receipt} label="Fee Type" value={getFeeLabel(txnData.feesName)} />
            )}
            {txnData.paymentMode && (
              <DetailRow icon={CreditCard} label="Payment Mode" value={txnData.paymentMode} />
            )}
            {txnData.transactionNo && (
              <DetailRow icon={Hash} label="Reference No." value={txnData.transactionNo} mono />
            )}
            {txnData.transactionId && (
              <DetailRow icon={Hash} label="Transaction ID" value={txnData.transactionId} mono />
            )}
            {txnData.paymentDate && (
              <DetailRow
                icon={CalendarDays}
                label="Attempted On"
                value={formatDate(txnData.paymentDate)}
              />
            )}

            {/* Status row */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ background: "#FEF2F2" }}
            >
              <div className="flex items-center gap-2">
                <XCircle size={14} style={{ color: "#ef4444" }} />
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "#ef4444" }}
                >
                  Status
                </span>
              </div>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: "#FEE2E2", color: "#ef4444" }}
              >
                <XCircle size={11} strokeWidth={2.5} />
                {txnData.transactionStatus || "Failed"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Tips ── */}
        <div className="px-6 pt-4">
          <div
            className="rounded-2xl p-4"
            style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} style={{ color: "#f59e0b" }} />
              <p className="text-xs font-bold" style={{ color: "#92400e" }}>
                What you can do:
              </p>
            </div>
            <ul className="space-y-2">
              {TIPS.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                    style={{ background: "#f59e0b" }}
                  />
                  <p className="text-xs" style={{ color: "#92400e" }}>
                    {tip}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="px-6 py-6 flex flex-col gap-3">
          {/* Retry */}
          <button
            onClick={() => navigate("/finance/student/fees")}
            className="w-full py-3 rounded-2xl text-sm font-bold text-white
                       flex items-center justify-center gap-2
                       transition-all hover:opacity-90 active:scale-95"
            style={{
              background: "linear-gradient(135deg,#3D7DFC,#2563EB)",
              boxShadow: "0 4px 16px rgba(61,125,252,0.35)",
            }}
          >
            <RefreshCw size={15} />
            Retry Payment
          </button>

          {/* Back to dashboard */}
          <button
            onClick={() => navigate("/student/dashboard")}
            className="w-full py-3 rounded-2xl text-sm font-semibold
                       flex items-center justify-center gap-2
                       border transition-all hover:bg-slate-50 active:scale-95"
            style={{ borderColor: "#D8E4FA", color: "#64748B" }}
          >
            <ArrowLeft size={15} />
            Go to Dashboard
          </button>
        </div>

        {/* Footer */}
        <div className="pb-5 text-center">
          <p
            className="text-xs flex items-center justify-center gap-1.5"
            style={{ color: "#94A3B8" }}
          >
            <svg
              className="w-3.5 h-3.5"
              style={{ color: "#22c55e" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Secured by ICICI Bank Payment Gateway
          </p>
        </div>
      </div>
    </div>
  );
}
