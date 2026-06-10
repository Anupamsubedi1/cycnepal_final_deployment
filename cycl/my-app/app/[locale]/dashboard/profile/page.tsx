"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mail, Phone, Calendar, ShieldCheck, KeyRound } from "lucide-react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

interface ProfileUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  memberSince?: string;
  loginMethod: "email" | "google";
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || "en";

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);

  // "Set password" form — shown to Google accounts, which have no password yet.
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  const handleSetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPwError("");

    if (newPassword.length < 8) {
      setPwError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match");
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setPwError(data.error || "Failed to set password");
        return;
      }
      setNewPassword("");
      setConfirmPassword("");
      setPwSuccess(
        "Password set. You can now log in with your email and password, or keep using Google.",
      );
    } catch {
      setPwError("A network error occurred. Please try again.");
    } finally {
      setPwLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) {
          router.push(`/${locale}/login`);
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch {
        router.push(`/${locale}/login`);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [locale, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-700 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  const loginMethodLabel = user.loginMethod === "google" ? "Google" : "Email / Password";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
        <CandidateSidebar />

        <main className="flex-1">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="mt-1 text-sm text-gray-500">Your account information and login details.</p>
          </div>

          {/* Profile overview */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
                {initials(user.fullName) || "U"}
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-bold text-gray-900">{user.fullName}</h2>
                <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-gray-500 sm:justify-start">
                  <Mail className="h-4 w-4" /> {user.email}
                </p>
                {user.phone && (
                  <p className="mt-0.5 flex items-center justify-center gap-1.5 text-sm text-gray-500 sm:justify-start">
                    <Phone className="h-4 w-4" /> {user.phone}
                  </p>
                )}
                <p className="mt-0.5 flex items-center justify-center gap-1.5 text-sm text-gray-500 sm:justify-start">
                  <Calendar className="h-4 w-4" /> Member since{" "}
                  {user.memberSince ? new Date(user.memberSince).toLocaleDateString("en-GB") : "—"}
                </p>
              </div>
            </div>
          </section>

          {/* Account status */}
          <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Account Status
            </h3>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-green-600" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Status</dt>
                  <dd className="mt-0.5 inline-flex items-center gap-1 font-medium text-green-700">
                    Active
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <KeyRound className="mt-0.5 h-5 w-5 text-blue-600" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Login Method
                  </dt>
                  <dd className="mt-0.5 font-medium text-gray-800">{loginMethodLabel}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Email</dt>
                  <dd className="mt-0.5 font-medium text-gray-800">{user.email}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Member Since
                  </dt>
                  <dd className="mt-0.5 font-medium text-gray-800">
                    {user.memberSince
                      ? new Date(user.memberSince).toLocaleDateString("en-GB", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "—"}
                  </dd>
                </div>
              </div>
            </dl>
          </section>

          {/* Set password — only for Google accounts, which have no password yet.
              Lets them add an email/password credential alongside Google. */}
          {user.loginMethod === "google" && (
            <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-1 flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Set a Password
                </h3>
              </div>
              <p className="mb-4 text-sm text-gray-500">
                You signed in with Google, so your account has no password yet. Set one to also
                log in with your email and password. You can still use Google any time.
              </p>

              {pwError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {pwError}
                </div>
              )}

              {pwSuccess ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {pwSuccess}
                </div>
              ) : (
                <form onSubmit={handleSetPassword} className="max-w-md space-y-4">
                  <div>
                    <label
                      htmlFor="newPassword"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      New password
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Confirm password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={pwLoading}
                    className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {pwLoading ? "Saving..." : "Set Password"}
                  </button>
                </form>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
