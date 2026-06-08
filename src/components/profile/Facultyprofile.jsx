import { useState, useEffect } from "react";
import { useAuth } from "../../auth/useAuth";
 // your fallback image

import { API_BASE_URL } from "../../config/api";

const theme = {
  sidebar: "bg-slate-900",
  background: "bg-[#2b3c6b]",
  Ntext: "text-white",
  hover: "hover:bg-[#3f548f]",
  active: "bg-white",
  text: "text-slate-900",
  header: "bg-white",
};

// ─── small helpers ───────────────────────────────────────────────────────────

function Avatar({ empId, name }) {
  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div className="relative">
      <img
        src={`${API_BASE_URL}/image/${empId}`}
        alt={name}
        className="w-20 h-20 rounded-full object-cover border-2 border-white shadow"
        onError={(e) => {
          e.target.style.display = "none";
          e.target.nextSibling.style.display = "flex";
        }}
      />
      {/* fallback initials circle — hidden until image errors */}
      <div
        className="w-20 h-20 rounded-full bg-[#2b3c6b] items-center justify-center text-white text-2xl font-medium shadow"
        style={{ display: "none" }}
      >
        {initials}
      </div>
    </div>
  );
}

function InfoField({ label, value, highlight = false }) {
  if (!value || value === "N/A" || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-gray-400">
        {label}
      </span>
      <span
        className={`text-sm ${
          highlight ? "text-blue-700 font-medium" : "text-gray-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function SectionCard({ icon, title, children }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <span className="text-[#3f548f] text-lg">{icon}</span>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1a2744]">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function StatPill({ value, label }) {
  return (
    <div className="flex flex-col items-center bg-[#f0f4ff] rounded-lg px-4 py-2">
      <span className="text-xl font-semibold text-[#2b3c6b]">{value ?? 0}</span>
      <span className="text-[10px] text-gray-500 mt-0.5 text-center">{label}</span>
    </div>
  );
}

function Badge({ children, color = "blue" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };
  return (
    <span
      className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${colors[color]}`}
    >
      {children}
    </span>
  );
}

// ─── loading skeleton ─────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className={`min-h-screen ${theme.background} p-5 animate-pulse`}>
      <div className="bg-white rounded-xl p-6 flex gap-5 items-center mb-4">
        <div className="w-20 h-20 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-48 bg-gray-200 rounded" />
          <div className="h-3 w-32 bg-gray-100 rounded" />
          <div className="flex gap-2 mt-2">
            <div className="h-5 w-16 bg-gray-100 rounded-full" />
            <div className="h-5 w-24 bg-gray-100 rounded-full" />
          </div>
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl p-5 mb-4 space-y-3">
          <div className="h-3 w-28 bg-gray-200 rounded" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-8 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── error state ──────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }) {
  return (
    <div
      className={`min-h-screen ${theme.background} flex items-center justify-center p-6`}
    >
      <div className="bg-white rounded-xl p-8 max-w-sm w-full text-center shadow">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="text-base font-semibold text-gray-800 mb-1">
          Failed to load profile
        </h2>
        <p className="text-sm text-gray-500 mb-5">{message}</p>
        <button
          onClick={onRetry}
          className="px-5 py-2 bg-[#2b3c6b] text-white text-sm rounded-lg hover:bg-[#3f548f] transition"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function FacultyProfile() {
  const { user, token } = useAuth();
  const empId = user?.employeeId || "";

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    if (!empId) {
      setError("Employee ID not found. Please log in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/faculty/getAllFacultyDetails?empId=${empId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }
      if (response.status === 403) {
        throw new Error("You don't have permission to view this profile.");
      }
      if (response.status === 404) {
        throw new Error("Profile not found for this employee.");
      }
      if (!response.ok) {
        throw new Error(`Server error (${response.status}). Please try again.`);
      }

      const data = await response.json();

      // backend returns array → take first element
      const record = Array.isArray(data) ? data[0] : data;
      setProfile(record);
    } catch (err) {
      // network failure (no internet, CORS, timeout etc.)
      if (err.name === "TypeError") {
        setError("Network error. Check your connection and try again.");
      } else {
        setError(err.message || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empId]);

  // ── render states ──────────────────────────────────────────────────────────

  if (loading) return <Skeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchProfile} />;
  if (!profile) return null;

  const { personalDetails: p, contactDetails: c, addressDetails: a, educationDetails: e, bankDetails: b } = profile;

  const fullName = [p.firstName, p.middleName, p.lastName]
    .filter(Boolean)
    .join(" ");

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div className={`min-h-screen ${theme.background}`}>

      {/* ── top header bar ── */}
     

      <div className="p-4 md:p-6 flex flex-col gap-4">

        {/* ── hero card ── */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Avatar empId={empId} name={fullName} />
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-[#1a2744]">{fullName}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {p.designation} · {p.facultyDept}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge color="green">● Active</Badge>
                <Badge color="blue">
                  Joined{" "}
                  {p.dateOfJoining
                    ? new Date(p.dateOfJoining).toLocaleDateString("en-IN", {
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </Badge>
                {p.reportingManager && (
                  <Badge color="amber">Reports to {p.reportingManager}</Badge>
                )}
              </div>
            </div>
            {/* leave stats */}
            <div className="flex gap-2 flex-shrink-0">
              <StatPill value={p.casualLeaves} label="Casual Leaves" />
              <StatPill value={p.medicalLeaves} label="Medical Leaves" />
              <StatPill value={p.onDutyRequests ?? 0} label="On Duty" />
            </div>
          </div>
        </div>

        {/* ── row 1 ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* personal details */}
          <SectionCard icon="👤" title="Personal Details">
            <div className="grid grid-cols-2 gap-3">
              <InfoField label="Employee ID" value={p.empId} highlight />
              <InfoField label="Gender" value={p.gender} />
              <InfoField
                label="Date of Birth"
                value={
                  p.dateOfBirth
                    ? new Date(p.dateOfBirth).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : null
                }
              />
              <InfoField label="Blood Group" value={p.bloodGroup} />
              <InfoField label="Marital Status" value={p.martialStatus} />
              <InfoField
                label="Date of Joining"
                value={
                  p.dateOfJoining
                    ? new Date(p.dateOfJoining).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : null
                }
              />
            </div>
            <div className="border-t border-gray-100 mt-3 pt-3 grid grid-cols-1 gap-2">
              <InfoField label="Mobile" value={p.mobileNumber} highlight />
              <InfoField label="Email" value={p.email} highlight />
              <InfoField label="College Location" value={p.collegeLocation} />
            </div>
          </SectionCard>

          {/* contact & family */}
          <SectionCard icon="📞" title="Contact & Family">
            <div className="grid grid-cols-1 gap-2">
              <InfoField label="Father's Name" value={c?.fatherName} />
              <InfoField label="Mother's Name" value={c?.motherName} />
              {c?.spouseName && (
                <InfoField label="Spouse" value={c.spouseName} />
              )}
            </div>
            <div className="border-t border-gray-100 mt-3 pt-3 grid grid-cols-1 gap-2">
              <InfoField
                label="Emergency Contact"
                value={
                  c?.emergencyContactName
                    ? `${c.emergencyContactName} (${c.emergencyContactRelation})`
                    : null
                }
              />
              <InfoField
                label="Emergency Mobile"
                value={c?.emergencyContactMobileNumber}
                highlight
              />
            </div>
            <div className="border-t border-gray-100 mt-3 pt-3 grid grid-cols-2 gap-3">
              <InfoField
                label="Nearest Railway"
                value={c?.nearByRailWayStation}
              />
              <InfoField
                label="Nearest Post Office"
                value={
                  c?.nearByPostOffice
                    ? `${c.nearByPostOffice} — ${c.postOfficePinCode}`
                    : null
                }
              />
            </div>
          </SectionCard>
        </div>

        {/* ── row 2 ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* address */}
          <SectionCard icon="📍" title="Address">
            <p className="text-[10px] font-semibold text-[#3f548f] uppercase tracking-wide mb-2">
              Current address
            </p>
            <div className="grid grid-cols-1 gap-2">
              <InfoField label="Street / Area / H.No" value={a?.streetAreaHno} />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <InfoField label="City" value={a?.currentCity} />
              <InfoField label="Postal Code" value={String(a?.postalCode ?? "")} />
              <InfoField label="District" value={a?.currentDistrict} />
              <InfoField label="State" value={a?.currentState} />
            </div>
            <div className="border-t border-gray-100 mt-3 pt-3 flex flex-col gap-2">
              {a?.isSame && (
                <p className="text-xs text-green-700 font-medium">
                  ✓ Permanent address same as current
                </p>
              )}
              <InfoField label="Nationality" value={a?.nationality} />
            </div>
          </SectionCard>

          {/* education */}
          <SectionCard icon="🎓" title="Education">
            <p className="text-[10px] font-semibold text-[#3f548f] uppercase tracking-wide mb-2">
              Undergraduate
            </p>
            <div className="grid grid-cols-1 gap-2">
              <InfoField
                label="Degree"
                value={
                  e?.ugCourse
                    ? `${e.ugCourse} — ${e.ugSpecialization}`
                    : null
                }
              />
              <InfoField label="College" value={e?.ugCollegeName} />
              <InfoField label="University" value={e?.ugUniversityName} />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <InfoField
                label="Period"
                value={
                  e?.ugStartDate && e?.ugEndDate
                    ? `${new Date(e.ugStartDate).getFullYear()} – ${new Date(e.ugEndDate).getFullYear()}`
                    : null
                }
              />
              <InfoField label="Status" value={e?.ugStatus} />
            </div>
            {e?.pgCourse && e.pgCourse !== "N/A" && (
              <>
                <div className="border-t border-gray-100 mt-3 pt-3">
                  <p className="text-[10px] font-semibold text-[#3f548f] uppercase tracking-wide mb-2">
                    Postgraduate
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <InfoField
                      label="Degree"
                      value={`${e.pgCourse} — ${e.pgSpecialization}`}
                    />
                    <InfoField label="College" value={e.pgCollegeName} />
                    <InfoField label="University" value={e.pgUniversityName} />
                  </div>
                </div>
              </>
            )}
            <div className="flex gap-2 flex-wrap mt-3 pt-3 border-t border-gray-100">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
                Highest: {e?.highestQualification}
              </span>
              {(!e?.pgCourse || e.pgCourse === "N/A") && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  No PG
                </span>
              )}
              {(!e?.phDStatus || e.phDStatus === "N/A") && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  No PhD
                </span>
              )}
            </div>
          </SectionCard>
        </div>

        {/* ── bank & PF ── */}
        <SectionCard icon="🏦" title="Bank & PF Details">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoField label="Bank Name" value={b?.bankName} />
            <InfoField label="Branch" value={b?.bankBranch} />
            <InfoField label="Account Number" value={b?.accountNumber} highlight />
            <InfoField label="IFSC Code" value={b?.ifscCode} highlight />
            <InfoField label="Account Type" value={b?.typeOfAccount} />
            <InfoField label="Name as per Bank" value={b?.nameAsPerBankRecords} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wide text-gray-400">
                PF Eligible
              </span>
              <span
                className={`text-sm font-medium ${
                  b?.eligibleForPf ? "text-green-700" : "text-red-600"
                }`}
              >
                {b?.eligibleForPf ? "✓ Eligible" : "✗ Not Eligible"}
              </span>
            </div>
            {b?.universalAccountNumber && (
              <InfoField label="UAN" value={b.universalAccountNumber} highlight />
            )}
          </div>
        </SectionCard>

      </div>
    </div>
  );
}
