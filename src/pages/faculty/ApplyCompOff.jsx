import { useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { API_BASE_URL } from "../../config/api";
import toast from "react-hot-toast";

const PRIMARY = "#2b3c6b";
const SECONDARY = "#3f548f";
const BG = "#F7F8FC";
const BORDER = "#E5E7EB";
const TEXT = "#1F2937";
const MUTED = "#6B7280";

const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: TEXT,
  marginBottom: 6,
};

const errorStyle = {
  fontSize: 12,
  color: "#EF4444",
  marginTop: 4,
};

function Field({ label, error, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <label style={labelStyle}>
        {label} <span style={{ color: "#EF4444" }}>*</span>
      </label>
      {children}
      {error && <p style={errorStyle}>{error}</p>}
    </div>
  );
}

export default function ApplyCompOff() {
  const { user } = useAuth();
  const empId=user.employeeId.startsWith("AREP") ? "Palakkad" : "Chittoor";

  const [form, setForm] = useState({
    collegeLocation: empId,
    workedDate: "",
    workedReason: "",
    availedDate: "",
    availedReason: "",
    appliedOn: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).replace(/ /g, "-"),
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

const formatDate = (val) => {
  if (!val) return "";

  const d = new Date(val);

  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
};

  const validate = () => {
    const e = {};
    if (!form.collegeLocation) e.collegeLocation = "Select a location";
    if (!form.workedDate) e.workedDate = "Enter the worked date";
    if (!form.workedReason.trim()) e.workedReason = "Enter the reason for working";
    if (!form.availedDate) e.availedDate = "Enter the availed date";
    if (!form.availedReason.trim()) e.availedReason = "Enter the reason for availing";
    return e;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

 const handleSubmit = async () => {
  const e = validate();

  if (Object.keys(e).length > 0) {
    setErrors(e);
    toast.error("Please fill all required fields.");
    return;
  }

  const payload = {
    empId: user.employeeId,
    adminEmpId: user.adminId,
    collegeLocation: form.collegeLocation,
    workedDate: formatDate(form.workedDate),
    workedReason: form.workedReason,
    availedDate: formatDate(form.availedDate),
    availedReason: form.availedReason,
    appliedOn: form.appliedOn,
  };

  setLoading(true);

  try {
    // ------------------------------------------------
    // STEP 1: CHECK API
    // ------------------------------------------------
    const checkRes = await fetch(`${API_BASE_URL}/checkCompOff`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const checkData = await checkRes.text();

    // Check API failed
    if (!checkRes.ok) {
      toast.error(checkData || "Comp-off validation failed.");
      return;
    }

    // ------------------------------------------------
    // STEP 2: FINAL SUBMIT API
    // ------------------------------------------------
    const submitRes = await fetch(`${API_BASE_URL}/applyCompOff`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const submitData = await submitRes.text();

    // Final submit failed
    if (!submitRes.ok) {
      toast.error(submitData || "Failed to submit comp-off request.");
      return;
    }

    // ------------------------------------------------
    // SUCCESS
    // ------------------------------------------------
    toast.success(
      submitData || "Comp-off request submitted successfully."
    );

    setForm({
      collegeLocation: "",
      workedDate: "",
      workedReason: "",
      availedDate: "",
      availedReason: "",
      appliedOn: form.appliedOn,
    });

    setErrors({});

  } catch (error) {
    console.error("Comp-off submit error:", error);
    toast.error("Network error. Please try again.");
  } finally {
    setLoading(false);
  }
};

  const inputStyle = (field) => ({
    width: "100%",
    padding: "10px 14px",
    border: `1.5px solid ${errors[field] ? "#EF4444" : BORDER}`,
    borderRadius: 8,
    fontSize: 14,
    color: TEXT,
    backgroundColor: "#fff",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "border-color 0.2s",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: BG,
        padding: "32px 24px",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: TEXT }}>Apply Comp-Off</h1>
            <p style={{ margin: 0, fontSize: 13, color: MUTED }}>Submit a compensatory off request</p>
          </div>
        </div>
      </div>

      {/* Info strip */}
      <div
        style={{
          background: "#EEF2FF",
          border: `1px solid #C7D2FE`,
          borderRadius: 10,
          padding: "12px 16px",
          marginBottom: 24,
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={SECONDARY} strokeWidth={2} style={{ marginTop: 1, flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p style={{ margin: 0, fontSize: 13, color: SECONDARY, lineHeight: 1.6 }}>
          Comp-off is granted for working on holidays or week-offs. Fill in the worked date, reason, and when you intend to avail the leave.
        </p>
      </div>

      {/* Card */}
      <div
        style={{
          background: "#fff",
          border: `1px solid ${BORDER}`,
          borderRadius: 14,
          padding: "28px 28px",
          maxWidth: 700,
        }}
      >
        {/* Section: Work Details */}
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 18,
              paddingBottom: 12,
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            <div
              style={{
                width: 4,
                height: 18,
                borderRadius: 4,
                background: `linear-gradient(${PRIMARY}, ${SECONDARY})`,
              }}
            />
            <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>Work details</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>

            <Field label="Worked date" field="workedDate" error={errors.workedDate}>
              <input
                type="date"
                value={form.workedDate}
                onChange={(e) => handleChange("workedDate", e.target.value)}
                style={inputStyle("workedDate")}
              />
            </Field>

            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Reason for working" field="workedReason" error={errors.workedReason}>
                <textarea
                  rows={2}
                  placeholder="e.g. Invigilation duty held on 16-Sep-2026"
                  value={form.workedReason}
                  maxLength={50}
                  onChange={(e) => handleChange("workedReason", e.target.value)}
                  style={{
                    ...inputStyle("workedReason"),
                    resize: "vertical",
                    lineHeight: 1.6,
                  }}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Section: Avail Details */}
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 18,
              paddingBottom: 12,
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            <div
              style={{
                width: 4,
                height: 18,
                borderRadius: 4,
                background: `linear-gradient(${PRIMARY}, ${SECONDARY})`,
              }}
            />
            <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>Avail details</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
            <Field label="Availed date" field="availedDate" error={errors.availedDate}>
              <input
                type="date"
                value={form.availedDate}
                onChange={(e) => handleChange("availedDate", e.target.value)}
                
                style={inputStyle("availedDate")}
              />
            </Field>

            <Field label="Applied on" field="appliedOn" error={errors.appliedOn}>
              <input
                type="text"
                value={form.appliedOn}
                readOnly
                style={{
                  ...inputStyle("appliedOn"),
                  backgroundColor: "#F3F4F6",
                  color: MUTED,
                  cursor: "not-allowed",
                }}
              />
            </Field>

            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Reason for availing" field="availedReason" error={errors.availedReason}>
                <textarea
                  rows={2}
                  placeholder="e.g. Personal work"
                  value={form.availedReason}
                  onChange={(e) => handleChange("availedReason", e.target.value)}
                  maxLength={50}
                  style={{
                    ...inputStyle("availedReason"),
                    resize: "vertical",
                    lineHeight: 1.6,
                  }}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            paddingTop: 16,
            borderTop: `1px solid ${BORDER}`,
          }}
        >
          <button
            onClick={() => {
              setForm({
                collegeLocation: "",
                workedDate: "",
                workedReason: "",
                availedDate: "",
                availedReason: "",
                appliedOn: form.appliedOn,
              });
              setErrors({});
            }}
            style={{
              padding: "10px 22px",
              borderRadius: 8,
              border: `1.5px solid ${BORDER}`,
              background: "#fff",
              color: MUTED,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Clear
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: "10px 28px",
              borderRadius: 8,
              border: "none",
              background: loading
                ? "#9CA3AF"
                : `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "opacity 0.2s",
            }}
          >
            {loading ? (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth={2.5}
                  style={{ animation: "spin 1s linear infinite" }}
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Submitting…
              </>
            ) : (
              "Submit request"
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.6; }
        select:focus, input:focus, textarea:focus { border-color: ${SECONDARY} !important; box-shadow: 0 0 0 3px ${SECONDARY}22; }
        button:hover:not(:disabled) { opacity: 0.92; }
      `}</style>
    </div>
  );
}
