import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
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
  employeeId: data.employeeId|| null,
  role: data.role,
  name: data.employeeName|| null,
  admissionNumber: data.admissionNum|| null,
  studentName: data.studentName || null,
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
      case "STUDENT":
        navigate("/student/dashboard");
        break;
      case "FHADMIN":
        navigate("/headadmin/dashboard");
        break;
      case "FADMIN":
        navigate("/fadmin/dashboard");
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
  <div
    className="min-h-screen flex items-center justify-center p-4"
    style={{ background: "#1a2a52" }}
  >
    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 relative overflow-hidden">

      {/* Decorative circles */}
      <div className="absolute rounded-full pointer-events-none"
        style={{ width: 120, height: 120, top: -48, right: -48, background: "#e8edf7" }} />
      <div className="absolute rounded-full pointer-events-none"
        style={{ width: 80, height: 80, bottom: -32, left: -32, background: "#f0f3fb" }} />

      {/* Header */}
      <div className="text-center mb-6 relative z-10">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "#e8edf7" }}>
          <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
            <rect x="5" y="11" width="14" height="10" rx="2"
              stroke="#2b3c6b" strokeWidth="1.8" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4"
              stroke="#2b3c6b" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1.2" fill="#2b3c6b" />
          </svg>
        </div>
        <h2 className="text-xl font-medium" style={{ color: "#1a2a52" }}>
          OTP Verification
        </h2>
        <p className="text-sm mt-1" style={{ color: "#7a8db5" }}>
          Enter the 6-digit OTP sent to your registered email
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full rounded-full mb-6 relative z-10"
        style={{ height: 3, background: "#e8edf7" }}>
        <div className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${(timeLeft / 30) * 100}%`,
            background: "linear-gradient(to right, #2b3c6b, #3f548f)",
          }} />
      </div>

      {/* OTP Inputs */}
      <div className="flex items-center justify-center gap-2 mb-5 relative z-10"
        onPaste={handlePaste}>
        {[0, 1, 2].map((index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={otp[index]}
            onChange={(e) => handleChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onFocus={(e) => e.target.select()}
            className="text-center font-medium outline-none transition-all duration-150"
            style={{
              width: 52, height: 58, borderRadius: 12, fontSize: 22,
              color: "#1a2a52",
              border: otp[index] ? "1.5px solid #3f548f" : "1.5px solid #c5d0e8",
              background: otp[index] ? "#eef1fa" : "#f5f7fc",
            }}
          />
        ))}

        {/* Centre divider */}
        <div style={{ width: 10, height: 2, background: "#c5d0e8", flexShrink: 0 }} />

        {[3, 4, 5].map((index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={otp[index]}
            onChange={(e) => handleChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onFocus={(e) => e.target.select()}
            className="text-center font-medium outline-none transition-all duration-150"
            style={{
              width: 52, height: 58, borderRadius: 12, fontSize: 22,
              color: "#1a2a52",
              border: otp[index] ? "1.5px solid #3f548f" : "1.5px solid #c5d0e8",
              background: otp[index] ? "#eef1fa" : "#f5f7fc",
            }}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-center mb-4 py-2 px-3 rounded-lg relative z-10"
          style={{ color: "#c0392b", background: "#fdf0ef" }}>
          {error}
        </div>
      )}

      {/* Verify Button */}
      <button
        onClick={handleVerifyOtp}
        disabled={loading}
        className="w-full py-3 rounded-xl font-medium text-white transition-all duration-150 relative z-10"
        style={{
          background: "#2b3c6b",
          opacity: loading ? 0.8 : 1,
          fontSize: 15,
        }}
      >
        {loading ? "Verifying..." : "Verify OTP"}
      </button>

      {/* Resend */}
      <div className="text-center mt-4 text-sm relative z-10" style={{ color: "#9aabcc" }}>
        {canResend ? (
          <button
            onClick={handleResendOtp}
            disabled={loading}
            className="font-medium hover:underline disabled:opacity-50"
            style={{ color: "#2b3c6b", background: "none", border: "none",
              cursor: "pointer", fontSize: 13, padding: 0 }}
          >
            {loading ? "Sending..." : "Resend OTP"}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: "#eef1fa", color: "#3f548f" }}>
            Resend in {timeLeft}s
          </span>
        )}
      </div>

    </div>
  </div>
);
};

export default OtpVerify;
