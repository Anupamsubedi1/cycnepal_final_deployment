import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-session";
import { jwtVerify } from "jose";
import createMiddleware from 'next-intl/middleware';

// Edge-safe verification of the applicant `user_session` JWT. Done inline (with
// `jose` only) so the middleware does not import the full user-session module,
// which pulls in MongoDB/NextAuth and cannot run in the Edge runtime.
const USER_SESSION_COOKIE = "user_session";
async function hasValidUserSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    return payload.role === "user";
  } catch {
    return false;
  }
}

// Applicants can sign in two ways: the email/password flow (the `user_session`
// JWT above) OR Google via NextAuth, which stores an ENCRYPTED session JWT under
// a cookie named `authjs.session-token` (http) / `__Secure-authjs.session-token`
// (https); large sessions are chunked into `.0`, `.1`, … and legacy installs use
// the `next-auth.` prefix. That JWE can't be decrypted in the Edge runtime
// without Node crypto, and we don't need to here — this is only a page-level
// redirect guard. The authoritative validation still happens in the API layer
// (getAuthenticatedUser, which calls NextAuth `auth()` and rejects stale
// cookies). So we treat the presence of this cookie as "possibly signed in" and
// let the page load; without it, Google applicants were wrongly bounced to
// /login the instant they opened the dashboard.
function hasOAuthSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((cookie) => {
    const name = cookie.name.replace(/^(__Secure-|__Host-)/, "");
    return (
      (name.startsWith("authjs.session-token") ||
        name.startsWith("next-auth.session-token")) &&
      cookie.value.length > 0
    );
  });
}

const DEFAULT_LOCALE = "en";
const VALID_LOCALES = new Set(['en', 'ne']);

const intlMiddleware = createMiddleware({
  locales: ['en', 'ne'],
  defaultLocale: 'en'
});

function extractLocale(pathname: string): string {
  const segment = pathname.split('/')[1] || '';
  return VALID_LOCALES.has(segment) ? segment : DEFAULT_LOCALE;
}

const PERMISSION_MAP: { permission: string; prefixes: string[] }[] = [
  { permission: "home", prefixes: ["/admin/home"] },
  { permission: "about", prefixes: ["/admin/about-us"] },
  { permission: "loans", prefixes: ["/admin/loans", "/admin/loan-categories"] },
  { permission: "savings", prefixes: ["/admin/savings"] },
  { permission: "financial_highlights", prefixes: ["/admin/financial-highlights"] },
  { permission: "news_notices", prefixes: ["/admin/news", "/admin/notices", "/admin/news-notices", "/admin/page-settings"] },
  { permission: "branches", prefixes: ["/admin/branches"] },
  { permission: "vacancies", prefixes: ["/admin/vacancies", "/admin/applications"] },
  { permission: "contact", prefixes: ["/admin/contact"] },
  { permission: "marquee", prefixes: ["/admin/marquee"] },
  { permission: "footer", prefixes: ["/admin/footer"] },
];

function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(en|ne)/, "");
}

function getRequiredPermission(stripped: string): string | null {
  for (const { permission, prefixes } of PERMISSION_MAP) {
    for (const prefix of prefixes) {
      if (stripped === prefix || stripped.startsWith(prefix + "/")) {
        return permission;
      }
    }
  }
  return null;
}

// Maps admin API path prefixes to the permission an employee must hold.
// Mirrors PERMISSION_MAP so the API layer enforces the same boundaries the
// page-level checks do. Unlisted admin APIs only require a valid session.
const API_PERMISSION_MAP: { permission: string; prefixes: string[] }[] = [
  { permission: "home", prefixes: ["/api/admin/home"] },
  { permission: "about", prefixes: ["/api/admin/about-us"] },
  { permission: "loans", prefixes: ["/api/admin/loan-categories"] },
  { permission: "savings", prefixes: ["/api/admin/savings"] },
  { permission: "financial_highlights", prefixes: ["/api/admin/financial-highlights"] },
  { permission: "news_notices", prefixes: ["/api/admin/news", "/api/admin/notices", "/api/admin/page-hero-settings"] },
  { permission: "branches", prefixes: ["/api/admin/branches"] },
  { permission: "vacancies", prefixes: ["/api/admin/vacancies", "/api/admin/applications"] },
  { permission: "marquee", prefixes: ["/api/admin/marquee"] },
  { permission: "footer", prefixes: ["/api/admin/footer"] },
];

function getRequiredApiPermission(pathname: string): string | null {
  for (const { permission, prefixes } of API_PERMISSION_MAP) {
    for (const prefix of prefixes) {
      if (pathname === prefix || pathname.startsWith(prefix + "/")) {
        return permission;
      }
    }
  }
  return null;
}

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

// Centralized authorization for /api/admin/* routes. The page middleware only
// guards navigation; without this, admin APIs were reachable by any logged-in
// employee regardless of their granted permissions.
async function enforceAdminApi(
  request: NextRequest,
  pathname: string,
): Promise<NextResponse | null> {
  // The login endpoint is intentionally public; logout only clears a cookie.
  if (pathname.startsWith("/api/admin/login") || pathname.startsWith("/api/admin/logout")) {
    return null;
  }

  // Cross-origin guard for state-changing requests (defense-in-depth CSRF).
  if (request.method !== "GET" && request.method !== "HEAD") {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host) {
      try {
        if (new URL(origin).host !== host) {
          return jsonError("Cross-origin request blocked", 403);
        }
      } catch {
        return jsonError("Invalid origin", 403);
      }
    }
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return jsonError("Unauthorized", 401);
  }

  const session = await verifyAdminSession(token);
  if (!session) {
    return jsonError("Invalid or expired session", 401);
  }

  // Employee management is admin-only.
  if (pathname.startsWith("/api/admin/employees")) {
    return session.role === "admin" ? null : jsonError("Forbidden", 403);
  }

  if (session.role === "admin") {
    return null;
  }

  const required = getRequiredApiPermission(pathname);
  const permissions = Array.isArray(session.permissions) ? session.permissions : [];
  if (required && !permissions.includes(required)) {
    return jsonError("You do not have permission to perform this action", 403);
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    if (pathname.startsWith("/api/admin/")) {
      const authError = await enforceAdminApi(request, pathname);
      if (authError) {
        return authError;
      }
    }

    const locale = request.cookies.get("NEXT_LOCALE")?.value || DEFAULT_LOCALE;
    const rewrittenUrl = request.nextUrl.clone();
    rewrittenUrl.pathname = `/${locale}${pathname}`;
    return NextResponse.rewrite(rewrittenUrl);
  }

  const intlResponse = intlMiddleware(request);

  const isAdminPath = pathname.match(/^\/(en|ne)\/admin/) || pathname.startsWith('/admin');

  if (isAdminPath) {
    if (pathname.endsWith('/admin/login') || pathname.endsWith('/admin/unauthorized')) {
      return intlResponse;
    }

    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

    if (!token) {
      const loginUrl = new URL(`/${extractLocale(pathname)}/admin/login`, request.url);
      loginUrl.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    const session = await verifyAdminSession(token);
    if (!session) {
      const loginUrl = new URL(`/${extractLocale(pathname)}/admin/login`, request.url);
      loginUrl.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    // Full admins pass through
    if (session.role === "admin") {
      return intlResponse;
    }

    // Employee permission checks
    if (session.role === "employee") {
      const locale = extractLocale(pathname);
      const stripped = stripLocale(pathname);
      const permissions = Array.isArray(session.permissions) ? session.permissions : [];

      // Employees cannot access employee management
      if (stripped.startsWith("/admin/employees")) {
        return NextResponse.redirect(new URL(`/${locale}/admin/unauthorized`, request.url));
      }

      const required = getRequiredPermission(stripped);
      if (required && !permissions.includes(required)) {
        return NextResponse.redirect(new URL(`/${locale}/admin/unauthorized`, request.url));
      }
    }
  }

  // Applicant dashboard guard: require a valid user session for /dashboard/*.
  // (The /api/user/* layer is independently authenticated; this adds the
  // page-level redirect so logged-out users land on the login page.)
  const isDashboardPath = /^\/(en|ne)\/dashboard(\/|$)/.test(pathname) || pathname.startsWith("/dashboard");
  if (isDashboardPath) {
    const token = request.cookies.get(USER_SESSION_COOKIE)?.value;
    // Accept EITHER auth method: the email/password JWT OR a Google OAuth
    // (NextAuth) session. Previously this only checked `user_session`, so
    // applicants who signed in with Google were redirected back to /login the
    // moment they opened the dashboard / my-applications / profile pages.
    const signedIn = (await hasValidUserSession(token)) || hasOAuthSessionCookie(request);
    if (!signedIn) {
      const loginUrl = new URL(`/${extractLocale(pathname)}/login`, request.url);
      loginUrl.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlResponse;
}

export const config = {
  matcher: [
    '/',
    '/api/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ],
};
