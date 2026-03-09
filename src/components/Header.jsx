import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import ProfileDetails from "../components/profile/ProfileDetails";

const Header = () => {
  const { user, token } = useAuth();

  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const name = user?.name || "User";
  const empId = user?.employeeId || "";
  const role = user?.role || "";
  const avatarLetter = user?.name?.charAt(0)?.toUpperCase() || "U";

  /* ================= FETCH PROFILE ================= */
  const fetchProfile = async () => {
    if (!empId) return;

    // If profile already loaded, just open modal
    if (profileData) {
      setShowProfile(true);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setShowProfile(true);

      const response = await fetch(
        `http://localhost:9090/faculty/getAllFacultyDetails?empId=${empId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // future backend security
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

      /* Convert array → structured object */
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
      {/* ================= HEADER ================= */}
      <header className="w-full bg-white shadow-sm px-6 py-4 flex justify-between items-center">

        <h2 className="text-xl font-semibold text-gray-800">
          Leave Management System
        </h2>

        <div className="flex items-center gap-6">

          {/* Avatar */}
          <div
            onClick={fetchProfile}
            className="w-10 h-10 rounded-full 
                       bg-gradient-to-br from-[#2b3c6b] to-[#3f548f]
                       flex items-center justify-center 
                       text-white font-semibold text-sm
                       cursor-pointer hover:scale-105 
                       hover:shadow-md transition duration-200"
          >
            {avatarLetter}
          </div>

          {/* User Details */}
          <div className="hidden sm:flex flex-col text-sm">
            <span className="font-medium text-gray-800">
              {name}
            </span>
            <span className="text-gray-500 text-xs">
              {role} • {empId}
            </span>
          </div>

        </div>
      </header>

      {/* ================= PROFILE MODAL ================= */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl p-6 relative">

            {/* Close Button */}
            <div className="flex justify-between items-center border-b pb-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800">
                Employee Profile
              </h3>

              <button
                onClick={() => setShowProfile(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            {/* Loading */}
            {loading && (
              <div className="text-center py-6 text-gray-500">
                Loading profile...
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {/* Profile Content */}
            {profileData && !loading && !error && (
              <ProfileDetails profileData={profileData} />
            )}

          </div>

        </div>
      )}
    </>
  );
};

export default Header;