import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CircleAlert,
  AlertTriangle,
  ArrowLeft,
  LayoutDashboard,
} from "lucide-react";

/**
 * SalaryInitiationErrorPage
 *
 * Shown when the backend contacts ICICI Integra but receives no valid
 * redirect URL. The actual transaction outcome is unknown — this page
 * reflects that uncertainty without blaming the user or exposing internals.
 *
 * Props:
 *   referenceId (string) — optional; falls back to ?referenceId= query param,
 *                          then "N/A" if neither is present.
 */
export default function SalaryInitiationErrorPage({ referenceId: propReferenceId }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const referenceId =
    propReferenceId ||
    searchParams.get("referenceId") ||
    searchParams.get("refId") ||
    "N/A";

  const hasRefId = referenceId !== "N/A";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&family=DM+Serif+Display&display=swap');

        .sie-root * {
          font-family: 'DM Sans', sans-serif;
          box-sizing: border-box;
        }

        @keyframes sieFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .sie-card {
          animation: sieFadeUp 0.32s ease both;
        }

        .sie-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px 20px;
          border-radius: 10px;
          border: none;
          background: #3D7DFC;
          color: white;
          font-size: 14px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: background 0.18s, transform 0.12s, box-shadow 0.18s;
          box-shadow: 0 2px 8px rgba(61,125,252,0.22);
        }
        .sie-btn-primary:hover {
          background: #2563eb;
          box-shadow: 0 4px 14px rgba(61,125,252,0.32);
        }
        .sie-btn-primary:active { transform: scale(0.98); }
        .sie-btn-primary:focus-visible {
          outline: 2px solid #3D7DFC;
          outline-offset: 3px;
        }

        .sie-btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 11px 20px;
          border-radius: 10px;
          border: 1.5px solid #D8E4FA;
          background: white;
          color: #3D7DFC;
          font-size: 14px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: background 0.18s, border-color 0.18s, transform 0.12s;
        }
        .sie-btn-secondary:hover {
          background: #E9F3FF;
          border-color: #3D7DFC;
        }
        .sie-btn-secondary:active { transform: scale(0.98); }
        .sie-btn-secondary:focus-visible {
          outline: 2px solid #3D7DFC;
          outline-offset: 3px;
        }
      `}</style>

      {/* ── Page shell ────────────────────────────────────────────────────── */}
      <div
        className="sie-root"
        style={{
          minHeight: "100vh",
          background: "#F0F4FF",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
        }}
      >
        {/* ── Card ──────────────────────────────────────────────────────────── */}
        <div
          className="sie-card"
          style={{
            background: "white",
            borderRadius: 20,
            boxShadow:
              "0 0 0 1px rgba(61,125,252,0.08), 0 8px 32px rgba(61,125,252,0.10), 0 2px 6px rgba(0,0,0,0.05)",
            width: "100%",
            maxWidth: 468,
            overflow: "hidden",
          }}
        >
          {/* Blue top accent bar */}
          <div
            style={{
              height: 4,
              background:
                "linear-gradient(90deg, #3D7DFC 0%, #7aaeff 60%, #D8E4FA 100%)",
            }}
          />

          {/* ── Card body ───────────────────────────────────────────────────── */}
          <div style={{ padding: "40px 36px 32px" }}>

            {/* Error icon */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 26,
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "#fff1f2",
                  border: "1.5px solid #fecdd3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <CircleAlert size={34} color="#e11d48" strokeWidth={1.6} />
              </div>
            </div>

            {/* Heading */}
            <h1
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 22,
                fontWeight: 400,
                color: "#0f172a",
                textAlign: "center",
                margin: "0 0 13px",
                lineHeight: 1.35,
                letterSpacing: "-0.25px",
              }}
            >
              Unable to Confirm Payment Initiation
            </h1>

            {/* Supporting message */}
            <p
              style={{
                fontSize: 14,
                color: "#64748b",
                textAlign: "center",
                lineHeight: 1.72,
                margin: "0 0 26px",
              }}
            >
              The banking system did not return a confirmation for this
              request. Your Payment initiation may or may not have been
              processed. Please wait and verify your records before taking
              further action.
            </p>



            {/* Amber warning box */}
            <div
              style={{
                background: "#fffbeb",
                border: "1px solid #fcd34d",
                borderRadius: 11,
                padding: "14px 16px",
                marginBottom: 30,
                display: "flex",
                gap: 11,
                alignItems: "flex-start",
              }}
            >
              <AlertTriangle
                size={16}
                color="#d97706"
                style={{ flexShrink: 0, marginTop: 2 }}
              />
              <div>
                <p
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: "#92400e",
                    margin: "0 0 4px",
                    lineHeight: 1.3,
                  }}
                >
                  Please do not retry immediately.
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "#a16207",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  Check your Fee records or contact the Email support.it@asbritech.com  before
                  initiating again to avoid duplicate transactions.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                className="sie-btn-primary"
                onClick={() => navigate("/student/make-payment")}
              >
                <ArrowLeft size={15} />
                Back to Fee Initiation
              </button>
              <button
                className="sie-btn-secondary"
                onClick={() => navigate("/student/dashboard")}
              >
                <LayoutDashboard size={15} />
                Go to Dashboard
              </button>
            </div>
          </div>

          {/* ── Card footer ─────────────────────────────────────────────────── */}
          <div
            style={{
              borderTop: "1px solid #f1f5f9",
              padding: "14px 36px",
              background: "#fafcff",
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: "#94a3b8",
                margin: 0,
                textAlign: "center",
                lineHeight: 1.55,
              }}
            >
              {hasRefId
                ? `Share reference ID ${referenceId} with the Finance team if you need support.`
                : "Contact the Finance team if this issue persists."}
            </p>
          </div>
        </div>

        {/* ── Brand watermark below card ─────────────────────────────────── */}
        <p
          style={{
            marginTop: 24,
            fontSize: 12,
            color: "#94a3b8",
            textAlign: "center",
          }}
        >
          Aries Polytechnic · LMS Aries
        </p>
      </div>
    </>
  );
}
