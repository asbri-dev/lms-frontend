import { useNavigate } from "react-router-dom";
import {
  LogIn,
  CalendarCheck,
  CheckSquare,
  Users,
} from "lucide-react";

const FEATURES = [
  {
    icon: <CalendarCheck size={12} className="text-white/60" />,
    label: "Attendance calendar with punch in/out",
  },
  {
    icon: <CheckSquare size={12} className="text-white/60" />,
    label: "Leave, permission and OD approvals",
  },
  {
    icon: <Users size={12} className="text-white/60" />,
    label: "Super admin controls across both campuses",
  },
];

const STATS = [
  { num: "3",    label: "Role levels"   },
  { num: "2",    label: "Campuses"      },
  { num: "100%", label: "Cloud hosted"  },
];

const OpeningPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111827] p-4">
      <div className="w-full max-w-4xl rounded-2xl overflow-hidden flex min-h-[560px] relative border border-white/5">

        {/* ─── Top Bar ─── */}
        <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-10 border-b border-white/5 z-10">
          <div className="flex items-center gap-2 text-sm font-medium text-white/70">
            <div className="w-2 h-2 rounded-sm bg-emerald-400" />
            LMS · Aries
          </div>
          <nav className="flex gap-6">
            {["Features", "About", "Support"].map((item) => (
              <span key={item} className="text-xs text-white/30 cursor-pointer hover:text-white/60 transition-colors">
                {item}
              </span>
            ))}
          </nav>
        </div>

        {/* ─── Left: Content ─── */}
        <div className="flex-1 bg-[#1a2744] flex flex-col justify-center px-10 pt-12 pb-10">

          {/* Tag */}
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-medium tracking-widest text-white/40 uppercase">
              Leave management system
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400">
              v2.0
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-[32px] font-medium text-white leading-tight mb-2">
            Manage leave,
          </h1>
          <h1 className="text-[32px] font-light text-white/35 leading-tight mb-5">
            effortlessly.
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-white/40 leading-relaxed mb-8 max-w-xs">
            A unified platform for faculty leave, attendance tracking, and
            admin approvals — built for academic institutions.
          </p>

          {/* Stats */}
          <div className="flex gap-6 mb-9">
            {STATS.map((s, i) => (
              <div key={s.label} className="flex items-center gap-6">
                <div>
                  <div className="text-xl font-medium text-white">{s.num}</div>
                  <div className="text-[11px] text-white/35 mt-0.5">{s.label}</div>
                </div>
                {i < STATS.length - 1 && (
                  <div className="w-px h-8 bg-white/10" />
                )}
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mb-9 flex-wrap">
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2.5 text-sm font-medium px-5 py-2.5 rounded-lg
                         bg-white text-[#1a2744] hover:bg-blue-50 transition-colors"
            >
              <LogIn size={14} />
              Go to login
            </button>
            <button
              className="flex items-center gap-2.5 text-sm font-medium px-5 py-2.5 rounded-lg
                         bg-white/6 text-white/60 border border-white/10
                         hover:bg-white/10 hover:text-white/80 transition-colors"
            >
              Learn more
            </button>
          </div>

          {/* Features */}
          <div className="flex flex-col gap-2.5">
            {FEATURES.map((f) => (
              <div key={f.label} className="flex items-center gap-2.5 text-xs text-white/45">
                <div className="w-6 h-6 rounded-md bg-white/6 flex items-center justify-center flex-shrink-0">
                  {f.icon}
                </div>
                {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* ─── Right: Geometric decoration ─── */}
        <div className="w-60 flex-shrink-0 bg-[#141e35] flex items-center justify-center relative overflow-hidden">

          {/* Concentric circles */}
          <div className="absolute w-56 h-56 rounded-full border border-white/5" />
          <div className="absolute w-40 h-40 rounded-full border border-white/8" />
          <div className="absolute w-24 h-24 rounded-full bg-white/4 flex items-center justify-center">
            <div className="w-11 h-11 rounded-xl bg-white/6 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01" stroke="#6ee7b7" strokeWidth="1.5"/>
              </svg>
            </div>
          </div>

          {/* Floating dots */}
          <div className="absolute w-1.5 h-1.5 rounded-full bg-white/30" style={{ top: "22%", left: "26%" }} />
          <div className="absolute w-1 h-1 rounded-full bg-white/20" style={{ top: "70%", left: "70%" }} />
          <div className="absolute w-2 h-2 rounded-full bg-white/15" style={{ top: "78%", left: "22%" }} />
          <div className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400/40" style={{ top: "18%", left: "66%" }} />
          <div className="absolute w-1 h-1 rounded-full bg-white/25" style={{ top: "55%", left: "15%" }} />
        </div>

      </div>
    </div>
  );
};

export default OpeningPage;
