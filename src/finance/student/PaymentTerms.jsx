import React, { useState,} from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LockKeyhole, FileText, ShieldCheck } from "lucide-react";


const PaymentTerms = ({ onProceed, onBack }) => {
  const [accepted, setAccepted] = useState(false);
  const navigate = useNavigate();

  const handleProceed = () => {
    
    if (!accepted) return;
     navigate("/student/make-payment"); // Navigate to the MakePayment page
    // Your ICICI payment API / payment gateway call
    onProceed?.();
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="bg-[#28417B] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              Online Fee Payment
            </h1>
            <p className="mt-1 text-sm text-blue-100 md:text-base">
              Secure&nbsp; • &nbsp;Simple&nbsp; • &nbsp;Convenient
            </p>
          </div>

          <div className="hidden text-right sm:block">
            <div className="text-2xl">🎓</div>
            <p className="text-sm font-medium">
              For a Brighter Tomorrow
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="p-5 md:p-8">

            {/* Terms and Conditions */}
            <section>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <FileText className="h-6 w-6 text-[#28417B]" />
                </div>

                <h2 className="text-xl font-bold text-[#28417B] md:text-2xl">
                  Terms and Conditions
                </h2>
              </div>

              <ul className="space-y-3 pl-5 text-sm leading-6 text-slate-700 md:text-base">
                <li className="relative pl-3">
                  <span className="absolute -left-4 top-2 h-2 w-2 rounded-full bg-blue-600" />

                  If the payment is successful, you will get a payment
                  confirmation email and Payment Invoice is generated, download the invoice for your reference. You can also check the payment status in the "Fee Page" section of your student dashboard.
                </li>
                 <li className="relative pl-3">
                  <span className="absolute -left-4 top-2 h-2 w-2 rounded-full bg-blue-600" />

              Please make a note of the Reference/Transaction ID for your records in case of a successful payment.
.
                </li>

                <li className="relative pl-3">
                  <span className="absolute -left-4 top-2 h-2 w-2 rounded-full bg-blue-600" />

                  If the transaction has failed for some reasons, you are
                  requested to wait for three working days before trying
                  for payment again. Please contact the accounts department
                  for any discrepancy of online fee faced by you with
                  reference to any of your transaction.
                </li>

 
              </ul>
            </section>

            <div className="my-7 border-t border-slate-200" />

            {/* Privacy Policy */}
            <section>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <ShieldCheck className="h-6 w-6 text-[#28417B]" />
                </div>

                <h2 className="text-xl font-bold text-[#28417B] md:text-2xl">
                  Privacy Policy
                </h2>
              </div>

              <p className="text-sm leading-7 text-slate-700 md:text-base">
                All data shall be kept secure, and shall not be revealed to
                anyone or utilized for any other purpose. The data provided
                shall be used in connection with online payments.
              </p>
            </section>

            <div className="my-7 border-t border-slate-200" />

            {/* Cancellation / Refund Policy */}
            <section>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                  <span className="text-2xl text-orange-500">↻</span>
                </div>

                <h2 className="text-xl font-bold text-[#28417B] md:text-2xl">
                  Cancellation/Refund Policy
                </h2>
              </div>

              <p className="text-sm leading-7 text-slate-700 md:text-base">
                There is no cancellation option for the students / parents.
                In case of duplicate payment, the end user can approach the
                accounts department in the college for clarification or
                with proof of the transaction. Based on submission
                of proof of transaction, it shall be verified .
              </p>
            </section>

            <div className="my-7 border-t border-slate-200" />

            {/* Declaration */}
            <section>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <FileText className="h-6 w-6 text-[#28417B]" />
                </div>

                <h2 className="text-xl font-bold text-[#28417B] md:text-2xl">
                  Declaration
                </h2>
              </div>

              <p className="text-sm leading-7 text-slate-700 md:text-base">
                I fully read and understand the above policy in connection
                with online payment of fees to the college. I shall abide
                by the terms and conditions in force or modified from time
                to time pertaining to the online payment to the Institution.
              </p>
            </section>

            {/* Agreement Checkbox */}
            <div
              className={`mt-7 rounded-lg border p-4 transition-all md:p-5 ${
                accepted
                  ? "border-blue-300 bg-blue-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <label className="flex cursor-pointer items-start gap-3">

                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-[#28417B]"
                />

                <span className="text-sm font-medium leading-6 text-slate-700 md:text-base">
                  I have read and understood the Terms and Conditions. I agree
                  to proceed with the online fee payment.
                </span>

              </label>
            </div>

          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8">

            {/* Back */}
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>

            {/* Proceed */}
            <button
              type="button"
              disabled={!accepted}
              onClick={handleProceed}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-7 py-3 font-semibold text-white transition-all ${
                accepted
                  ? "bg-[#28417B] shadow-md hover:bg-[#1f3363] hover:shadow-lg"
                  : "cursor-not-allowed bg-slate-400"
              }`}
            >
              <LockKeyhole className="h-5 w-5" />
              Proceed to Payment
            </button>

          </div>
        </div>

        {/* Security Note */}
        <p className="mt-5 text-center text-xs text-slate-500">
          🔒 Your payment information is securely processed through the
          authorized payment gateway.
        </p>

      </main>
    </div>
  );
};

export default PaymentTerms;