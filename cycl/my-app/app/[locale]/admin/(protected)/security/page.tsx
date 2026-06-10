"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { FiShield, FiKey, FiSmartphone, FiDownload, FiCheck, FiAlertTriangle } from "react-icons/fi";

type Status = {
  enabled: boolean;
  backupCodesRemaining: number;
  resetCodeConfigured: boolean;
};

type Mode = "loading" | "status" | "enroll" | "backup" | "forbidden";

export default function AdminSecurityPage() {
  const [mode, setMode] = useState<Mode>("loading");
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState("");

  // Enrollment state.
  const [qr, setQr] = useState("");
  const [manualKey, setManualKey] = useState("");
  const [enrollCode, setEnrollCode] = useState("");
  const [enrollBusy, setEnrollBusy] = useState(false);

  // Backup codes shown once after enabling.
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Verify form (for "change device" / "disable").
  const [action, setAction] = useState<null | "change" | "disable">(null);
  const [verifyValue, setVerifyValue] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);

  async function loadStatus() {
    setError("");
    const res = await fetch("/api/admin/2fa/status", { cache: "no-store" });
    if (res.status === 403) {
      setMode("forbidden");
      return;
    }
    if (!res.ok) {
      setError("Could not load security status.");
      setMode("status");
      return;
    }
    const data = (await res.json()) as Status;
    setStatus(data);
    setMode("status");
  }

  useEffect(() => {
    // Fetch-on-mount. loadStatus only calls setState after awaiting fetch, so it
    // doesn't synchronously cascade renders.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadStatus();
  }, []);

  async function startSetup() {
    setError("");
    setEnrollCode("");
    setEnrollBusy(true);
    try {
      const res = await fetch("/api/admin/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Could not start setup.");
        return;
      }
      setQr(data.qr);
      setManualKey(data.manualKey);
      setMode("enroll");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setEnrollBusy(false);
    }
  }

  async function confirmEnroll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setEnrollBusy(true);
    try {
      const res = await fetch("/api/admin/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: enrollCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "That code didn't match.");
        return;
      }
      setBackupCodes(Array.isArray(data.backupCodes) ? data.backupCodes : []);
      setMode("backup");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setEnrollBusy(false);
    }
  }

  async function submitVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setVerifyBusy(true);
    try {
      const body = useRecovery ? { resetCode: verifyValue } : { code: verifyValue };
      const res = await fetch("/api/admin/2fa/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Verification failed.");
        return;
      }
      const wasChange = action === "change";
      setAction(null);
      setVerifyValue("");
      setUseRecovery(false);
      if (wasChange) {
        // Reset succeeded — immediately enroll the new authenticator.
        await startSetup();
      } else {
        await loadStatus();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setVerifyBusy(false);
    }
  }

  function downloadBackupCodes() {
    const text =
      "CYC Nepal Admin — two-factor backup codes\n" +
      "Each code can be used once if you lose your authenticator device.\n\n" +
      backupCodes.join("\n") +
      "\n";
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cyc-admin-2fa-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700">
          <FiShield size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Security</h1>
          <p className="text-sm text-zinc-500">Two-factor authentication for your account.</p>
        </div>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <FiAlertTriangle className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {mode === "loading" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">
          Loading…
        </div>
      )}

      {mode === "forbidden" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 shadow-sm">
          Two-factor authentication isn’t available for this account.
        </div>
      )}

      {/* ---- Status view ---- */}
      {mode === "status" && status && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          {status.enabled ? (
            <>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                  <FiCheck /> 2FA is ON
                </span>
                <span className="text-sm text-zinc-500">
                  {status.backupCodesRemaining} backup code{status.backupCodesRemaining === 1 ? "" : "s"} remaining
                </span>
              </div>
              <p className="mt-3 text-sm text-zinc-600">
                Your account asks for a 6-digit code at login. You can switch to a new phone, or turn
                it off.
              </p>

              {action === null ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={() => { setAction("change"); setVerifyValue(""); setUseRecovery(false); setError(""); }}
                    className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
                  >
                    <FiSmartphone /> Change authenticator app
                  </button>
                  <button
                    onClick={() => { setAction("disable"); setVerifyValue(""); setUseRecovery(false); setError(""); }}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                  >
                    Disable 2FA
                  </button>
                </div>
              ) : (
                <form onSubmit={submitVerify} className="mt-5 max-w-sm space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-sm font-medium text-zinc-700">
                    {action === "change" ? "Confirm it's you to change device" : "Confirm it's you to disable 2FA"}
                  </p>
                  <input
                    type="text"
                    value={verifyValue}
                    onChange={(e) => setVerifyValue(e.target.value)}
                    placeholder={useRecovery ? "Recovery code" : "Current 6-digit code"}
                    inputMode={useRecovery ? "text" : "numeric"}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
                    autoFocus
                    required
                  />
                  <label className="flex items-center gap-2 text-xs text-zinc-600">
                    <input type="checkbox" checked={useRecovery} onChange={(e) => setUseRecovery(e.target.checked)} />
                    Use recovery code instead (lost device)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={verifyBusy}
                      className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60"
                    >
                      {verifyBusy ? "Verifying…" : "Continue"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAction(null); setVerifyValue(""); setError(""); }}
                      className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-500 hover:text-zinc-800"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-600">
                2FA is OFF
              </span>
              <p className="mt-3 text-sm text-zinc-600">
                Add a second step to your login using a free authenticator app (Google
                Authenticator, Authy, Microsoft Authenticator). Strongly recommended.
              </p>
              <button
                onClick={startSetup}
                disabled={enrollBusy}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60"
              >
                <FiKey /> {enrollBusy ? "Starting…" : "Enable 2FA"}
              </button>
            </>
          )}
        </div>
      )}

      {/* ---- Enroll view (scan QR + confirm) ---- */}
      {mode === "enroll" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-900">Scan this with your authenticator app</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-zinc-600">
            <li>Open Google Authenticator (or Authy / Microsoft Authenticator).</li>
            <li>Tap “Add” and scan the QR code below.</li>
            <li>Enter the 6-digit code it shows to finish.</li>
          </ol>

          <div className="mt-5 flex flex-col items-center gap-3">
            {qr && (
              <Image src={qr} alt="2FA QR code" width={200} height={200} className="rounded-lg border border-zinc-200" unoptimized />
            )}
            {manualKey && (
              <p className="text-center text-xs text-zinc-500">
                Can’t scan? Enter this key manually:
                <br />
                <span className="mt-1 inline-block rounded bg-zinc-100 px-2 py-1 font-mono text-sm tracking-wider text-zinc-800">
                  {manualKey}
                </span>
              </p>
            )}
          </div>

          <form onSubmit={confirmEnroll} className="mx-auto mt-6 max-w-xs space-y-3">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={enrollCode}
              onChange={(e) => setEnrollCode(e.target.value)}
              placeholder="123456"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-center text-lg tracking-[0.3em] outline-none focus:border-teal-600"
              required
            />
            <button
              type="submit"
              disabled={enrollBusy}
              className="w-full rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60"
            >
              {enrollBusy ? "Verifying…" : "Verify & turn on"}
            </button>
            <button
              type="button"
              onClick={() => { setMode("status"); setError(""); }}
              className="w-full text-center text-sm text-zinc-500 hover:text-zinc-800"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* ---- Backup codes (shown once) ---- */}
      {mode === "backup" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-700">
            <FiCheck /> <h2 className="text-lg font-bold">2FA is now on</h2>
          </div>
          <p className="mt-2 text-sm text-zinc-600">
            Save these one-time backup codes somewhere safe. If you lose your phone, each code lets
            you sign in once. <strong>They won’t be shown again.</strong>
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm text-zinc-800">
            {backupCodes.map((c) => (
              <span key={c} className="tracking-wider">{c}</span>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={downloadBackupCodes}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              <FiDownload /> Download codes
            </button>
            <button
              onClick={() => { setBackupCodes([]); void loadStatus(); }}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              I’ve saved them — Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
