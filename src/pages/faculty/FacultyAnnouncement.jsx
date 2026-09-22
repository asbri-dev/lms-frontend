import { useState, useEffect } from "react";
import { Sparkles, CheckCircle, Zap, Clock, MapPin } from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import { useAuth } from "../../auth/useAuth";

const KEYFRAMES = `
  @keyframes ffa-backdrop {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes ffa-modal {
    from { opacity: 0; transform: scale(0.85) translateY(28px); }
    to   { opacity: 1; transform: scale(1)    translateY(0); }
  }

  @keyframes ffa-pill-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.0); }
    50%       { box-shadow: 0 0 0 5px rgba(255,255,255,0.15); }
  }

  @keyframes ffa-float-1 {
    0%   { transform: translate(0px, 0px)   scale(1);    opacity: 0.7; }
    50%  { transform: translate(6px, -18px) scale(1.25); opacity: 1;   }
    100% { transform: translate(0px, -36px) scale(0.6);  opacity: 0;   }
  }

  @keyframes ffa-float-2 {
    0%   { transform: translate(0px, 0px)    scale(0.8); opacity: 0.5; }
    50%  { transform: translate(-8px, -14px) scale(1.1); opacity: 0.9; }
    100% { transform: translate(-4px, -30px) scale(0.5); opacity: 0;   }
  }

  @keyframes ffa-float-3 {
    0%   { transform: translate(0px, 0px)   scale(1.1); opacity: 0.6; }
    50%  { transform: translate(10px, -10px) scale(0.9); opacity: 1;  }
    100% { transform: translate(5px, -28px)  scale(0.4); opacity: 0;  }
  }

  @keyframes ffa-card-left {
    from { opacity: 0; transform: translateX(-18px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  @keyframes ffa-card-right {
    from { opacity: 0; transform: translateX(18px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  @keyframes ffa-row-up {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes ffa-btn-bounce {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.04); }
    70%  { transform: scale(0.97); }
    100% { transform: scale(1); }
  }

  @keyframes ffa-check-pop {
    0%   { transform: scale(0.5); opacity: 0; }
    60%  { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(1);   opacity: 1; }
  }
`;

const FacultyFeatureAnnouncement = ({ onCompleted }) => {
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [btnAnimate, setBtnAnimate] = useState(false);
  const { user } = useAuth();

  // Inject keyframes once
  useEffect(() => {
    const id = "ffa-styles";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = KEYFRAMES;
      document.head.appendChild(s);
    }
    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, []);

  const handleCheck = (e) => {
    setAccepted(e.target.checked);
    if (e.target.checked) {
      setBtnAnimate(false);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setBtnAnimate(true))
      );
    }
  };

  const handleContinue = async () => {
    if (!accepted) return;
    try {
      setSaving(true);
      const response = await fetch(
        `${API_BASE_URL}/faculty/seen?empId=${user.employeeId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ empId: user.employeeId }),
        }
      );
      if (!response.ok) throw new Error("Failed to mark feature as seen");
      onCompleted();
    } catch (error) {
      console.error("Mark feature seen failed:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    /* BACKDROP */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{
        background: "rgba(0,0,0,0.60)",
        backdropFilter: "blur(4px)",
        animation: "ffa-backdrop 0.3s ease both",
      }}
    >
      {/* MODAL */}
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        style={{
          animation: "ffa-modal 0.45s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >

        {/* ── HEADER ── */}
        <div
          className="px-6 py-5 text-white relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1e2e58 0%, #3a4f8c 100%)",
          }}
        >
          {/* FLOATING SPARKLE PARTICLES */}
          <span
            aria-hidden="true"
            style={{
              position: "absolute", top: 18, right: 38,
              fontSize: 9, color: "rgba(255,255,255,0.75)",
              animation: "ffa-float-1 2.6s ease-in-out 0.4s infinite",
            }}
          >✦</span>
          <span
            aria-hidden="true"
            style={{
              position: "absolute", top: 28, right: 24,
              fontSize: 6, color: "rgba(255,255,255,0.55)",
              animation: "ffa-float-2 3.1s ease-in-out 1.1s infinite",
            }}
          >✦</span>
          <span
            aria-hidden="true"
            style={{
              position: "absolute", top: 12, right: 58,
              fontSize: 7, color: "rgba(255,255,255,0.65)",
              animation: "ffa-float-3 2.4s ease-in-out 1.8s infinite",
            }}
          >✦</span>

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <Sparkles size={22} />
            </div>
            <div>
              {/* PILL */}
              <div
                className="inline-flex items-center gap-1.5 bg-white/20 border border-white/30 rounded-full px-3 py-0.5 mb-1.5"
                style={{
                  animation:
                    "ffa-pill-pulse 2.2s ease-in-out 0.6s infinite",
                }}
              >
                <Zap size={11} className="text-white/80" />
                <span className="text-[11px] font-medium tracking-widest uppercase text-white/90">
                  New Feature
                </span>
              </div>

              <h2 className="text-[17px] font-semibold leading-tight">
                Attendance Swipes Upgraded
              </h2>
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="p-6">

          <p
            className="text-sm text-gray-500 leading-relaxed mb-5"
            style={{
              animation: "ffa-row-up 0.4s ease 0.3s both",
            }}
          >
            Punch records now appear instantly in the{" "}
            <span className="font-medium text-gray-700">Swipes</span> section —
            no more waiting until the next day to see your attendance.
          </p>

          {/* BEFORE / AFTER */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div
              className="rounded-xl border border-gray-200 bg-gray-50 p-3.5"
              style={{
                animation: "ffa-card-left 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.45s both",
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Clock size={13} className="text-gray-400" />
                <span className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase">
                  Before
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Punch from today showed up the following morning only.
              </p>
            </div>

            <div
              className="rounded-xl p-3.5"
              style={{
                background: "#1e2e5808",
                border: "1px solid #3a4f8c33",
                animation: "ffa-card-right 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.58s both",
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle size={13} style={{ color: "#3a4f8c" }} />
                <span
                  className="text-[10px] font-semibold tracking-widest uppercase"
                  style={{ color: "#3a4f8c" }}
                >
                  Now
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Punch reflects in Swipes section{" "}
                <em>immediately</em> — live.
              </p>
            </div>
          </div>

          {/* WHERE TO FIND IT */}
          <div
            className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-5"
            style={{
              animation: "ffa-row-up 0.4s ease 0.7s both",
            }}
          >
            <MapPin size={18} style={{ color: "#3a4f8c" }} className="flex-shrink-0" />
            <div>
              <p className="text-[11px] text-gray-400">Find it under</p>
              <p className="text-[13px] font-medium text-gray-700">
                My Attendance → Swipes
              </p>
            </div>
          </div>

          {/* CHECKBOX */}
          <label
            className="flex items-start gap-3 cursor-pointer mb-5"
            style={{
              animation: "ffa-row-up 0.4s ease 0.85s both",
            }}
          >
            <input
              type="checkbox"
              checked={accepted}
              onChange={handleCheck}
              className="mt-0.5 w-4 h-4 accent-[#2b3c6b]"
            />
            <span className="text-sm text-gray-500 leading-relaxed">
              I have read and understood this update.
            </span>
          </label>

          {/* BUTTON */}
          <button
            onClick={handleContinue}
            disabled={!accepted || saving}
            className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-200"
            style={
              accepted && !saving
                ? {
                    background:
                      "linear-gradient(135deg, #1e2e58 0%, #3a4f8c 100%)",
                    color: "#fff",
                    cursor: "pointer",
                    animation: btnAnimate
                      ? "ffa-btn-bounce 0.45s cubic-bezier(0.34,1.56,0.64,1) both"
                      : "none",
                  }
                : {
                    background: "#f3f4f6",
                    color: "#9ca3af",
                    cursor: "not-allowed",
                  }
            }
          >
            <CheckCircle
              size={17}
              style={
                accepted
                  ? {
                      animation:
                        "ffa-check-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
                    }
                  : {}
              }
            />
            {saving ? "Saving..." : "Continue to Dashboard"}
          </button>

        </div>
      </div>
    </div>
  );
};

export default FacultyFeatureAnnouncement;
