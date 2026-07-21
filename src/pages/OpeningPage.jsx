import { useNavigate } from "react-router-dom";
import { useState } from "react";

import {
  CalendarCheck,
  CheckSquare,
  Users,
  Wallet,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  School,
  LifeBuoy,
} from "lucide-react";

const FEATURES = [
  {
    icon: <CalendarCheck size={22} className="text-blue-600" />,
    title: "Attendance Tracking",
    description:
      "Punch in/out attendance system with smart academic calendar.",
  },
  {
    icon: <CheckSquare size={22} className="text-indigo-600" />,
    title: "Leave Approvals",
    description:
      "Manage leave, OD and permissions digitally with approval flow.",
  },
  {
    icon: <Wallet size={22} className="text-cyan-600" />,
    title: "Fee Management",
    description:
      "Semester-wise fee tracking and online payment management.",
  },
  {
    icon: <Users size={22} className="text-sky-600" />,
    title: "Admin Controls",
    description:
      "Complete administrative management across departments.",
  },
];

const OpeningPage = () => {
  const navigate = useNavigate();

  const [activePage, setActivePage] = useState("home");

  return (
    <div className="w-full h-screen overflow-hidden bg-[#f5f9ff]">
      {/* ================= HEADER ================= */}
      <header
        className="
          sticky top-0 z-50
          h-20
          bg-white/90 backdrop-blur-md
          border-b border-gray-200
          flex items-center justify-between
          px-4 sm:px-8 lg:px-14
        "
      >
        {/* Logo */}
        <div className="flex items-center gap-4 min-w-0">
          <div
            className="
              w-12 h-12 sm:w-14 sm:h-14
              rounded-2xl
              bg-gradient-to-br from-sky-500 to-indigo-500
              flex items-center justify-center
              shadow-lg shrink-0
            "
          >
            <School size={22} className="text-white" />
          </div>

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-gray-800 truncate">
              Aries Polytechnic
            </h1>

            <p className="text-xs sm:text-sm text-gray-500 truncate">
              Leave & Fees Portal
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10">
          <button
            onClick={() => setActivePage("features")}
            className="
              text-[16px]
              text-gray-500
              hover:text-blue-600
              font-medium
              transition-all duration-300
            "
          >
            Features
          </button>

          <button
            onClick={() => setActivePage("about")}
            className="
              text-[16px]
              text-gray-500
              hover:text-blue-600
              font-medium
              transition-all duration-300
            "
          >
            About
          </button>

          <a
  href="https://mail.google.com/mail/?view=cm&fs=1&to=asbri.itsupport@gmail.com"
  target="_blank"
  rel="noopener noreferrer"
  className="
    inline-flex items-center gap-2
    px-4 py-2
    rounded-xl
    bg-blue-50
    text-blue-600
    hover:bg-blue-100
    hover:text-blue-700
    font-medium
    transition-all duration-300
  "
>
  <LifeBuoy size={18} />
  Support
</a>
        </nav>
      </header>

      {/* ================= MAIN SECTION ================= */}
      <main
        className="
          w-full
          h-[calc(100vh-80px)]
          grid lg:grid-cols-2
        "
      >
        {/* ================= LEFT SIDE ================= */}
        <section
          className="
            h-full
            overflow-y-scroll
            flex items-start justify-center
            px-5 sm:px-10 lg:px-16
            py-10
            bg-[#fbfdff]
          "
        >
          {/* ================= HOME ================= */}
          {activePage === "home" && (
            <div className="w-full max-w-2xl mt-10">
              {/* Badge */}
              <div
                className="
                  inline-flex items-center gap-2
                  px-5 py-2
                  rounded-full
                  bg-blue-100
                  border border-blue-200
                  mb-8
                "
              >
                <div className="w-2 h-2 rounded-full bg-sky-500" />

                <span className="text-sm font-medium text-blue-700">
                  Smart Campus Platform v2.0
                </span>
              </div>

              {/* Heading */}
              <h1
                className="
                  text-[42px]
                  sm:text-[60px]
                  lg:text-[74px]
                  font-bold
                  leading-tight
                  text-[#0f172a]
                "
              >
                Smart Campus
              </h1>

              <h2
                className="
                  text-[42px]
                  sm:text-[60px]
                  lg:text-[74px]
                  font-bold
                  leading-tight
                  bg-gradient-to-r from-sky-500 to-indigo-500
                  bg-clip-text text-transparent
                "
              >
                Management
              </h2>

              {/* Description */}
              <p
                className="
                  mt-6
                  text-base sm:text-lg lg:text-xl
                  leading-8 sm:leading-10
                  text-gray-600
                  max-w-2xl
                "
              >
                Integrated leave management, attendance monitoring,
                and semester fee tracking system designed for
                modern educational institutions.
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap gap-4 mt-10">
                <button
                  onClick={() => navigate("/login")}
                  className="
                    flex items-center gap-3
                    px-6 sm:px-8
                    py-3 sm:py-4
                    rounded-2xl
                    bg-gradient-to-r from-sky-500 to-indigo-500
                    text-white
                    text-base sm:text-lg
                    font-semibold
                    shadow-lg
                    hover:scale-105
                    transition-all duration-300
                  "
                >
                  <CalendarCheck size={22} />
                  Leave Management
                </button>

                <button
                  onClick={() => navigate("/login-page")}
                  className="
                    flex items-center gap-3
                    px-6 sm:px-8
                    py-3 sm:py-4
                    rounded-2xl
                    bg-white
                    border border-gray-300
                    text-gray-700
                    text-base sm:text-lg
                    font-semibold
                    hover:border-blue-400
                    hover:text-blue-600
                    hover:scale-105
                    transition-all duration-300
                  "
                >
                  <GraduationCap size={22} />
                  Fees Portal
                </button>
              </div>
            </div>
          )}

          {/* ================= ABOUT ================= */}
          {activePage === "about" && (
            <div className="w-full max-w-4xl mt-6">
              {/* Back */}
              <button
                onClick={() => setActivePage("home")}
                className="
                  inline-flex items-center gap-2
                  px-4 py-2
                  rounded-xl
                  bg-white
                  border border-gray-200
                  shadow-sm
                  text-blue-600
                  font-semibold
                  mb-8
                  hover:bg-blue-50
                  hover:border-blue-300
                  transition-all duration-300
                "
              >
                <ArrowLeft size={18} className="shrink-0" />
                Back
              </button>

              {/* Tag */}
              <div className="flex items-center gap-2 mb-5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />

                <span
                  className="
                    uppercase
                    tracking-[0.25em]
                    text-xs sm:text-sm
                    text-gray-500
                  "
                >
                  About Aries Polytechnic College
                </span>
              </div>

              {/* Heading */}
              <h2
                className="
                  text-3xl
                  sm:text-5xl
                  lg:text-6xl
                  font-bold
                  leading-tight
                  text-[#0f172a]
                  mb-8
                "
              >
                Empowering Education Through Technology
              </h2>

              {/* Description */}
              <p
                className="
                  text-gray-600
                  text-base sm:text-lg lg:text-xl
                  leading-8 sm:leading-10
                  text-justify
                "
              >
Aries Polytechnic College is committed to imparting quality education in the field of Engineering and Technology at the Diploma level. With multiple campuses, the institution focuses on academic excellence, skill development, innovation, and career-oriented training to empower students with technical knowledge and practical experience for a successful future.
              </p>
            </div>
          )}

          {/* ================= FEATURES ================= */}
          {activePage === "features" && (
            <div className="w-full max-w-6xl mt-6">
              {/* Back */}
              <button
                onClick={() => setActivePage("home")}
                className="
                  inline-flex items-center gap-2
                  px-4 py-2
                  rounded-xl
                  bg-white
                  border border-gray-200
                  shadow-sm
                  text-blue-600
                  font-semibold
                  mb-8
                  hover:bg-blue-50
                  hover:border-blue-300
                  transition-all duration-300
                "
              >
                <ArrowLeft size={18} className="shrink-0" />
                Back
              </button>

              {/* Tag */}
              <div className="flex items-center gap-2 mb-5">
                <div className="w-2 h-2 rounded-full bg-sky-500" />

                <span
                  className="
                    uppercase
                    tracking-[0.25em]
                    text-xs sm:text-sm
                    text-gray-500
                  "
                >
                  Platform Features
                </span>
              </div>

              {/* Heading */}
              <h2
                className="
                  text-3xl
                  sm:text-5xl
                  lg:text-6xl
                  font-bold
                  text-[#0f172a]
                  leading-tight
                  mb-6
                "
              >
                Smart Features For Smart Campus
              </h2>

              {/* Description */}
              <p
                className="
                  text-gray-600
                  text-base sm:text-lg lg:text-xl
                  leading-8 sm:leading-10
                  mb-10
                  max-w-4xl
                "
              >
                Streamlined workflows for students, faculty,
                and administrators with integrated leave and
                fee management tools.
              </p>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-10">
                {FEATURES.map((feature) => (
                  <div
                    key={feature.title}
                    className="
                      bg-white
                      border border-gray-200
                      rounded-2xl
                      p-5 sm:p-6
                      shadow-sm
                      hover:shadow-xl
                      transition-all duration-300
                    "
                  >
                    {/* Icon */}
                    <div
                      className="
                        w-12 h-12
                        rounded-xl
                        bg-blue-50
                        flex items-center justify-center
                        mb-4
                      "
                    >
                      {feature.icon}
                    </div>

                    {/* Title */}
                    <h3
                      className="
                        text-lg sm:text-xl
                        font-semibold
                        text-gray-800
                        mb-3
                      "
                    >
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p
                      className="
                        text-gray-600
                        text-sm sm:text-base
                        leading-7
                      "
                    >
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ================= RIGHT SIDE ================= */}
        <section
          className="
            hidden lg:flex
            relative
            items-center justify-center
            bg-[#edf4ff]
            overflow-hidden
            h-full
          "
        >
          {/* Circle Effects */}
          <div className="absolute w-[650px] h-[650px] rounded-full border border-sky-200" />

          <div className="absolute w-[450px] h-[450px] rounded-full border border-indigo-200" />

          <div className="absolute w-[240px] h-[240px] rounded-full border border-blue-100" />

          {/* Badge */}
          <div
            className="
              absolute top-20
              bg-white
              px-8 py-4
              rounded-2xl
              shadow-lg
              border border-gray-100
            "
          >
            <p className="text-gray-500 text-lg font-medium">
              AICTE Approved
            </p>
          </div>

          {/* Main Card */}
          <div
            className="
              w-[270px] h-[270px]
              rounded-[42px]
              bg-white
              shadow-2xl
              flex items-center justify-center
            "
          >
            <div
              className="
                w-[135px] h-[135px]
                rounded-[36px]
                bg-gradient-to-br from-sky-500 to-indigo-500
                flex items-center justify-center
                shadow-xl
              "
            >
              <GraduationCap size={60} className="text-white" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default OpeningPage;