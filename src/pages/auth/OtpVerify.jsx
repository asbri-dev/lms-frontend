import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import "./OtpVerify.css";
import { API_BASE_URL } from "../../config/api";

const OTP_LENGTH = 6;
const RESEND_TIME = 30;

const OtpVerify = () => {
  const navigate = useNavigate();
  const { handleLoginSuccess } = useAuth();

  const inputRefs = useRef([]);
  const timerRef = useRef(null);

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [timeLeft, setTimeLeft] = useState(RESEND_TIME);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    startTimer();
    inputRefs.current[0]?.focus();
    return () => clearInterval(timerRef.current);
  }, []);

  const startTimer = () => {
    clearInterval(timerRef.current);
    setTimeLeft(RESEND_TIME);
    setCanResend(false);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").slice(0, OTP_LENGTH);
    if (!/^\d+$/.test(pasted)) return;

    const digits = pasted.split("");
    const nextOtp = Array(OTP_LENGTH).fill("");
    digits.forEach((d, i) => (nextOtp[i] = d));
    setOtp(nextOtp);

    inputRefs.current[Math.min(digits.length - 1, OTP_LENGTH - 1)]?.focus();
  };

const handleVerifyOtp = async () => {
  if (otp.some((d) => d === "")) {
    setError("Please enter complete OTP");
    return;
  }

  try {
    setLoading(true);
    setError("");

    const enteredOtp = otp.join("");
    const otpToken = sessionStorage.getItem("otpToken");

    if (!otpToken) {
      throw new Error("OTP session expired. Please login again.");
    }

    const response = await fetch(
      `${API_BASE_URL}/verify-otp?enteredOtp=${enteredOtp}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${otpToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Invalid OTP");
    }

    // 🔐 Build dynamic user object
    const userData = {
  employeeId: data.employeeId,
  role: data.role,
  name: data.employeeName,
};

    // Add hierarchy fields only when needed
    if (data.role === "FACULTY" && data.adminId) {
      userData.adminId = data.adminId;
    }

    if (data.role === "ADMIN" && data.superAdminId) {
      userData.superAdminId = data.superAdminId;
    }
    if (data.role === "HEAD" && data.superAdminId) {
      userData.superAdminId = data.superAdminId;
    }

    // ✅ Store in AuthContext
    handleLoginSuccess(otpToken, userData);

    // Clear temp token
    sessionStorage.removeItem("otpToken");

    // 🔁 Role-based redirect (clean switch)
    switch (data.role) {
      case "SUPERADMIN":
        navigate("/superadmin/dashboard");
        break;
      case "ADMIN":
        navigate("/admin/dashboard");
        break;
      case "FACULTY":
        navigate("/faculty/dashboard");
        break;
      case "HEAD":
        navigate("/head/dashboard");
        break;
      default:
        navigate("/unauthorized");
    }

  } catch (err) {
    setError(err.message || "OTP verification failed");
  } finally {
    setLoading(false);
  }

  
};
// ✅ RESEND OTP (OUTSIDE)
const handleResendOtp = async () => {
  try {
    setLoading(true);
    setError("");

    const mobileNumber = sessionStorage.getItem("mobileNumber");

    if (!mobileNumber) {
      setError("Mobile number not found. Please login again.");
      return;
    }

    const response = await fetch(
      `${API_BASE_URL}/resendOtp?mobileNumber=${mobileNumber}`,
      {
        method: "GET", // confirm backend
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to resend OTP");
    }

    // ✅ Reset UI properly
    setOtp(Array(OTP_LENGTH).fill(""));
    startTimer();

  } catch (err) {
    setError(err.message || "Failed to resend OTP");
  } finally {
    setLoading(false);
  }
};
  return (
  <div className="min-h-screen flex items-center justify-center 
                  bg-gradient-to-br from-[#2b3c6b] to-[#3f548f] p-4">

    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8">

      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          OTP Verification
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Enter the 6-digit OTP sent to your registered email
        </p>
      </div>

      {/* OTP Inputs */}
      <div
        className="flex justify-between gap-3 mb-4"
        onPaste={handlePaste}
      >
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onFocus={(e) => e.target.select()}
            className="w-12 h-12 text-center text-lg font-semibold
                       border border-gray-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-[#3f548f]"
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="text-red-600 text-sm text-center mb-4">
          {error}
        </div>
      )}

      {/* Verify Button */}
      <button
        onClick={handleVerifyOtp}
        disabled={loading}
        className="w-full bg-[#2b3c6b] hover:bg-[#3f548f]
                   text-white py-2 rounded-lg font-medium
                   transition duration-200"
      >
        {loading ? "Verifying..." : "Verify OTP"}
      </button>

      {/* Resend */}
     {/* Resend */}
<div className="text-center mt-4 text-sm text-gray-500">
  {canResend ? (
    <button
      onClick={handleResendOtp}
      disabled={loading}
      className="text-[#2b3c6b] hover:underline disabled:opacity-50"
    >
      {loading ? "Sending..." : "Resend OTP"}
    </button>
  ) : (
    <>Resend OTP in {timeLeft}s</>
  )}
</div>

    </div>
  </div>
);
};

export default OtpVerify;
