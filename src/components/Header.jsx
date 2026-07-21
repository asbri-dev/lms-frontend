import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import ProfileDetails from "../components/profile/ProfileDetails";
import { API_BASE_URL } from "../config/api";
import { Menu } from "lucide-react";
import { moduleConfig } from "../utils/moduleConfig";
import downloadImage from "../assets/download.png";
import { useNavigate } from "react-router-dom";




const Header = ({ onMenuClick }) => {
  const { user,} = useAuth();

  const [showProfile, setShowProfile] = useState(false);


  const name = user?.name || user?.studentName || "User";
  const empId = user?.employeeId || "";
  const role = user?.role || "";
  const navigate = useNavigate();
 // const avatarLetter = user?.name?.charAt(0)?.toUpperCase() || "U";
  const currentModule = moduleConfig[user?.role];
  const handleProfileClick = () => {
  if (role === "FACULTY") {
    navigate("profile");
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
          
          <img
  onClick={handleProfileClick}
  src={`${API_BASE_URL}/image/${empId}`}
  alt="Profile"
 className={`
  w-10 h-10 rounded-full object-cover
  ${role === "FACULTY"
    ? "cursor-pointer hover:scale-105"
    : "cursor-default"}
`}
  onError={(e) => {
    e.target.src = downloadImage;
  }}
/>

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

           

            
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
