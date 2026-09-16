import { useState } from "react";
import {
  ClipboardList,
  BadgePercent,
  Sun,
} from "lucide-react";


import HeadAdminApprovalPage from "./sub/HeadAdminApprovalPage";
import PalakadApprove from "./sub/PalakadApprove"
import WaiveOffHistoryPage from "./sub/WaiveOffHistoryPage";


/* ── Head Admin / Sun orange theme ── */
const THEME = {
  primary: "#ea580c",
  deep:    "#c2410c",
  light:   "#fff7ed",
  mid:     "#fed7aa",
  pageBg:  "#F8FAFC",
};

const MODULES = [
  { key: "Approve",       label: "Chittoor Approve",     icon: <ClipboardList  size={15} />, component: <HeadAdminApprovalPage /> },
  { key: "Approve OP",       label: "Palakkad Approve",     icon: <ClipboardList size={15}/>,   component: <PalakadApprove />},
   { key: "Waive Off",       label: "Waive OFF History",     icon: < BadgePercent size={15}/>,   component: <WaiveOffHistoryPage />},

];

export default function ReportsDashboard() {
  const [active, setActive] = useState("Approve");
  const current = MODULES.find((m) => m.key === active);
                           
  return (
    <div className="min-h-screen" style={{ background: THEME.pageBg }}>
      <style>{`
        @keyframes sunSpin     { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes lineFlow    { 0% { left: -30%; } 100% { left: 100%; } }
        @keyframes fadeUpSoft  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .rpt-fade { animation: fadeUpSoft .25s ease both; }
      `}</style>

      {/* ── Gradient header ── */}
      <div
        className="relative px-6 py-6 sm:px-8 sm:py-7 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${THEME.primary} 0%, #f97316 55%, #fb923c 100%)`,
        }}
      >
        {/* title */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1
              className="text-white text-2xl sm:text-3xl font-semibold"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Reports Dashboard
            </h1>
            <p className="text-orange-100/80 text-sm mt-1">
              Attendance &amp; Leave Analytics
            </p>
          </div>

          <div
            className="px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2"
            style={{
              background: "rgba(255,255,255,0.18)",
              color: "white",
              backdropFilter: "blur(6px)",
            }}
          >
            
            <Sun size={15} style={{ animation: "sunSpin 8s linear infinite" }} />
            Head Admin
          </div>
        </div>

        {/* animated underline glow */}
        <div className="absolute bottom-0 left-0 w-full h-[3px] overflow-hidden">
          <div
            className="absolute top-0 left-[-30%] w-[30%] h-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)",
              filter: "blur(2px)",
              animation: "lineFlow 2.8s linear infinite",
            }}
          />
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div
        className="bg-white border-b px-4 sm:px-6"
        style={{ borderColor: THEME.mid }}
      >
        <div className="flex gap-0.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {MODULES.map((m) => {
            const isActive = active === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setActive(m.key)}
                className="flex items-center gap-1.5 px-4 py-3.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap"
                style={{
                  borderBottomColor: isActive ? THEME.primary : "transparent",
                  color: isActive ? THEME.primary : "#94a3b8",
                  background: isActive ? THEME.light : "transparent",
                }}
              >
                <span
                  style={{
                    color: isActive ? THEME.primary : "#94a3b8",
                    transition: "color .2s",
                  }}
                >
                  {m.icon}
                </span>
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active module ── */}
      <div className="p-4 sm:p-6 rpt-fade" key={active}>
        {current?.component ?? (
          /* Coming-soon placeholder for unbuilt modules */
          <div
            className="rounded-2xl bg-white shadow-sm flex flex-col items-center justify-center py-20 gap-4"
            style={{ border: `1.5px dashed ${THEME.mid}` }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: THEME.light }}
            >
              <span style={{ color: THEME.primary }}>
                {current?.icon &&
                  /* clone icon at larger size */
                  (() => {
                    const Icon = current.icon.type;
                    return <Icon size={26} />;
                  })()}
              </span>
            </div>
            <div className="text-center">
              <p
                className="text-base font-semibold"
                style={{ color: THEME.primary, fontFamily: "'DM Serif Display', serif" }}
              >
                {current?.label}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                This report is being prepared — check back soon.
              </p>
            </div>
            <div
              className="px-4 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: THEME.mid, color: THEME.deep }}
            >
              Coming Soon
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
