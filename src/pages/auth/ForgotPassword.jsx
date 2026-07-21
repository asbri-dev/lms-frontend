import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [empId, setEmpId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!empId) {
      setError("Employee ID is required");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/resetOrForgotPassword?empId=${empId}`,
        { method: "POST" }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Request failed");
      setSuccess("Password reset request sent successfully");
      setTimeout(() => {
        if(data.portal==="Leave"){
          navigate("/login");
        }
          else if(data.portal==="Fee"){ 
            navigate("/login-page");
          }
          else{
            navigate("/");
          }
        
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#3d7dfc] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background decorative circles */}
      <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full bg-white opacity-5 pointer-events-none" />
      <div className="absolute bottom-[-60px] left-[-60px] w-56 h-56 rounded-full bg-white opacity-5 pointer-events-none" />
      <div className="absolute top-1/2 left-[-120px] w-64 h-64 rounded-full bg-white opacity-[0.04] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">

        {/* Top logo / brand pill */}
        <div className="flex justify-center mb-6">
          <div className="bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-semibold tracking-widest uppercase px-5 py-2 rounded-full">
            ARIES POLYTECHNIC COLLEGE
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Card top accent bar */}
          <div className="h-1.5 w-full bg-[#3d7dfc]" />

          <div className="px-8 pt-8 pb-10">

            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-2xl bg-[#3d7dfc]/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#3d7dfc]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            </div>

            {/* Heading */}
            <div className="text-center mb-7">
              <h2 className="text-2xl font-bold text-slate-800 mb-1 tracking-tight">
                Forgot Password?
              </h2>
              <p className="text-sm text-slate-400">
                Enter your Employee ID or Admission Number and we'll send a reset link.
              </p>
            </div>

            {/* Alerts */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2.5 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-5">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                {success}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Employee ID / Admission Number
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                    disabled={isLoading}
                    placeholder="e.g. EMP-00123"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3d7dfc]/40 focus:border-[#3d7dfc] focus:bg-white transition-all duration-200 disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#3d7dfc] hover:bg-[#2b6be8] active:scale-[0.98] text-white font-semibold text-sm py-3.5 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#3d7dfc]/30"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs text-slate-300">or</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* Back to login */}
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full flex items-center justify-center gap-2 text-sm text-[#3d7dfc] hover:text-[#2b6be8] font-medium transition-colors duration-200 group"
            >
              <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
              Back to Login
            </button>

          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-white/40 text-xs mt-6">
          Contact your administrator if you continue to have trouble.
        </p>

      </div>
    </div>
  );
};

export default ForgotPassword;
