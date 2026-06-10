"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function KhaltiCallbackPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const pidx = searchParams.get("pidx");
    const khaltiStatus = searchParams.get("status");
    const applicationId = searchParams.get("applicationId");
    const returnTo = searchParams.get("return_to") || "/";

    const finalize = async () => {
      if (khaltiStatus === "User canceled") {
        setStatus("error");
        setMessage("Payment was canceled. Redirecting...");
        setTimeout(() => window.location.replace(returnTo), 2000);
        return;
      }

      if (!pidx || !applicationId) {
        setStatus("error");
        setMessage("Missing payment information. Redirecting...");
        setTimeout(() => window.location.replace(returnTo), 2000);
        return;
      }

      setMessage("Verifying your payment with Khalti...");

      try {
        const res = await fetch("/api/khalti/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pidx, applicationId }),
          signal: AbortSignal.timeout(15000),
        });

        const data = await res.json();

        if (!res.ok || !data.verified) {
          setStatus("error");
          setMessage(data.message || data.error || "Payment verification failed. Redirecting...");
          setTimeout(() => window.location.replace(returnTo), 3000);
          return;
        }

        setStatus("success");
        setMessage("Payment completed successfully! Redirecting to your applications...");
        setTimeout(() => window.location.replace(returnTo), 2000);
      } catch (err: any) {
        console.error("Khalti callback error:", err);
        setStatus("error");
        setMessage(err.message || "An error occurred during payment verification.");
        setTimeout(() => window.location.replace(returnTo), 3000);
      }
    };

    void finalize();
  }, [searchParams]);

  const returnTo = searchParams.get("return_to") || "/";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] p-6">
      <div className="w-full max-w-lg rounded-xl border-2 bg-white p-8 text-center shadow-lg">
        {status === "processing" && (
          <>
            <div className="mb-4 flex justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#ddd6fe] border-t-[#5b21b6]"></div>
            </div>
            <h1 className="text-2xl font-semibold text-[#5b21b6]">Processing Payment...</h1>
            <p className="mt-2 text-sm text-[#6d28d9]">Verifying your payment with Khalti</p>
            {message && <p className="mt-3 text-xs text-slate-500">{message}</p>}
          </>
        )}

        {status === "success" && (
          <>
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <svg className="h-8 w-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-green-600">Payment Complete!</h1>
            <p className="mt-2 text-sm text-slate-600">{message}</p>
            <button
              onClick={() => window.location.replace(returnTo)}
              className="mt-6 rounded-full bg-green-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-green-700"
            >
              Continue
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-red-100 p-3">
                <svg className="h-8 w-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-red-600">Payment Issue</h1>
            <p className="mt-2 text-sm text-slate-600">{message}</p>
            <button
              onClick={() => window.location.replace(returnTo)}
              className="mt-6 rounded-full bg-slate-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Return
            </button>
          </>
        )}
      </div>
    </div>
  );
}
