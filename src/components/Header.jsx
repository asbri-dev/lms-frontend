import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import ProfileDetails from "../components/profile/ProfileDetails";
import { API_BASE_URL } from "../config/api";
import { Menu } from "lucide-react";
import { moduleConfig } from "../utils/moduleConfig";


const Header = ({ onMenuClick }) => {
  const { user, token } = useAuth();

  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const name = user?.name || user?.studentName || "User";
  const empId = user?.employeeId || "";
  const role = user?.role || "";
  const avatarLetter = user?.name?.charAt(0)?.toUpperCase() || "U";
  const currentModule = moduleConfig[user?.role];

  /* ── Fetch profile ── */
  const fetchProfile = async () => {
    if (!empId) return;

    if (profileData) {
      setShowProfile(true);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setShowProfile(true);

      const response = await fetch(
        `${API_BASE_URL}/faculty/getAllFacultyDetails?empId=${empId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (response.status >= 500) {
        setError("Server error. Please try again later.");
        return;
      }

      if (!response.ok) {
        setError(data?.message || "Failed to load profile.");
        return;
      }

      const structured = {};
      if (Array.isArray(data)) {
        data.forEach((item) => Object.assign(structured, item));
      }

      setProfileData(structured);
    } catch {
      setError("Network error. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Header ── */}
      <header className="w-full bg-white shadow-sm px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">

        {/* Left: hamburger (mobile) + title */}
        <div className="flex items-center gap-3">

          {/* Hamburger — mobile only */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <h2 className="text-base md:text-xl font-semibold text-gray-800">
            {currentModule?.title}
          </h2>
        </div>

        {/* Right: avatar + user info */}
        <div className="flex items-center gap-3 md:gap-6">

          {/* User details — hidden on small screens */}
          <div className="hidden sm:flex flex-col text-sm text-right">
            <span className="font-medium text-gray-800">
              {role === "HEAD" ? "Aries Admin" : name}
            </span>
            <span className="text-gray-500 text-xs">
              {role} • {empId}
            </span>
          </div>

          {/* Avatar */}
          <div
            onClick={fetchProfile}
            className="w-9 h-9 md:w-10 md:h-10 rounded-full
                       bg-gradient-to-br from-[#2b3c6b] to-[#3f548f]
                       flex items-center justify-center
                       text-white font-semibold text-sm
                       cursor-pointer hover:scale-105
                       hover:shadow-md transition duration-200 flex-shrink-0"
          >
            {avatarLetter}
          </div>

        </div>
      </header>

      {/* ── Profile Modal ── */}
      {showProfile && role === "FACULTY" && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">

          {/* 
            Mobile: full screen
            Desktop: max-w-6xl centered modal
          */}
          <div className="
            bg-white w-full relative
            h-full sm:h-auto
            sm:max-w-6xl sm:rounded-2xl sm:shadow-2xl
            sm:mx-4 sm:max-h-[90vh]
            overflow-y-auto
          ">

            {/* Modal header */}
            <div className="
              flex justify-between items-center
              border-b px-4 md:px-6 py-4
              sticky top-0 bg-white z-10
            ">
              <h3 className="text-base md:text-lg font-semibold text-gray-800">
                Employee Profile
              </h3>
              <button
                onClick={() => setShowProfile(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div className="p-4 md:p-6">

              {loading && (
                <div className="text-center py-12 text-gray-500">
                  Loading profile...
                </div>
              )}

              {error && (
                <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {profileData && !loading && !error && (
                <ProfileDetails profileData={profileData} />
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
