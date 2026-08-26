import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Loader2,
  ChevronRight,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from "../../config/api";
import { useAuth} from "../../auth/useAuth";

const THEME = {
  primary: '#ea580c',
  light: '#fff7ed',
  mid: '#fed7aa',
};

// ── Academic year helper (July start) ──
function getCurrentAcademicYear() {
  const now = new Date();
  const month = now.getMonth(); // 0=Jan, 6=Jul
  const year = now.getFullYear();
  return month >= 6 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

// ── Fee type → human label with Roman numerals ──
const ROMAN = { one: 'I', two: 'II', three: 'III' };

const SPECIAL_LABELS = {
  cautionDeposit: 'Caution Deposit',
  applicationFee: 'Application Fee',
  affiliationFee: 'Affiliation Fee',
  idCardFee: 'ID Card Fee',
  ratificationFee: 'Ratification Fee',
  uniformFee: 'Uniform Fee',
  firstYearBookFee: 'I Year Book Fee',
  secondYearBookFee: 'II Year Book Fee',
  thirdYearBookFee: 'III Year Book Fee',
  libraryLaboratoryFee: 'Library & Laboratory Fee',
  industrialTrainingFee: 'Industrial Training Fee',
  alumniFee: 'Alumni Fee',
  admissionFee: 'Admission Fee',
  uniformAndDrawingFee: 'Uniform & Drawing Fee',
  specialFee: 'Special Fee',
};

const TYPE_SUFFIX = {
  TuitionFee: 'Tuition Fee',
  BusFee: 'Bus Fee',
  HMFee: 'HM Fee',
};

function formatFeeLabel(key) {
  if (!key) return '';
  if (SPECIAL_LABELS[key]) return SPECIAL_LABELS[key];

  // Pattern: (one|two|three)(One|Two)(TuitionFee|BusFee|HMFee)
  const m = key.match(/^(one|two|three)(One|Two)(TuitionFee|BusFee|HMFee)$/);
  if (m) {
    const yr = ROMAN[m[1]];
    const sem = ROMAN[m[2].toLowerCase()];
    const type = TYPE_SUFFIX[m[3]];
    return `${yr}·${sem} ${type}`;
  }

  // Fallback camelCase split
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
}

// ── Date: YYYY-MM-DD → DD-Mon-YYYY ──
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function toApiDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}-${MONTHS[parseInt(m, 10) - 1]}-${y}`;
}

// ── Parse API response ──
function parseData(json) {
  const c = json.chittoorResponse || {};
  const p = json.palakkadResponse || {};
  return {
    Chittoor: {
      academicYears: [...(c.chittoorAcademiYears || [])].sort(),
      yearGroups: {
        '1': c.chittoorFirstYearOnlyFees || [],
        '2': c.chittoorSecondYearOnlyFeesLateral || [],
        '3': c.chittoorThirdYearOnlyFees || [],
      },
    },
    Palakkad: {
      academicYears: [...(p.palakkadAcademicYears || [])].sort(),
      yearGroups: {
        '1': p.palakkadFirstYearOnlyFees || [],
        '2': p.palakkadSecondYearOnlyFees || [],
        '3': p.palakkadThirdYearOnlyFees || [],
      },
    },
  };
}

const YEAR_DISPLAY = { '1': 'I Year', '2': 'II Year', '3': 'III Year' };
const YEAR_ROMAN  = { '1': 'I',      '2': 'II',      '3': 'III' };

// ═══════════════════════════════════════════════
export default function DueDateSetPage() {
  const [apiData,     setApiData]     = useState(null);
  const [loadError,   setLoadError]   = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  // Form
  const [location,    setLocation]    = useState('');
  const [acadYear,    setAcadYear]    = useState('');
  const [studYear,    setStudYear]    = useState('');
  const [feeType,     setFeeType]     = useState('');
  const [dueDate,     setDueDate]     = useState('');
  const [fineAmt,     setFineAmt]     = useState('');

  // Check
  const [checking,         setChecking]         = useState(false);
  const [checkResult,      setCheckResult]      = useState(null);
  const [overrideOk,       setOverrideOk]       = useState(false);
  const checkAbort = useRef(null);

     const { user } = useAuth();
  const empId = user?.employeeId;

  // Submit
  const [submitting, setSubmitting] = useState(false);

  // ── Load all fee data ──
  const loadData = useCallback(async () => {
    setLoadingData(true);
    setLoadError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/getAllFee`);
      if (!res.ok) throw new Error(`Load failed (${res.status})`);
      const json = await res.json();
      setApiData(parseData(json));
    } catch (err) {
      setLoadError(err.message || 'Could not load fee data');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-set academic year when location changes
  useEffect(() => {
    if (!apiData || !location) return;
    const years = apiData[location]?.academicYears || [];
    const current = getCurrentAcademicYear();
    setAcadYear(years.includes(current) ? current : years.at(-1) || '');
    setStudYear('');
    setFeeType('');
    resetCheck();
  }, [location, apiData]);

  // Reset on selection changes
  useEffect(() => { setFeeType(''); resetCheck(); }, [studYear, acadYear]);
  useEffect(() => { resetCheck(); }, [feeType, dueDate, fineAmt]);

  function resetCheck() {
    setCheckResult(null);
    setOverrideOk(false);
  }

  const allComplete = !!(location && acadYear && studYear && feeType && dueDate && fineAmt);

  // ── Auto-check when all fields are filled ──
  useEffect(() => {
    if (!allComplete) return;

    if (checkAbort.current) checkAbort.current.abort();
    const ctrl = new AbortController();
    checkAbort.current = ctrl;

    setChecking(true);
    resetCheck();

    const payload = {
      setBy: empId  || 'unknown',
      collegeLocation: location,
      currentAcademicYear: acadYear,
      Year: studYear,
      feeType,
      fineDueDate: toApiDate(dueDate),
      fineAmtPerDay: fineAmt,
    };

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/checkDueDate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`Check failed (${res.status})`);
        const json = await res.json();

        if (json.message === 'yes') {
          setCheckResult('ok');
        } else {
          const existing = json.message?.match(/Existed due date is (.+)/)?.[1] || 'a previous date';
          setCheckResult({ existing });
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        setCheckResult('error');
      } finally {
        setChecking(false);
      }
    })();

    return () => ctrl.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allComplete, location, acadYear, studYear, feeType, dueDate, fineAmt]);

  const canSubmit = allComplete && !checking &&
    (checkResult === 'ok' || (typeof checkResult === 'object' && checkResult !== null && overrideOk));

  // ── Submit ──
  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload = {
        setBy: empId  || 'unknown',
        collegeLocation: location,
        currentAcademicYear: acadYear,
        currentYear: studYear,
        feeType,
        fineDueDate: toApiDate(dueDate),
        fineAmtPerDay: fineAmt,
      };
      const res = await fetch(`${API_BASE_URL}/setFeeDueDate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Submit failed (${res.status})`);
      toast.success('Due date applied successfully!');
      setFeeType('');
      setDueDate('');
      setFineAmt('');
      resetCheck();
    } catch (err) {
      toast.error(err.message || 'Failed to apply due date');
    } finally {
      setSubmitting(false);
    }
  };

  const feeList = (apiData && location && studYear)
    ? (apiData[location]?.yearGroups[studYear] || [])
    : [];

  // ─── Loading skeleton ───
  if (loadingData) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="p-4 sm:p-6 space-y-6">
        <div className="h-28 rounded-2xl animate-pulse"
          style={{ background: `linear-gradient(135deg, ${THEME.mid}, ${THEME.light})` }} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[120, 96, 96, 200].map((h, i) => (
              <div key={i} className="rounded-2xl bg-slate-100 animate-pulse" style={{ height: h }} />
            ))}
          </div>
          <div className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  // ─── Load error ───
  if (loadError) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="p-4 sm:p-6">
        <div className="max-w-md mx-auto mt-16 text-center rounded-2xl border border-orange-100 bg-white p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: THEME.light }}>
            <AlertCircle size={28} style={{ color: THEME.primary }} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Couldn't load fee data</h3>
          <p className="text-sm text-slate-500 mb-5">{loadError}</p>
          <button onClick={loadData}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white"
            style={{ background: THEME.primary }}>
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  // ─── Main page ───
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#F8FAFC' }}
      className="min-h-full p-4 sm:p-6 space-y-6">

      {/* Header */}
      <div
        className="rounded-2xl p-6 sm:p-8 text-orange-950 shadow-sm relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, #ffedd5, #fdba74)`,
        }}
      >
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-400/20" />
        <div className="absolute -right-4 bottom-0 h-24 w-24 rounded-full bg-orange-400/20" />
      
        <div className="relative">
          <p className="text-xs uppercase tracking-wider text-orange-700 mb-1">
            Head Admin · Fine Management
          </p>
      
          <h1
            style={{ fontFamily: "'DM Serif Display', serif" }}
            className="text-2xl sm:text-3xl text-orange-950"
          >
            Set Fee Due Date
          </h1>
      
          <p className="text-sm text-orange-800 mt-1">
            Configure due dates and daily fine amounts per fee type
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: form steps ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Step 1: Campus */}
          <FormCard step="1" title="Select Campus" complete={!!location}>
            <div className="grid grid-cols-2 gap-3">
              {['Chittoor', 'Palakkad'].map(loc => (
                <button key={loc} onClick={() => setLocation(loc)}
                  className="relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-5 transition font-medium text-sm"
                  style={location === loc
                    ? { borderColor: THEME.primary, background: THEME.light, color: THEME.primary }
                    : { borderColor: '#e2e8f0', background: 'white', color: '#64748b' }}>
                  <MapPin size={22} style={{ color: location === loc ? THEME.primary : '#94a3b8' }} />
                  {loc}
                  {location === loc && (
                    <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full text-white text-xs"
                      style={{ background: THEME.primary }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </FormCard>

          {/* Step 2: Academic Year */}
          <FormCard step="2" title="Academic Year" complete={!!acadYear} disabled={!location}>
            {location ? (
              <div className="flex flex-wrap gap-2">
                {(apiData[location]?.academicYears || []).map(yr => {
                  const isCurrent = yr === getCurrentAcademicYear();
                  return (
                    <button key={yr} onClick={() => setAcadYear(yr)}
                      className="rounded-full px-4 py-2 text-sm font-medium border-2 transition"
                      style={acadYear === yr
                        ? { background: THEME.primary, color: 'white', borderColor: THEME.primary }
                        : { background: 'white', color: '#475569', borderColor: '#e2e8f0' }}>
                      {yr}
                      {isCurrent && (
                        <span className="ml-1.5 text-xs opacity-75">· current</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Select a campus first</p>
            )}
          </FormCard>

          {/* Step 3: Student Year */}
          <FormCard step="3" title="Student Year" complete={!!studYear} disabled={!acadYear}>
            <div className="grid grid-cols-3 gap-3">
              {['1', '2', '3'].map(yr => (
                <button key={yr}
                  onClick={() => acadYear && setStudYear(yr)}
                  disabled={!acadYear}
                  className="flex flex-col items-center gap-1 rounded-xl border-2 p-4 transition disabled:opacity-40"
                  style={studYear === yr
                    ? { borderColor: THEME.primary, background: THEME.light, color: THEME.primary }
                    : { borderColor: '#e2e8f0', background: 'white', color: '#64748b' }}>
                  <span className="text-2xl font-bold"
                    style={{ fontFamily: "'DM Serif Display', serif" }}>
                    {YEAR_ROMAN[yr]}
                  </span>
                  <span className="text-xs font-medium">Year</span>
                </button>
              ))}
            </div>
          </FormCard>

          {/* Step 4: Fee Type */}
          <FormCard step="4" title="Fee Type" complete={!!feeType} disabled={!studYear}>
            {studYear && feeList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {feeList.map(ft => (
                  <button key={ft} onClick={() => setFeeType(ft)}
                    className="flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition"
                    style={feeType === ft
                      ? { borderColor: THEME.primary, background: THEME.light, color: THEME.primary }
                      : { borderColor: '#e2e8f0', background: 'white', color: '#475569' }}>
                    <span className="flex-1 font-medium leading-tight">{formatFeeLabel(ft)}</span>
                    <ChevronRight size={13}
                      style={{ color: feeType === ft ? THEME.primary : '#cbd5e1', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                {studYear ? 'No fees found for this selection' : 'Select student year first'}
              </p>
            )}
          </FormCard>

          {/* Step 5: Due Date & Fine */}
          <FormCard step="5" title="Due Date & Fine Amount" complete={!!(dueDate && fineAmt)} disabled={!feeType}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Fine Due Date</label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type="date" value={dueDate}                   
                    onChange={e => setDueDate(e.target.value)}             
                    disabled={!feeType}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none transition focus:bg-white disabled:opacity-40"
                    onFocus={e => { e.target.style.borderColor = THEME.primary; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Fine Amount Per Day</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium pointer-events-none">₹</span>
                  <input type="number" min="0" value={fineAmt}
                    onChange={e => setFineAmt(e.target.value)}
                    placeholder="50"
                    disabled={!feeType}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2.5 text-sm outline-none transition focus:bg-white disabled:opacity-40"
                    onFocus={e => { e.target.style.borderColor = THEME.primary; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
                  />
                </div>
              </div>
            </div>
          </FormCard>
        </div>

        {/* ── Right: summary + status + submit ── */}
        <div>
          <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sticky top-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Review &amp; Submit</h3>

            {/* Summary rows */}
            <div className="space-y-3 mb-5">
              <SummaryRow label="Campus"        value={location} />
              <SummaryRow label="Academic Year" value={acadYear} />
              <SummaryRow label="Student Year"  value={studYear ? YEAR_DISPLAY[studYear] : ''} />
              <SummaryRow label="Fee Type"      value={feeType ? formatFeeLabel(feeType) : ''} />
              <SummaryRow label="Due Date"      value={dueDate ? toApiDate(dueDate) : ''} />
              <SummaryRow label="Fine / Day"    value={fineAmt ? `₹${fineAmt}` : ''} />
            </div>

            {/* ── Check status ── */}
            {allComplete && (
              <div className="mb-4">
                {checking && (
                  <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm"
                    style={{ background: THEME.light, color: THEME.primary }}>
                    <Loader2 size={15} className="animate-spin" />
                    Verifying due date…
                  </div>
                )}

                {!checking && checkResult === 'ok' && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                    <CheckCircle2 size={15} />
                    Ready — no existing due date
                  </div>
                )}

                {!checking && checkResult === 'error' && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle size={15} />
                    Verification failed — try again
                  </div>
                )}

                {!checking && typeof checkResult === 'object' && checkResult !== null && (
                  <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-2.5 mb-3">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800">Due date already set</p>
                        <p className="text-xs text-amber-700 mt-0.5 flex items-center gap-1">
                          <Clock size={11} />
                          Existing: {checkResult.existing}
                        </p>
                      </div>
                    </div>
                    {!overrideOk ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setOverrideOk(true)}
                          className="flex-1 rounded-lg px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                          style={{ background: THEME.primary }}>
                          Update Anyway
                        </button>
                        <button
                          onClick={() => { setFeeType(''); resetCheck(); }}
                          className="flex-1 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                        <CheckCircle2 size={13} /> Override confirmed
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white transition"
              style={{ background: (canSubmit && !submitting) ? THEME.primary : '#cbd5e1' }}>
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Applying…
                </span>
              ) : 'Apply Due Date'}
            </button>

            {!allComplete && (
              <p className="mt-3 text-center text-xs text-slate-400">
                Complete all steps above to continue
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───

function FormCard({ step, title, children, complete, disabled }) {
  return (
    <div className="rounded-2xl border-2 bg-white shadow-sm overflow-hidden transition"
      style={{ borderColor: complete ? THEME.mid : '#f1f5f9' }}>
      <div className="flex items-center gap-3 px-5 py-4 border-b"
        style={{
          borderColor: complete ? THEME.mid : '#f1f5f9',
          background: complete ? THEME.light : 'white',
        }}>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ background: complete ? THEME.primary : disabled ? '#cbd5e1' : '#94a3b8' }}>
          {complete ? '' : step}
        </span>
        <h2 className="text-sm font-semibold"
          style={{ color: complete ? THEME.primary : '#374151' }}>
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-400 shrink-0">{label}</span>
      <span className="text-xs font-medium text-slate-700 text-right truncate">
        {value || <span className="text-slate-300 font-normal">—</span>}
      </span>
    </div>
  );
}
