import { useNavigate } from "react-router-dom";
import { ClipboardCheck } from "lucide-react";

const OpeningPage = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center 
                    bg-gradient-to-br from-[#2b3c6b] to-[#3f548f] p-6">

      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md text-center">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full 
                          bg-gradient-to-br from-[#2b3c6b] to-[#3f548f]
                          flex items-center justify-center text-white shadow-lg">
            <ClipboardCheck size={32} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Leave Management System
        </h1>

        {/* Subtitle */}
        <p className="text-gray-500 mb-8">
          Manage employee leave, attendance and approvals efficiently
        </p>

        {/* Button */}
        <button
          onClick={handleLoginClick}
          className="w-full bg-[#2b3c6b] hover:bg-[#3f548f]
                     text-white font-semibold py-3 rounded-lg
                     transition duration-300 shadow-md"
        >
          Go to Login
        </button>

      </div>

    </div>
  );
};

export default OpeningPage;