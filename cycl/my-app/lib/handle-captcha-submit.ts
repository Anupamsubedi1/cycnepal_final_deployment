import { RefObject } from "react";
import ReCAPTCHA from "react-google-recaptcha";

interface SubmitOptions {
  endpoint: string;
  payload: any;
  recaptchaToken: string | null;
  recaptchaRef: RefObject<ReCAPTCHA | null>;
  onSuccess: (data: any) => void;
  onFailure: (error: string) => void;
}

export async function handleCaptchaSubmit({
  endpoint,
  payload,
  recaptchaToken,
  recaptchaRef,
  onSuccess,
  onFailure,
}: SubmitOptions) {
  if (!recaptchaToken) {
    onFailure("Please complete the reCAPTCHA check.");
    return;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, token: recaptchaToken }),
    });

    const data = await response.json();

    if (response.ok && data.success === true) {
      onSuccess(data);
    } else {
      recaptchaRef.current?.reset();
      onFailure(data.error || data.message || "Submission failed.");
    }
  } catch (error) {
    recaptchaRef.current?.reset();
    onFailure("A network error occurred. Please try again later.");
  }
}