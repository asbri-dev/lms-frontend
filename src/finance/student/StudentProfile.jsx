import { useState, useEffect } from "react";
import {
  User, Phone, Mail, MapPin, Calendar, BookOpen,
  Droplets, Bus, Building2, GraduationCap, Shield,
  Hash, AlertCircle, Loader2, UserCheck, Globe, Home
} from "lucide-react";
import { useAuth } from "../../auth/useAuth"; // adjust path as needed
import { API_BASE_URL } from "../../config/api";

/* ─── tiny helpers ─────────────────────────────────────── */
const fmt = (val) => (val && val !== "null" ? val : "—");

const avatar = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const Badge = ({ children, color = "slate" }) => {
  const map = {
    slate: "bg-slate-100 text-slate-600 ring-slate-200",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    sky: "bg-sky-50 text-sky-700 ring-sky-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    rose: "bg-rose-50 text-rose-700 ring-rose-200",
    violet: "bg-violet-50 text-violet-700 ring-violet-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${map[color]}`}
    >
      {children}
    </span>
  );
};

const Field = ({ icon: Icon, label, value, full = false }) => (
  <div className={`flex flex-col gap-1 ${full ? "col-span-2" : ""}`}>
    <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
      {Icon && <Icon size={11} />}
      {label}
    </span>
    <span className="text-sm font-medium text-slate-800 leading-snug">{fmt(value)}</span>
  </div>
);

const Section = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-50 bg-gradient-to-r from-slate-50 to-white">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</h3>
    </div>
    <div className="p-6 grid grid-cols-2 gap-x-8 gap-y-5">{children}</div>
  </div>
);

/* ─── main component ────────────────────────────────────── */
const StudentProfile = () => {
  const { user } = useAuth(); // expects user.admissionNo or user.studentAdmissionNumber
  const admissionNo = user.admissionNumber;

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `${API_BASE_URL}/getStudentDetails?admissionNo=${(admissionNo)}`,
          { method: "GET", headers: { "Content-Type": "application/json" } }
        );
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        setStudent(data);
      } catch (err) {
        setError(err.message || "Failed to load profiles");
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [admissionNo]);

  /* ── loading ── */
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={36} className="animate-spin text-indigo-500" />
          <p className="text-sm font-medium">Loading profile…</p>
        </div>
      </div>
    );

  /* ── error ── */
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-8 max-w-sm text-center">
          <AlertCircle size={40} className="text-rose-400 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">Could not load profile</p>
          <p className="text-sm text-slate-400 mt-1">{error}</p>
        </div>
      </div>
    );

  const s = student;
  const initials = avatar(s.studentFullName);

  /* blood group colour */
  //const bgColor = s.bloodGroup?.includes("-") ? "rose" : "emerald";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50/30 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* ── hero card ── */}
        <div className="relative bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden">
          {/* decorative band */}
          <div className="absolute inset-x-0 top-0 h-28 bg-blue-500" />

          <div className="relative px-6 pt-6 pb-6 md:px-8 md:pt-8">
            {/* top-right badges */}
            <div className="absolute top-5 right-5 flex flex-wrap gap-2 justify-end">
              <Badge color="emerald">{fmt(s.studentType)}</Badge>
              <Badge color="sky">{fmt(s.managementOrGovt)}</Badge>
              {s.thirdYear && <Badge color="violet">3rd Year</Badge>}
            </div>

            {/* avatar + name row */}
            <div className="flex items-end gap-5 mt-10">
              {/* avatar circle */}
              <div className="shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white shadow-lg ring-4 ring-white flex items-center justify-center">
                <span className="text-2xl md:text-3xl font-black text-blue-500 select-none">
                  {initials}
                </span>
              </div>

              <div className="pb-1">
                <h1 className="text-xl md:text-2xl font-extrabold text-[#fbfbf2] leading-tight tracking-tight">
                  {fmt(s.studentFullName)}
                </h1>
                <p className="text-sm text-slate-500 mt-0.5 font-medium">
                  {fmt(s.department)} &nbsp;·&nbsp; {fmt(s.currentAcademicYear)}
                </p>

                <div className="flex flex-wrap gap-2 mt-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 ring-1 ring-indigo-200 rounded-full px-3 py-1">
                    <Hash size={11} /> {fmt(s.studentAdmissionNumber)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 ring-1 ring-slate-200 rounded-full px-3 py-1">
                    <UserCheck size={11} /> Reg: {fmt(s.studentRegistrationNumber)}
                  </span>
                </div>
              </div>
            </div>

            {/* quick stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[
                { icon: Droplets, label: "Blood Group", value: s.bloodGroup, accent: "text-rose-500" },
                { icon: Shield, label: "Caste", value: s.casteCategory, accent: "text-amber-500" },
                { icon: Globe, label: "Religion", value: s.religion, accent: "text-violet-500" },
                { icon: Bus, label: "Bus Route", value: s.busRoute, accent: "text-sky-500" },
              ].map(({ icon: Icon, label, value, accent }) => (
                <div
                  key={label}
                  className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100"
                >
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                    {Icon && <Icon size={11} className={accent} />}
                    {label}
                  </p>
                  <p className="text-sm font-semibold text-slate-700 truncate">{fmt(value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── grid of sections ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* personal */}
          <Section title="Personal Information">
            <Field icon={User} label="Full Name" value={s.studentFullName} full />
            <Field icon={User} label="Father's Name" value={s.fatherName} />
            <Field icon={User} label="Mother's Name" value={s.motherName} />
            <Field icon={Calendar} label="Date of Birth" value={s.dateOfBirth} />
            <Field icon={UserCheck} label="Gender" value={s.gender} />
          </Section>

          {/* contact */}
          <Section title="Contact Details">
            <Field icon={Phone} label="Student Mobile" value={s.studentMobileNumber} />
            <Field icon={Phone} label="Parents Mobile" value={s.parentsMobileNumber} />
            <Field icon={Mail} label="Email Address" value={s.studentEmailId} full />
            <Field icon={Home} label="District" value={s.district} />
            <Field icon={Globe} label="State" value={s.state} />
            <Field icon={MapPin} label="Permanent Address" value={s.permanentAddress} full />
          </Section>

          {/* academic */}
          <Section title="Academic Details">
            <Field icon={GraduationCap} label="Department" value={s.department} />
            <Field icon={BookOpen} label="Academic Year" value={s.currentAcademicYear} />
            <Field icon={Calendar} label="Date of Joining" value={s.dateOfJoining} />
            <Field icon={Building2} label="Management" value={s.managementOrGovt} />
            <Field icon={UserCheck} label="Student Type" value={s.studentType} />
            <Field icon={UserCheck} label="Current Semester" value={s.currentSemester } />
          </Section>

          {/* identity */}
          <Section title="Identity & Classification">
            <Field icon={Hash} label="Admission No." value={s.studentAdmissionNumber} />
            <Field icon={Hash} label="Registration No." value={s.studentRegistrationNumber} />
            <Field icon={Shield} label="Caste Category" value={s.casteCategory} />
            <Field icon={Globe} label="Religion" value={s.religion} />
            <Field icon={Droplets} label="Blood Group" value={s.bloodGroup} />
            <Field icon={Bus} label="Bus Route" value={s.busRoute} />
          </Section>

        </div>

        {/* footer */}
        <p className="text-center text-xs text-slate-300 pb-4">
          Student ID #{s.id} &nbsp;·&nbsp; Data sourced from institutional records
        </p>
      </div>
    </div>
  );
};

export default StudentProfile;
