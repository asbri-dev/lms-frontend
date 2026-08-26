import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/useAuth";
import { API_BASE_URL } from "../../config/api";
import toast, { Toaster } from "react-hot-toast";
import {
  Sun, RefreshCw, AlertCircle, CheckCircle2, XCircle,
  Clock, Eye, ChevronRight, X, AlertTriangle, Loader2,
  BadgeCheck, Hash, Calendar, User, ArrowRightLeft,
  FileText, WifiOff, ShieldCheck,
} from "lucide-react";
import { createElement } from "react";

// ─── constants ────────────────────────────────────────────────────────────────

const THEME = {
  primary:   "#ea580c",
  dark:      "#c2410c",
  light:     "#fff7ed",
  mid:       "#fed7aa",
  glow:      "rgba(234,88,12,0.18)",
};

const TABS = [
  { key: "Pending",   label: "Pending",   icon: Clock,        color: "#f59e0b", bg: "#fffbeb" },
  { key: "Approved",  label: "Approved",  icon: CheckCircle2, color: "#16a34a", bg: "#f0fdf4" },
  { key: "Rejected",  label: "Rejected",  icon: XCircle,      color: "#ef4444", bg: "#FEF2F2" },
  { key: "Withdrawn", label: "Withdrawn", icon: ArrowRightLeft,color: "#2563EB", bg: "#E9F3FF" },
  { key: "Revoked",   label: "Revoked",   icon: AlertTriangle, color: "#7c3aed", bg: "#f5f3ff" },
];

const TRANSFER_LABELS = { HS: "Hosteller", DS: "Day Scholar" };

const FEE_TYPE_LABELS = {
  twoOneHMFee:  "Yr 2 Sem 1 — Hostel & Mess",
  oneOneHMFee:  "Yr 1 Sem 1 — Hostel & Mess",
  twoOneBusFee: "Yr 2 Sem 1 — Bus Fee",
  oneOneBusFee: "Yr 1 Sem 1 — Bus Fee",
};

function fmtFeeType(val) {
  return FEE_TYPE_LABELS[val] ?? val;
}

function fmtDate(val) {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return val; }
}

function nowISO() {
  return new Date().toISOString().slice(0, 19);
}

async function safeFetch(url, options = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 300000); // 
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") throw new Error("Request timed out.");
    if (!window.navigator.onLine) throw new Error("No internet connection.");
    throw new Error("Cannot reach server. Please check if backend is running.");
  }
}

// ─── backdrop ─────────────────────────────────────────────────────────────────

function Backdrop({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

// ─── approve modal ────────────────────────────────────────────────────────────

function ApproveModal({ record, onConfirm, onClose, loading }) {
  return (
    <Backdrop onClose={!loading ? onClose : undefined}>
      <div
        className="rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ background: "#fff" }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <ShieldCheck size={20} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-white font-bold">Approve Request</p>
              <p className="text-white/70 text-xs">Review before confirming</p>
            </div>
          </div>
          {!loading && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30"
            >
              <X size={15} className="text-white" />
            </button>
          )}
        </div>

        {/* Summary */}
        <div className="p-6 space-y-3">
          <div className="rounded-2xl border divide-y" style={{ borderColor: "#E2E8F0" }}>
            {[
              { label: "Admission No",  value: record.studAdmissionNo },
              { label: "Semester",      value: `Semester ${record.applicableSemester}` },
              { label: "Transfer As",   value: TRANSFER_LABELS[record.transferAs] ?? record.transferAs },
              { label: "Fee Type",      value: fmtFeeType(record.feeType) },
              { label: "Initiated By",  value: record.initiateBy },
              { label: "Initiated At",  value: fmtDate(record.initiateAt) },
              ...(record.busStop ? [{ label: "Bus Stop", value: record.busStop }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center px-4 py-2.5">
                <span className="text-sm" style={{ color: "#64748B" }}>{label}</span>
                <span className="text-sm font-semibold" style={{ color: "#0F172A" }}>{value}</span>
              </div>
            ))}
          </div>

          <div
            className="rounded-xl p-3 flex items-center gap-2"
            style={{ background: "#f0fdf4", border: "1px solid #dcfce7" }}
          >
            <CheckCircle2 size={15} style={{ color: "#16a34a" }} strokeWidth={2} />
            <p className="text-xs font-medium" style={{ color: "#15803d" }}>
              This will mark the request as <strong>Approved</strong>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold border transition-all hover:bg-slate-50 disabled:opacity-40"
            style={{ borderColor: "#E2E8F0", color: "#64748B" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-70"
            style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", boxShadow: "0 4px 14px rgba(22,163,74,0.35)" }}
          >
            {loading ? <><Loader2 size={14} className="animate-spin" /> Approving…</> : <><CheckCircle2 size={14} /> Approve</>}
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

// ─── reject modal ─────────────────────────────────────────────────────────────

function RejectModal({ record, onConfirm, onClose, loading }) {
  const [reason, setReason] = useState("");
  const canSubmit = reason.trim().length >= 5;

  return (
    <Backdrop onClose={!loading ? onClose : undefined}>
      <div
        className="rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ background: "#fff" }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <XCircle size={20} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-white font-bold">Reject Request</p>
              <p className="text-white/70 text-xs">Reason is required</p>
            </div>
          </div>
          {!loading && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30"
            >
              <X size={15} className="text-white" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-4">
          {/* Request summary strip */}
          <div
            className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: "#FEF2F2", border: "1px solid #fecaca" }}
          >
            <Hash size={14} style={{ color: "#ef4444" }} />
            <span className="text-sm font-semibold" style={{ color: "#0F172A" }}>
              {record.studAdmissionNo}
            </span>
            <span className="text-xs" style={{ color: "#94A3B8" }}>
              Sem {record.applicableSemester} · {TRANSFER_LABELS[record.transferAs] ?? record.transferAs}
            </span>
          </div>

          {/* Reason textarea */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: "#64748B" }}
            >
              Reason for Rejection <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Enter a clear reason for rejecting this request (min. 5 characters)…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 rounded-2xl text-sm border resize-none focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
              style={{
                borderColor: reason.trim().length > 0 && !canSubmit ? "#fca5a5" : "#E2E8F0",
                color: "#0F172A",
                focusRingColor: "#ef4444",
              }}
            />
            <p className="text-xs mt-1 text-right" style={{ color: reason.trim().length < 5 ? "#fca5a5" : "#94A3B8" }}>
              {reason.trim().length} / min 5 chars
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold border transition-all hover:bg-slate-50 disabled:opacity-40"
            style={{ borderColor: "#E2E8F0", color: "#64748B" }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            disabled={!canSubmit || loading}
            className="flex-1 py-3 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", boxShadow: canSubmit ? "0 4px 14px rgba(239,68,68,0.35)" : "none" }}
          >
            {loading ? <><Loader2 size={14} className="animate-spin" /> Rejecting…</> : <><XCircle size={14} /> Reject</>}
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

// ─── status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    Pending:   { color: "#f59e0b", bg: "#fffbeb", icon: Clock },
    Approved:  { color: "#16a34a", bg: "#f0fdf4", icon: CheckCircle2 },
    Rejected:  { color: "#ef4444", bg: "#FEF2F2", icon: XCircle },
    Withdrawn: { color: "#2563EB", bg: "#E9F3FF", icon: ArrowRightLeft },
    Revoked:   { color: "#7c3aed", bg: "#f5f3ff", icon: AlertTriangle },
  };
  const s = map[status] ?? { color: "#94A3B8", bg: "#F1F5F9", icon: Clock };
  const Icon = s.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      <Icon size={10} strokeWidth={2.5} />
      {status}
    </span>
  );
}

// ─── read-only table ──────────────────────────────────────────────────────────

function ReadOnlyTable({ records, statusKey }) {
  const reasonCol = {
    Rejected:  { label: "Rejection Reason", key: "reasonForRejection" },
    Withdrawn: { label: "Withdrawal Reason", key: "reasonForWithdrawn" },
    Revoked:   { label: "Revoke Reason",     key: "reasonForRevoking" },
    Approved:  null,
  }[statusKey];

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: THEME.light }}>
          <FileText size={28} style={{ color: THEME.mid }} strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium" style={{ color: "#94A3B8" }}>
          No {statusKey.toLowerCase()} requests
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "#E2E8F0" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: THEME.light }}>
            {["#", "Admission No", "Semester", "Transfer As", "Fee Type", "Initiated By", "Initiated At",
              "Approved By", "Approved At", ...(reasonCol ? [reasonCol.label] : []), "Status",
            ].map((h) => (
              <th
                key={h}
                className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                style={{ color: THEME.primary }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((r, idx) => (
            <tr
              key={r.id}
              className="border-t transition-colors"
              style={{ borderColor: "#F1F5F9" }}
            >
              <td className="px-5 py-3.5 text-xs" style={{ color: "#94A3B8" }}>{idx + 1}</td>
              <td className="px-5 py-3.5">
                <span className="font-bold text-xs px-2.5 py-1 rounded-lg" style={{ background: THEME.light, color: THEME.primary }}>
                  {r.studAdmissionNo}
                </span>
              </td>
              <td className="px-5 py-3.5 font-medium" style={{ color: "#0F172A" }}>Sem {r.applicableSemester}</td>
              <td className="px-5 py-3.5">
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: r.transferAs === "HS" ? "#fff7ed" : "#f0fdf4", color: r.transferAs === "HS" ? "#ea580c" : "#16a34a" }}
                >
                  {TRANSFER_LABELS[r.transferAs] ?? r.transferAs}
                </span>
              </td>
              <td className="px-5 py-3.5 text-xs" style={{ color: "#64748B" }}>{fmtFeeType(r.feeType)}</td>
              <td className="px-5 py-3.5 text-xs font-mono" style={{ color: "#64748B" }}>{r.initiateBy}</td>
              <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: "#64748B" }}>{fmtDate(r.initiateAt)}</td>
              <td className="px-5 py-3.5 text-xs font-mono" style={{ color: "#64748B" }}>{r.approvedBy ?? "—"}</td>
              <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: "#64748B" }}>{fmtDate(r.approvedAt)}</td>
              {reasonCol && (
                <td className="px-5 py-3.5 text-xs max-w-48" style={{ color: "#64748B" }}>
                  <span title={r[reasonCol.key]}>{r[reasonCol.key] ?? "—"}</span>
                </td>
              )}
              <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── pending table ────────────────────────────────────────────────────────────

function PendingTable({ records, onApprove, onReject }) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#f0fdf4" }}>
          <CheckCircle2 size={28} style={{ color: "#bbf7d0" }} strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p className="font-semibold" style={{ color: "#0F172A" }}>All caught up!</p>
          <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>No pending requests to review</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "#E2E8F0" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: THEME.light }}>
            {["#", "Admission No", "Semester", "Transfer As", "Fee Type", "Bus Stop", "Initiated By", "Initiated At", "Status", "Actions"].map((h) => (
              <th
                key={h}
                className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                style={{ color: THEME.primary }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((r, idx) => (
            <tr
              key={r.id}
              className="border-t transition-colors hover:bg-orange-50/30"
              style={{ borderColor: "#F1F5F9" }}
            >
              <td className="px-5 py-4 text-xs" style={{ color: "#94A3B8" }}>{idx + 1}</td>
              <td className="px-5 py-4">
                <span className="font-bold text-xs px-2.5 py-1 rounded-lg" style={{ background: THEME.light, color: THEME.primary }}>
                  {r.studAdmissionNo}
                </span>
              </td>
              <td className="px-5 py-4 font-medium" style={{ color: "#0F172A" }}>Sem {r.applicableSemester}</td>
              <td className="px-5 py-4">
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: r.transferAs === "HS" ? "#fff7ed" : "#f0fdf4", color: r.transferAs === "HS" ? "#ea580c" : "#16a34a" }}
                >
                  {TRANSFER_LABELS[r.transferAs] ?? r.transferAs}
                </span>
              </td>
              <td className="px-5 py-4 text-xs" style={{ color: "#64748B" }}>{fmtFeeType(r.feeType)}</td>
              <td className="px-5 py-4 text-xs font-medium" style={{ color: "#64748B" }}>
                {r.busStop ?? <span style={{ color: "#CBD5E1" }}>—</span>}
              </td>
              <td className="px-5 py-4 text-xs font-mono" style={{ color: "#64748B" }}>{r.initiateBy}</td>
              <td className="px-5 py-4 text-xs whitespace-nowrap" style={{ color: "#64748B" }}>{fmtDate(r.initiateAt)}</td>
              <td className="px-5 py-4"><StatusBadge status={r.status} /></td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onApprove(r)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95"
                    style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", boxShadow: "0 2px 8px rgba(22,163,74,0.3)" }}
                  >
                    <CheckCircle2 size={12} strokeWidth={2.5} />
                    Approve
                  </button>
                  <button
                    onClick={() => onReject(r)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95"
                    style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", boxShadow: "0 2px 8px rgba(239,68,68,0.25)" }}
                  >
                    <XCircle size={12} strokeWidth={2.5} />
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-2.5">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-14 rounded-xl animate-pulse"
          style={{ background: "#E2E8F0", opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function HeadAdminApprovalPage() {
  const { user } = useAuth();
  const empId = user?.employeeId;

  const [data, setData] = useState({
    Pending: [], Approved: [], Rejected: [], Withdrawn: [], Revoked: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNetErr, setIsNetErr] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  const [activeTab, setActiveTab] = useState("Pending");

  // modal state
  const [approveRecord, setApproveRecord] = useState(null);
  const [rejectRecord, setRejectRecord] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ── fetch ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsNetErr(false);
    try {
      const res = await safeFetch(`${API_BASE_URL}/getFeeReqC`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}.`);
      const json = await res.json();
      setData({
        Pending:   Array.isArray(json.Pending)   ? json.Pending   : [],
        Approved:  Array.isArray(json.Approved)  ? json.Approved  : [],
        Rejected:  Array.isArray(json.Rejected)  ? json.Rejected  : [],
        Withdrawn: Array.isArray(json.Withdrawn) ? json.Withdrawn : [],
        Revoked:   Array.isArray(json.Revoked)   ? json.Revoked   : [],
      });
      setLastSynced(new Date());
    } catch (err) {
      setIsNetErr(
        !window.navigator.onLine ||
        err.message.includes("Cannot reach") ||
        err.message.includes("timed out")
      );
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── approve action ──
  const handleApproveConfirm = async () => {
    if (!approveRecord) return;
    setActionLoading(true);
    const r = approveRecord;
    const payload = {
      admissionNos:       [r.studAdmissionNo],
      semesterApplicable: r.applicableSemester,
      transferAs:         r.transferAs,
      initiateBy:         r.initiateBy,
      initiateAt:         nowISO(),
      status:             "Approved",
      approvedBy:         empId,
      approvedAt:         nowISO(),
      reasonForRejection: null,
      reasonForWithdrawn: null,
      reasonForRevoking:  null,
      busStop:            r.busStop ?? null,
    };
    try {
      const res = await safeFetch(`${API_BASE_URL}/approveFeeReq`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}.`);
      toast.success(`Request for ${r.studAdmissionNo} approved successfully`, {
        duration: 4000,
        style: { background: "#f0fdf4", color: "#15803d", border: "1px solid #dcfce7", fontWeight: "600" },
        iconTheme: { primary: "#16a34a", secondary: "#fff" },
      });
      setApproveRecord(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to approve request.", {
        duration: 5000,
        style: { background: "#FEF2F2", color: "#ef4444", border: "1px solid #fecaca" },
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ── reject action ──
  const handleRejectConfirm = async (reason) => {
    if (!rejectRecord) return;
    setActionLoading(true);
    const r = rejectRecord;
    const payload = {
      admissionNos:       [r.studAdmissionNo],
      semesterApplicable: r.applicableSemester,
      transferAs:         r.transferAs,
      initiateBy:         r.initiateBy,
      initiateAt:         nowISO(),
      status:             "Rejected",
      approvedBy:         empId,
      approvedAt:         nowISO(),
      reasonForRejection: reason,
      reasonForWithdrawn: null,
      reasonForRevoking:  null,
      busStop:            r.busStop ?? null,
    };
    try {
      const res = await safeFetch(`${API_BASE_URL}/approveFeeReq`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}.`);
      toast.success(`Request for ${r.studAdmissionNo} rejected`, {
        duration: 4000,
        style: { background: "#FEF2F2", color: "#ef4444", border: "1px solid #fecaca", fontWeight: "600" },
        iconTheme: { primary: "#ef4444", secondary: "#fff" },
      });
      setRejectRecord(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to reject request.", {
        duration: 5000,
        style: { background: "#FEF2F2", color: "#ef4444", border: "1px solid #fecaca" },
      });
    } finally {
      setActionLoading(false);
    }
  };

  const activeRecords = data[activeTab] ?? [];
  const pendingCount  = data.Pending.length;

  // ─── render ──────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen p-6 md:p-8"
      style={{ background: "#F8FAFC", fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap');`}</style>
      <Toaster position="top-right" />

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm"
            style={{ background: THEME.light }}
          >
            <Sun size={22} style={{ color: THEME.primary }} strokeWidth={2} />
          </div>
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "'DM Serif Display', serif", color: "#0F172A" }}
            >
              Fee Change Approvals
            </h1>
            <p className="text-sm" style={{ color: "#64748B" }}>
              Review and action pending fee transfer requests
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
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:shadow-md active:scale-95 disabled:opacity-50"
            style={{ background: "#fff", color: THEME.primary, borderColor: THEME.mid }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Summary chips ── */}
      {!loading && !error && (
        <div className="flex flex-wrap gap-3 mb-6">
          {TABS.map(({ key, label, icon: Icon, color, bg }) => (
            <div
              key={key}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-semibold"
              style={{ background: "#fff", borderColor: "#E2E8F0" }}
            >
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: bg }}>
               {createElement(Icon, { size: 13, style: { color }, strokeWidth: 2.5 })}
              </div>
              <span style={{ color: "#0F172A" }}>{label}</span>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: bg, color }}
              >
                {data[key]?.length ?? 0}
              </span>
            </div>
          ))}
        </div>
      )}

     {/* ── Loading ── */}
{loading && (
  <div className="flex flex-col items-center justify-center py-28 gap-4">
    <div
      className="rounded-2xl p-4 shadow-sm"
      style={{ background: THEME.light }}
    >
      <Sun
        size={40}
        style={{ color: THEME.primary }}
        className="animate-spin"
        strokeWidth={1.5}
      />
    </div>

    <p
      className="text-sm font-medium"
      style={{ color: "#64748B" }}
    >
      Loading fee requests…
    </p>
  </div>
)}

      {/* ── Error ── */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-28 gap-5">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: isNetErr ? "#fff7ed" : "#FEF2F2" }}>
            {isNetErr
              ? <WifiOff size={36} style={{ color: "#ea580c" }} strokeWidth={1.5} />
              : <AlertCircle size={36} style={{ color: "#ef4444" }} strokeWidth={1.5} />}
          </div>
          <div className="text-center">
            <p className="font-bold text-lg" style={{ color: "#0F172A", fontFamily: "'DM Serif Display', serif" }}>
              {isNetErr ? "Cannot Reach Server" : "Something Went Wrong"}
            </p>
            <p className="text-sm mt-1 max-w-xs" style={{ color: "#64748B" }}>{error}</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: THEME.primary }}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* ── Tabs + Table ── */}
      {!loading && !error && (
        <>
          {/* Tab bar */}
          <div
            className="flex gap-1.5 p-1.5 rounded-2xl mb-6 w-fit flex-wrap"
            style={{ background: THEME.light }}
          >
            {TABS.map(({ key, label, icon: Icon, color, bg }) => {
              const isActive = activeTab === key;
              const count = data[key]?.length ?? 0;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: isActive ? THEME.primary : "transparent",
                    color: isActive ? "#fff" : "#64748B",
                    boxShadow: isActive ? `0 2px 12px ${THEME.glow}` : "none",
                  }}
                >
                  {createElement(Icon, { size: 14, strokeWidth: 2.5 })}
                  {label}
                  {count > 0 && (
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{
                        background: isActive ? "rgba(255,255,255,0.25)" : bg,
                        color: isActive ? "#fff" : color,
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Pending alert banner */}
          {activeTab === "Pending" && pendingCount > 0 && (
            <div
              className="rounded-2xl p-4 mb-5 flex items-center gap-3 border"
              style={{ background: "#fffbeb", borderColor: "#fde68a" }}
            >
              <AlertTriangle size={18} style={{ color: "#f59e0b" }} strokeWidth={2} />
              <p className="text-sm font-semibold" style={{ color: "#92400e" }}>
                {pendingCount} request{pendingCount > 1 ? "s" : ""} awaiting your review
              </p>
            </div>
          )}

          {/* Table card */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: "#fff", borderColor: "#E2E8F0" }}
          >
            {/* Table header bar */}
            <div
              className="px-5 py-4 border-b flex items-center gap-2"
              style={{
                background: THEME.light,
                borderColor: THEME.mid,
              }}
            >
              <div className="w-1 h-5 rounded-full" style={{ background: THEME.primary }} />
              <h2
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: THEME.primary }}
              >
                {activeTab} Requests
              </h2>
              <span
                className="ml-auto px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ background: THEME.mid, color: THEME.primary }}
              >
                {activeRecords.length} record{activeRecords.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="p-4">
              {activeTab === "Pending" ? (
                <PendingTable
                  records={activeRecords}
                  onApprove={setApproveRecord}
                  onReject={setRejectRecord}
                />
              ) : (
                <ReadOnlyTable records={activeRecords} statusKey={activeTab} />
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Modals ── */}
      {approveRecord && (
        <ApproveModal
          record={approveRecord}
          onConfirm={handleApproveConfirm}
          onClose={() => !actionLoading && setApproveRecord(null)}
          loading={actionLoading}
        />
      )}

      {rejectRecord && (
        <RejectModal
          record={rejectRecord}
          onConfirm={handleRejectConfirm}
          onClose={() => !actionLoading && setRejectRecord(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
