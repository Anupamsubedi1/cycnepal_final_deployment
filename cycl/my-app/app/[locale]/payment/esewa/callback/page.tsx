"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function EsewaCallbackPage() {
  const searchParams = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState<string>("");

  const returnTo = useMemo(() => {
    const rawReturnTo = searchParams.get("return_to") || "/";
    return rawReturnTo.split("?data=")[0] || "/";
  }, [searchParams]);

  useEffect(() => {
    function extractNestedData(value: string): string {
      const queryIndex = value.indexOf("?data=");
      if (queryIndex === -1) {
        return "";
      }
      return value.slice(queryIndex + 6);
    }

    const rawReturnTo = searchParams.get("return_to") || "/";

    // Extract applicationId from returnTo query string
    const queryString = returnTo.includes("?") ? returnTo.split("?")[1] : "";
    const returnToSearch = new URLSearchParams(queryString);
    const applicationId = returnToSearch.get("applicationId");

    if (typeof window !== "undefined") {
      const outcome = searchParams.get("outcome") || "failure";
      const directData = searchParams.get("data") || "";
      const nestedData = extractNestedData(rawReturnTo);
      const encodedData = directData || nestedData;

      const finalize = async () => {
        if (outcome !== "success") {
          setPaymentStatus("error");
          setMessage("Payment was not successful. Redirecting...");
            setTimeout(() => {
            window.location.replace(returnTo || "/");
          }, 2000);
          return;
        }

        if (!applicationId) {
          setPaymentStatus("error");
          setMessage("Application ID missing. Cannot process payment. Redirecting...");
            setTimeout(() => {
            window.location.replace(returnTo || "/");
          }, 2000);
          return;
        }

        if (!encodedData) {
          setPaymentStatus("error");
          setMessage("No payment data received. Redirecting...");
          setTimeout(() => {
            window.location.replace(returnTo || "/");
          }, 2000);
          return;
        }

        setMessage("Verifying payment...");

        try {
          // Verify payment with our backend
          const response = await fetch("/api/esewa/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ data: encodedData }),
            signal: AbortSignal.timeout(10000), // 10s timeout
          });

          const verificationData = await response.json();

          if (!response.ok || !verificationData.verified) {
            setPaymentStatus("error");
            setMessage(verificationData.error || verificationData.message || "Payment verification failed.");
            setTimeout(() => {
              window.location.replace(returnTo);
            }, 3000);
            return;
          }

          // Payment verified, now record it. We forward the original signed
          // eSewa `data` blob so the server can independently re-verify the
          // signature and status (never trusting client-supplied status/amount).
          const updateResponse = await fetch(`/api/user/applications/${applicationId}/payment-verify`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ data: encodedData }),
          });

          if (!updateResponse.ok) {
            const errData = await updateResponse.json().catch(() => ({}));
            throw new Error(errData.error || "Failed to update payment status");
          }

          setPaymentStatus("success");
          setMessage("Payment completed successfully! Redirecting to your applications...");
          setTimeout(() => {
            window.location.replace(returnTo);
          }, 2000);
        } catch (error: any) {
          console.error("Payment processing error:", error);
          setPaymentStatus("error");
          setMessage(error.message || "An error occurred during payment processing.");
          setTimeout(() => {
            window.location.replace(returnTo);
          }, 3000);
        }
      };

       void finalize();
     }
   }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f3f7f8] to-[#e8f1f3] p-6">
      <div className="w-full max-w-lg rounded-xl border-2 bg-white p-8 text-center shadow-lg">
        {paymentStatus === "processing" && (
          <>
            <div className="mb-4 flex justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#c6dde1] border-t-[#0a5558]"></div>
            </div>
            <h1 className="text-2xl font-semibold text-[#0a5558]">Processing Payment...</h1>
            <p className="mt-2 text-sm text-[#2b4f52]">Verifying your payment with eSewa</p>
            <p className="mt-4 text-xs text-[#6b8b8e]">Please wait, redirecting in a moment...</p>
          </>
        )}

        {paymentStatus === "success" && (
          <>
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <svg className="h-8 w-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-green-600">✓ Payment Complete!</h1>
            <p className="mt-2 text-sm text-[#2b4f52]">{message}</p>
            <p className="mt-4 text-xs text-[#6b8b8e]">Redirecting to your applications...</p>
            <button
              onClick={() => window.location.replace(returnTo)}
              className="mt-6 rounded bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
            >
              Continue
            </button>
          </>
        )}

        {paymentStatus === "error" && (
          <>
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-red-100 p-3">
                <svg className="h-8 w-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-red-600">Payment Issue</h1>
            <p className="mt-2 text-sm text-[#2b4f52]">{message}</p>
            <p className="mt-4 text-xs text-[#6b8b8e]">Returning to your applications...</p>
            <button
              onClick={() => window.location.replace(returnTo)}
              className="mt-6 rounded bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
            >
              Return
            </button>
          </>
        )}
      </div>
    </div>
  );
}
