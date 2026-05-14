import { useState, useEffect, useMemo } from "react";
import {
  CreditCard, AlertCircle, CheckCircle2, Clock, Loader2,
  ChevronDown, ChevronUp, IndianRupee, Calendar, ShieldAlert,
  Wallet, TrendingUp, BadgePercent, BookOpen, Bus, FlaskConical,
  Library, GraduationCap, Building, Shirt, IdCard, Users, Landmark,
  Wrench, Receipt, X, ShoppingCart, Info
} from "lucide-react";
import { useAuth } from "../../auth/useAuth"; 
import { API_BASE_URL } from "../../config/api";
import toast from "react-hot-toast";

/* ─── helpers ───────────────────────────────────────────── */
const rupee = (val) => {
  const n = parseFloat(val || 0);
  if (isNaN(n)) return "₹0";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
};

const labelify = (key) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/Fee$/, " Fee")
    .trim();

const yearLabel = (key) => {
  if (key.startsWith("first")) return "1st Year";
  if (key.startsWith("second")) return "2nd Year";
  if (key.startsWith("third")) return "3rd Year";
  return "";
};

const feeIcon = (key) => {
  const k = key.toLowerCase();
  if (k.includes("tuition")) return GraduationCap;
  if (k.includes("transport")) return Bus;
  if (k.includes("book")) return BookOpen;
  if (k.includes("library") || k.includes("lab")) return FlaskConical;
  if (k.includes("affiliation")) return Building;
  if (k.includes("uniform")) return Shirt;
  if (k.includes("idcard") || k.includes("id")) return IdCard;
  if (k.includes("alumni")) return Users;
  if (k.includes("caution")) return Landmark;
  if (k.includes("industrial") || k.includes("training")) return Wrench;
  if (k.includes("application")) return Receipt;
  if (k.includes("ratification")) return BadgePercent;
  return IndianRupee;
};

const STATUS_STYLES = {
  Paid:      { pill: "bg-emerald-50 text-emerald-700 ring-emerald-200",   dot: "bg-emerald-400", icon: CheckCircle2 },
  Unpaid:    { pill: "bg-rose-50 text-rose-700 ring-rose-200",            dot: "bg-rose-400",    icon: ShieldAlert },
  Partial:   { pill: "bg-amber-50 text-amber-700 ring-amber-200",         dot: "bg-amber-400",   icon: Clock },
  default:   { pill: "bg-slate-50 text-slate-500 ring-slate-200",         dot: "bg-slate-300",   icon: Info },
};

const getStatus = (s) => STATUS_STYLES[s] || STATUS_STYLES.default;
const isPayable = (status) => status === "Unpaid" || status === "Partial";

/* ─── flatten API response into rows ───────────────────── */
const flattenFees = (feeDetails) => {
  if (!feeDetails) return [];
  const rows = [];

  const pushRow = (groupKey, feeKey, data) => {
    rows.push({
      id: feeKey,
      groupKey,
      feeKey,
      label: labelify(feeKey.replace(/firstYear|secondYear|thirdYear/, "")),
      year: yearLabel(feeKey),
      ...data,
    });
  };

  Object.entries(feeDetails).forEach(([groupKey, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        Object.entries(item).forEach(([feeKey, data]) => pushRow(groupKey, feeKey, data));
      });
    } else {
      pushRow(groupKey, groupKey, value);
    }
  });

  return rows;
};

/* ─── group rows by their label (fee type) ─────────────── */
const groupByType = (rows) => {
  const map = new Map();
  rows.forEach((row) => {
    const key = row.label;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  });
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
};

/* ─── Cart drawer ────────────────────────────────────────── */
const CartDrawer = ({ cart, onRemove, onPay, paying }) => {
  const total = cart.reduce((s, r) => s + parseFloat(r.amountToBePaid || 0), 0);
  if (cart.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <ShoppingCart size={16} />
          <span className="font-bold text-sm">Payment Cart</span>
          <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">{cart.length}</span>
        </div>
        <span className="text-white font-black text-base">{rupee(total)}</span>
      </div>

      <div className="max-h-52 overflow-y-auto divide-y divide-slate-50">
        {cart.map((item) => (
          <div key={item.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition">
            <div className="min-w-0 mr-2">
              <p className="text-xs font-semibold text-slate-700 truncate">{item.label}</p>
              {item.year && <p className="text-[10px] text-slate-400">{item.year}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-800">{rupee(item.amountToBePaid)}</span>
              <button onClick={() => onRemove(item.id)} className="text-slate-300 hover:text-rose-400 transition">
                <X size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-slate-100">
        <button
          onClick={onPay}
          disabled={paying}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition shadow-lg shadow-indigo-200"
        >
          {paying ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
          {paying ? "Processing…" : `Pay ${rupee(total)}`}
        </button>
      </div>
    </div>
  );
};

/* ─── single fee row ─────────────────────────────────────── */
const FeeRow = ({ row, inCart, onToggleCart }) => {
  const style = getStatus(row.feeStatus);
  const StatusIcon = style.icon;
  const RowIcon = feeIcon(row.feeKey);
  const payable = isPayable(row.feeStatus);
  const fine = parseFloat(row.fineAmount || 0);

  return (
    <div
      className={`
        flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5 rounded-xl border transition-all
        ${inCart ? "border-indigo-300 bg-indigo-50/50 shadow-sm" : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"}
      `}
    >
      {/* icon + name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`p-2 rounded-lg shrink-0 ${inCart ? "bg-indigo-100" : "bg-slate-50"}`}>
          <RowIcon size={14} className={inCart ? "text-indigo-600" : "text-slate-400"} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{row.label}</p>
          {row.year && <p className="text-[11px] text-slate-400 font-medium">{row.year}</p>}
        </div>
      </div>

      {/* amounts */}
      <div className="flex items-center gap-4 text-right shrink-0">
        <div>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Due</p>
          <p className="text-sm font-bold text-slate-800">{rupee(row.amountToBePaid)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Paid</p>
          <p className="text-sm font-semibold text-emerald-600">{rupee(row.amountPaid)}</p>
        </div>
        {fine > 0 && (
          <div>
            <p className="text-[10px] text-rose-400 font-medium uppercase tracking-wide">Fine</p>
            <p className="text-sm font-semibold text-rose-500">{rupee(fine)}</p>
          </div>
        )}
      </div>

      {/* due date */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0 min-w-[110px]">
        <Calendar size={11} />
        <span>{row.dueDate}</span>
      </div>

      {/* status + pay */}
      <div className="flex items-center gap-2 shrink-0">
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ring-1 ${style.pill}`}>
          <StatusIcon size={10} />
          {row.feeStatus}
        </span>

        {payable && (
          <button
            onClick={() => onToggleCart(row)}
            className={`
              text-xs font-bold px-3 py-1.5 rounded-lg transition-all
              ${inCart
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700"
                : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
              }
            `}
          >
            {inCart ? "✓ Added" : "Pay"}
          </button>
        )}
      </div>
    </div>
  );
};

/* ─── fee group accordion ────────────────────────────────── */
const FeeGroup = ({ label, items, cart, onToggleCart }) => {
  const [open, setOpen] = useState(true);
  const GroupIcon = feeIcon(items[0]?.feeKey || "");
  const totalDue = items.reduce((s, r) => s + parseFloat(r.amountToBePaid || 0), 0);
  const totalPaid = items.reduce((s, r) => s + parseFloat(r.amountPaid || 0), 0);
  const anyUnpaid = items.some((r) => isPayable(r.feeStatus));

  return (
    <div className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 transition text-left"
      >
        <div className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-100">
          <GroupIcon size={15} className="text-indigo-500" />
        </div>
        <span className="flex-1 font-bold text-slate-800 text-sm">{label}</span>

        <div className="flex items-center gap-4 mr-2">
          <span className="text-xs text-slate-400">
            Due <span className="font-bold text-slate-700">{rupee(totalDue)}</span>
          </span>
          <span className="text-xs text-slate-400">
            Paid <span className="font-bold text-emerald-600">{rupee(totalPaid)}</span>
          </span>
          {anyUnpaid && (
            <span className="text-[10px] font-bold uppercase tracking-wide text-rose-400 bg-rose-50 ring-1 ring-rose-100 px-2 py-0.5 rounded-full">
              Action needed
            </span>
          )}
        </div>

        {open ? <ChevronUp size={15} className="text-slate-400 shrink-0" /> : <ChevronDown size={15} className="text-slate-400 shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-2 space-y-2 bg-white">
          {items.map((row) => (
            <FeeRow
              key={row.id}
              row={row}
              inCart={cart.some((c) => c.id === row.id)}
              onToggleCart={onToggleCart}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── main page ──────────────────────────────────────────── */
const MyFee = () => {
  const { user } = useAuth();
  const admissionNo = user.admissionNumber;

  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/myFee?admissionNo=${encodeURIComponent(admissionNo)}`);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        setFeeData(data.feeDetails || data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [admissionNo]);

  const rows = useMemo(() => flattenFees(feeData), [feeData]);
  const groups = useMemo(() => groupByType(rows), [rows]);

  const totalDue   = rows.reduce((s, r) => s + parseFloat(r.amountToBePaid || 0), 0);
  const totalPaid  = rows.reduce((s, r) => s + parseFloat(r.amountPaid || 0), 0);
  const totalFine  = rows.reduce((s, r) => s + parseFloat(r.fineAmount || 0), 0);
  const paidCount  = rows.filter((r) => r.feeStatus === "Paid").length;
  const unpaidCount = rows.filter((r) => isPayable(r.feeStatus)).length;

  const toggleCart = (row) => {
    setCart((prev) =>
      prev.some((c) => c.id === row.id)
        ? prev.filter((c) => c.id !== row.id)
        : [...prev, row]
    );
  };

  const handlePay = async () => {
    if (cart.length === 0) return;
    setPaying(true);

    // Build payload matching exactly what backend expects
    const buildFeeEntry = (row) => ({
      amountToBePaid: row.amountToBePaid,
      amountPaid: row.amountPaid,
      feeStatus: row.feeStatus,
      fineAmount: row.fineAmount,
      dueDate: row.dueDate,
    });

    // Reconstruct nested structure for selected fees
    const selectedFeeDetails = {};
    cart.forEach((row) => {
      if (row.year) {
        // array-type fee (tuition, transport, etc.)
        if (!selectedFeeDetails[row.groupKey]) selectedFeeDetails[row.groupKey] = [];
        selectedFeeDetails[row.groupKey].push({ [row.feeKey]: buildFeeEntry(row) });
      } else {
        selectedFeeDetails[row.feeKey] = buildFeeEntry(row);
      }
    });

    const payload = { feeDetails: selectedFeeDetails };

    const toastId = toast.loading("Creating payment order…", {
      style: { borderRadius: "12px", fontSize: "14px" },
    });

    try {
      const res = await fetch(`${API_BASE_URL}/api/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Payment failed: ${res.status}`);
      const order = await res.json();

      toast.success("Payment order created!", {
        id: toastId,
        duration: 3500,
        style: { borderRadius: "12px", fontSize: "14px" },
      });

      // TODO: integrate Razorpay / payment gateway with `order`
      console.log("Order response:", order);
      setCart([]);
    } catch (e) {
      toast.error(e.message || "Payment failed. Try again.", {
        id: toastId,
        duration: 4000,
        style: { borderRadius: "12px", fontSize: "14px" },
      });
    } finally {
      setPaying(false);
    }
  };

  /* ── states ── */
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={36} className="animate-spin text-indigo-500" />
          <p className="text-sm font-medium">Loading fee details…</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-8 max-w-sm text-center">
          <AlertCircle size={40} className="text-rose-400 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">Could not load fee details</p>
          <p className="text-sm text-slate-400 mt-1">{error}</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-50/20 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6 pb-32">

        {/* ── page header ── */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl shadow-lg shadow-indigo-200">
              <Wallet size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Fee</h1>
          </div>
          <p className="text-sm text-slate-400 ml-[52px]">
            Admission No: <span className="font-semibold text-slate-600">{admissionNo}</span>
          </p>
        </div>

        {/* ── summary cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Due",    value: rupee(totalDue),   icon: TrendingUp,   color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-100" },
            { label: "Total Paid",   value: rupee(totalPaid),  icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
            { label: "Total Fine",   value: rupee(totalFine),  icon: ShieldAlert,  color: "text-rose-500",    bg: "bg-rose-50",    border: "border-rose-100" },
            { label: "Pending Items",value: `${unpaidCount} / ${rows.length}`, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
          ].map(({ label, value, icon: Icon2, color, bg, border }) => (
            <div key={label} className={`bg-white rounded-2xl border ${border} shadow-sm p-4`}>
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon2 size={16} className={color} />
              </div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest">{label}</p>
              <p className={`text-lg font-black mt-0.5 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── cart hint ── */}
        {unpaidCount > 0 && cart.length === 0 && (
          <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-sm text-indigo-700">
            <Info size={15} className="shrink-0" />
            Click <strong>Pay</strong> on any unpaid or partial fee to add it to your cart, then proceed to checkout.
          </div>
        )}

        {/* ── fee groups ── */}
        <div className="space-y-4">
          {groups.map(({ label, items }) => (
            <FeeGroup
              key={label}
              label={label}
              items={items}
              cart={cart}
              onToggleCart={toggleCart}
            />
          ))}
        </div>

      </div>

      {/* ── sticky cart drawer ── */}
      <CartDrawer
        cart={cart}
        onRemove={(id) => setCart((prev) => prev.filter((c) => c.id !== id))}
        onPay={handlePay}
        paying={paying}
      />
    </div>
  );
};

export default MyFee;
