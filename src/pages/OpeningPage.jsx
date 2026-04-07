import { useNavigate } from "react-router-dom";
import { ClipboardCheck } from "lucide-react";

const OpeningPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#2b3c6b] to-[#3f548f]">

      {/* 🔵 Background Glow Effects */}
      <div className="absolute w-72 h-72 bg-blue-400/20 blur-3xl rounded-full top-10 left-10"></div>
      <div className="absolute w-96 h-96 bg-indigo-500/20 blur-3xl rounded-full bottom-10 right-10"></div>

      {/* 🌟 Card */}
      <div className="relative bg-white/90 backdrop-blur-xl 
                      rounded-3xl shadow-2xl p-10 w-full max-w-md text-center 
                      border border-white/30">

        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full 
                        bg-gradient-to-br from-[#2b3c6b] to-[#3f548f]
                        flex items-center justify-center shadow-lg">
          <ClipboardCheck size={28} className="text-white" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Leave Management
        </h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          System
        </h2>

        {/* Subtitle */}
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Manage employee leave, attendance and approvals with ease and efficiency.
        </p>

        {/* Button */}
        <button
          onClick={() => navigate("/login")}
          className="w-full py-3 rounded-xl 
                     bg-gradient-to-r from-[#2b3c6b] to-[#3f548f] 
                     text-white font-semibold 
                     shadow-md hover:shadow-lg 
                     hover:scale-[1.02] active:scale-95 
                     transition duration-200"
        >
          Go to Login →
        </button>

      </div>
    </div>
  );
};

export default OpeningPage;