import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Snowflake } from "lucide-react";
import { API_BASE_URL } from "../../config/api";

const SUCCESS_STATUSES = ["transaction successful", "success", "approved"];

export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Processing your payment...");
  const [dotCount, setDotCount] = useState(1);

  const txnId = searchParams.get("txnID");

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!txnId) {
      navigate("/finance/student/fees", { replace: true });
      return;
    }

    const verifyAndRoute = async () => {
      try {
        setMessage("Verifying your payment...");

        const res = await fetch(
          `${API_BASE_URL}/payments/detailsByTransaction?txnId=${txnId}`
        );

        if (!res.ok) throw new Error("Failed to fetch transaction details");

        const txnData = await res.json();

        const isSuccess = SUCCESS_STATUSES.includes(
          (txnData.transactionStatus || "").toLowerCase().trim()
        );

        if (isSuccess) {
          navigate("/student/payment/success", {
            state: { txnData },
            replace: true,
          });
        } else {
          navigate("/student/payment/failure", {
            state: { txnData },
            replace: true,
          });
        }
      } catch {
        navigate("/payment/failure", {
          state: {
            txnData: {
              transactionId: txnId,
              transactionStatus: "Unable to verify payment",
            },
          },
          replace: true,
        });
      }
    };

    const timer = setTimeout(verifyAndRoute, 2000);
    return () => clearTimeout(timer);
  }, [txnId]);

  const dots = ".".repeat(dotCount);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#F8FAFC", fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap');`}</style>

      <div
        className="rounded-3xl shadow-xl w-full max-w-sm overflow-hidden"
        style={{ background: "#fff", border: "1px solid #E2E8F0" }}
      >
        <div
          className="h-1.5 w-full"
          style={{ background: "linear-gradient(90deg,#3D7DFC,#93B4FD)" }}
        />

        <div className="px-8 py-12 flex flex-col items-center text-center gap-6">
          <div className="relative flex items-center justify-center">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ background: "#E9F3FF" }}
            >
              <Snowflake
                size={44}
                style={{ color: "#3D7DFC" }}
                strokeWidth={1.5}
                className="animate-spin"
              />
            </div>
            <div
              className="absolute w-24 h-24 rounded-full animate-ping opacity-20"
              style={{ background: "#3D7DFC" }}
            />
          </div>

          <div>
            <h2
              className="text-xl font-bold mb-2"
              style={{ color: "#0F172A", fontFamily: "'DM Serif Display', serif" }}
            >
              {message}{dots}
            </h2>
            <p className="text-sm" style={{ color: "#64748B" }}>
              Please do not close or refresh this page
            </p>
          </div>

          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ background: "#E9F3FF" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg,#3D7DFC,#93B4FD)",
                animation: "progress 2s ease-in-out forwards",
              }}
            />
          </div>

          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl w-full"
            style={{ background: "#E9F3FF" }}
          >
            <svg
              className="w-4 h-4 flex-shrink-0"
              style={{ color: "#3D7DFC" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <p className="text-xs font-medium" style={{ color: "#3D7DFC" }}>
              Secured by ICICI Bank Payment Gateway
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          0%   { width: 0%; }
          60%  { width: 75%; }
          100% { width: 95%; }
        }
      `}</style>
    </div>
  );
}
