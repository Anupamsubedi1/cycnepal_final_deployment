"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface PaymentStepProps {
  formData: any;
  onUpdate: (section: string, data: any) => void;
  onPaymentVerified?: (payment: any) => void;
  vacancyId: string;
}

interface EsewaInitiateResponse {
  formUrl: string;
  payload: Record<string, string>;
}

export default function PaymentStep({
  formData,
  onUpdate,
  onPaymentVerified,
  vacancyId,
}: PaymentStepProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const paymentData = formData.payment || {};

  const amount = useMemo(() => {
    const fromPayment = Number(paymentData.amount || 0);
    if (Number.isFinite(fromPayment) && fromPayment > 0) {
      return fromPayment;
    }
    return Number.parseFloat(process.env.NEXT_PUBLIC_ESEWA_DEFAULT_AMOUNT || "100");
  }, [paymentData.amount]);

  const verifyPayment = useCallback(
    async (encodedData: string) => {
      setLoading(true);
      setMessage("");

      try {
        const response = await fetch("/api/esewa/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ data: encodedData }),
        });

        const data = await response.json();
        if (!response.ok || !data.verified) {
          setMessage(data.error || data.message || "Payment verification failed.");
          onUpdate("payment", {
            ...paymentData,
            verified: false,
            status: data.status || "FAILED",
          });
          return;
        }

        const verifiedPayment = {
          verified: true,
          status: "COMPLETE",
          amount: data.totalAmount || amount,
          transactionUuid: data.transactionUuid,
          transactionCode: data.transactionCode,
          refId: data.refId,
          verifiedAt: new Date().toISOString(),
        };

        onUpdate("payment", verifiedPayment);
        onPaymentVerified?.(verifiedPayment);
        setMessage("Payment successful and verified. You can proceed to final submission.");
      } catch (error) {
        console.error("Payment verification failed:", error);
        setMessage("Payment verification failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [amount, onPaymentVerified, onUpdate, paymentData],
  );

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const outcome = query.get("outcome") || "";
    const encodedData = query.get("data") || "";

    if (outcome === "success" && encodedData) {
      void verifyPayment(encodedData);
    }
  }, [verifyPayment]);

  const openEsewaPayment = async () => {
    setLoading(true);
    setMessage("");

    try {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      const response = await fetch("/api/esewa/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vacancyId,
          amount,
          returnTo,
        }),
      });

      const data = (await response.json()) as EsewaInitiateResponse;
      if (!response.ok || !data.payload || !data.formUrl) {
        setMessage("Could not initiate eSewa payment.");
        return;
      }

      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.formUrl;
      form.target = "_self";

      Object.entries(data.payload).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      form.remove();

      onUpdate("payment", {
        ...paymentData,
        amount,
        verified: false,
        status: "PENDING",
      });
      setMessage("eSewa window opened. Complete payment there.");
    } catch (error) {
      console.error("Failed to start eSewa payment:", error);
      setMessage("Failed to start payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#123451]">भुक्तानी</h2>

      <div className="rounded-lg border border-[#d6e6ed] bg-[#f8fcfd] p-6">
        <p className="text-sm text-gray-700">Application fee</p>
        <p className="mt-1 text-3xl font-bold text-[#0d837f]">NPR {amount.toFixed(2)}</p>

        <div className="mt-5 rounded border border-[#cde3e8] bg-white p-4 text-sm text-gray-700">
          <p>Payment provider: eSewa</p>
          <p className="mt-1">You can proceed to final submission only after successful payment verification.</p>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            type="button"
            onClick={openEsewaPayment}
            disabled={loading}
            className={`rounded px-6 py-2 font-medium text-white transition ${
              loading ? "bg-gray-400" : "bg-[#60bb46] hover:bg-[#4da838]"
            }`}
          >
            {loading ? "Processing..." : "Pay with eSewa"}
          </button>

          {paymentData.verified && (
            <span className="rounded bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
              Verified
            </span>
          )}
        </div>

        {message && (
          <p className="mt-4 text-sm text-[#0a4f4b]">{message}</p>
        )}
      </div>
    </div>
  );
}
