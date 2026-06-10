"use client";

import { FormEvent, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useLoadingBar } from "@/components/LoadingBar";

type Step = "password" | "mfa";
type MfaMode = "app" | "backup" | "reset";

export default function AdminLoginForm() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const loadingBar = useLoadingBar();
  const locale = (params.locale as string) || "en";
  // Only honour same-origin relative paths to prevent open-redirect via ?next=.
  // Rejects absolute URLs, protocol-relative ("//evil.com") and backslash tricks.
  const rawNext = searchParams.get("next");
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.startsWith("/\\")
      ? rawNext
      : `/${locale}/admin/dahboard`;

  const [step, setStep] = useState<Step>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Second-factor state.
  const [challenge, setChallenge] = useState("");
  const [mfaMode, setMfaMode] = useState<MfaMode>("app");
  const [mfaValue, setMfaValue] = useState("");
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaLoading, setMfaLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    loadingBar.start();

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const json = (await response.json().catch(() => null)) as
      | { message?: string; mfaRequired?: boolean; challenge?: string }
      | null;

    if (!response.ok) {
      setError(json?.message || "Login failed.");
      setLoading(false);
      loadingBar.complete();
      return;
    }

    // Password OK but this admin has 2FA on — move to the code step.
    if (json?.mfaRequired && json.challenge) {
      setChallenge(json.challenge);
      setStep("mfa");
      setMfaMode("app");
      setMfaValue("");
      setMfaError(null);
      setLoading(false);
      loadingBar.complete();
      return;
    }

    router.push(next);
    router.refresh();
  }

  async function onSubmitMfa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMfaError(null);
    setMfaLoading(true);
    loadingBar.start();

    const payload: Record<string, string> = { challenge };
    if (mfaMode === "app") payload.code = mfaValue;
    else if (mfaMode === "backup") payload.backupCode = mfaValue;
    else payload.resetCode = mfaValue;

    const response = await fetch("/api/admin/login/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = (await response.json().catch(() => null)) as
      | { message?: string; twoFactorReset?: boolean }
      | null;

    if (!response.ok) {
      setMfaError(json?.message || "Verification failed.");
      setMfaLoading(false);
      loadingBar.complete();
      return;
    }

    // A reset turned 2FA off — send them to Security to enroll a new device.
    if (json?.twoFactorReset) {
      router.push(`/${locale}/admin/security`);
    } else {
      router.push(next);
    }
    router.refresh();
  }

  if (step === "mfa") {
    const modeCopy: Record<MfaMode, { label: string; placeholder: string; hint: string; button: string }> = {
      app: {
        label: "Authentication code",
        placeholder: "123456",
        hint: "Open your authenticator app and enter the current 6-digit code.",
        button: "Verify",
      },
      backup: {
        label: "Backup code",
        placeholder: "xxxx-xxxx-xx",
        hint: "Enter one of the one-time backup codes you saved. Each works once.",
        button: "Verify",
      },
      reset: {
        label: "Recovery code",
        placeholder: "Recovery code from .env.local",
        hint: "This resets two-factor auth so you can enroll a new authenticator app. You'll set it up again after signing in.",
        button: "Reset & continue",
      },
    };
    const copy = modeCopy[mfaMode];

    return (
      <form onSubmit={onSubmitMfa} className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Two-step verification</h1>
        <p className="mt-2 text-sm text-zinc-600">{copy.hint}</p>

        <label className="mt-6 block text-sm font-medium text-zinc-800" htmlFor="mfa">
          {copy.label}
        </label>
        <input
          id="mfa"
          type="text"
          inputMode={mfaMode === "app" ? "numeric" : "text"}
          autoComplete="one-time-code"
          value={mfaValue}
          onChange={(event) => setMfaValue(event.target.value)}
          placeholder={copy.placeholder}
          className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-0 focus:border-zinc-500"
          autoFocus
          required
        />

        {mfaError ? <p className="mt-4 text-sm text-red-600">{mfaError}</p> : null}

        <button
          type="submit"
          disabled={mfaLoading}
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {mfaLoading ? "Verifying..." : copy.button}
        </button>

        <div className="mt-5 space-y-2 text-center text-sm">
          {mfaMode !== "app" && (
            <button
              type="button"
              onClick={() => { setMfaMode("app"); setMfaValue(""); setMfaError(null); }}
              className="block w-full text-zinc-600 hover:text-zinc-900"
            >
              Use authenticator app code
            </button>
          )}
          {mfaMode !== "backup" && (
            <button
              type="button"
              onClick={() => { setMfaMode("backup"); setMfaValue(""); setMfaError(null); }}
              className="block w-full text-zinc-600 hover:text-zinc-900"
            >
              Use a backup code
            </button>
          )}
          {mfaMode !== "reset" && (
            <button
              type="button"
              onClick={() => { setMfaMode("reset"); setMfaValue(""); setMfaError(null); }}
              className="block w-full text-zinc-600 hover:text-zinc-900"
            >
              Lost your device? Reset with recovery code
            </button>
          )}
          <button
            type="button"
            onClick={() => { setStep("password"); setPassword(""); setMfaValue(""); setMfaError(null); }}
            className="block w-full pt-1 text-zinc-400 hover:text-zinc-700"
          >
            ← Back to login
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-zinc-900">Admin Login</h1>
      <p className="mt-2 text-sm text-zinc-600">Sign in to access protected admin pages.</p>

      <label className="mt-6 block text-sm font-medium text-zinc-800" htmlFor="email">
        Email
      </label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-0 focus:border-zinc-500"
        autoComplete="email"
        required
      />

      <label className="mt-4 block text-sm font-medium text-zinc-800" htmlFor="password">
        Password
      </label>
      <div className="relative mt-2">
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 pr-10 text-zinc-900 outline-none ring-0 focus:border-zinc-500"
          autoComplete="current-password"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          tabIndex={-1}
        >
          {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
