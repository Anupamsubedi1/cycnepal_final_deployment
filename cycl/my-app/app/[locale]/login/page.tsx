"use client";

import { useState, FormEvent, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ReCAPTCHA from "react-google-recaptcha";
import { Eye, EyeOff, ArrowLeft, Mail, Lock } from "lucide-react";
import { handleCaptchaSubmit } from "@/lib/handle-captcha-submit";
// Import the Client-safe signIn function from NextAuth
import { signIn } from "next-auth/react";
import { useLoadingBar } from "@/components/LoadingBar";

export default function LoginPage(): React.JSX.Element {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const loadingBar = useLoadingBar();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Google Sign-In handler for Client Components
  const handleGoogleSignIn = async () => {
    setError("");
    loadingBar.start();
    try {
      const next = searchParams.get("next");
      const locale = params.locale || 'ne';
      const callbackUrl = next ? `/${locale}${next}` : `/${locale}/vacancies`;

      // reCAPTCHA is typically bypassed for trusted OAuth providers like Google,
      // but callbackUrl handles your localized redirection after a successful login.
      await signIn("google", { callbackUrl });
    } catch (err) {
      setError("Something went wrong with Google Sign-In.");
      loadingBar.complete();
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      return;
    }

    if (!captchaToken) {
      setError("Please complete the reCAPTCHA verification.");
      return;
    }

    setLoading(true);
    loadingBar.start();

    await handleCaptchaSubmit({
      endpoint: "/api/auth/login",
      payload: formData,
      recaptchaToken: captchaToken,
      recaptchaRef: recaptchaRef,
      onSuccess: (data) => {
        setSuccess("Login successful! Redirecting...");
        const next = searchParams.get("next");
        const locale = params.locale || 'ne';
        const destination = next || data?.redirectTo || "/dashboard";

        setTimeout(() => {
          router.push(`/${locale}${destination}`);
          router.refresh();
        }, 1500);
      },
      onFailure: (errorMessage) => {
        setError(errorMessage);
        setLoading(false);
        setCaptchaToken(null);
        recaptchaRef.current?.reset();
        loadingBar.complete();
      },
    });
  };

  return (
    <div className="flex min-h-svh w-full bg-slate-50 text-slate-900">
      {/* Brand panel (desktop) */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#005d59] p-10 text-white lg:flex xl:p-14">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-[#3CA3C8]/30 blur-3xl" />

        <Link
          href="/"
          className="relative z-10 inline-flex w-fit items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white/90 backdrop-blur transition hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="relative z-10">
          <span className="inline-flex rounded-2xl bg-white p-4 shadow-xl">
            <Image src="/cyc-logo.jpg" alt="The CYC Nepal Laghubitta Bittiya Sanstha Ltd." width={260} height={78} className="h-20 w-auto" priority />
          </span>
          <h2 className="mt-8 text-3xl font-black leading-tight xl:text-4xl">
            Build your career with The CYC Nepal Laghubitta Bittiya Sanstha Ltd.
          </h2>
          <p className="mt-4 max-w-md text-base leading-7 text-white/80">
            Log in to apply for open positions, track your applications, and manage
            your candidate profile — all in one place.
          </p>
        </div>

        <p className="relative z-10 text-xs text-white/60">
          © {new Date().getFullYear()} The CYC Nepal Laghubitta Bittiya Sanstha Ltd.
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex w-full items-center justify-center px-4 py-8 sm:px-8 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Image src="/cyc-logo.jpg" alt="The CYC Nepal Laghubitta Bittiya Sanstha Ltd." width={200} height={60} className="h-12 w-auto" priority />
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#005d59]">
              <ArrowLeft className="h-4 w-4" /> Home
            </Link>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Welcome back</h1>
          <p className="mt-1.5 text-sm text-slate-500">Log in to your account to apply for jobs.</p>

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.3 1.55-1.17 2.86-2.47 3.74v3.13h3.99c2.34-2.13 3.61-5.32 3.61-8.72z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.99-3.13c-1.1.74-2.51 1.18-3.94 1.18-3.04 0-5.63-2.06-6.55-4.83H1.46v3.23C3.43 21.36 7.42 24 12 24z" />
              <path fill="#FBBC05" d="M5.45 14.31a7.22 7.22 0 0 1 0-4.62V6.46H1.46a11.94 11.94 0 0 0 0 11.08l3.99-3.23z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.42 0 3.43 2.64 1.46 6.46l3.99 3.23c.92-2.77 3.51-4.83 6.55-4.83z" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            Or continue with email
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#005d59] focus:ring-4 focus:ring-[#005d59]/10"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-[#005d59] focus:ring-4 focus:ring-[#005d59]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                onChange={(token) => setCaptchaToken(token)}
                onExpired={() => setCaptchaToken(null)}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !captchaToken}
              className="w-full rounded-lg bg-[#005d59] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00716c] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-[#005d59] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
