import "server-only";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  getSessionMaxAgeSeconds,
  verifyAdminSession,
} from "@/lib/admin-session";

export async function setAdminSessionCookie(
  response: NextResponse,
  token: string,
): Promise<void> {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getSessionMaxAgeSeconds(),
  });
}

export async function clearAdminSessionCookie(
  response: NextResponse,
): Promise<void> {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export type AdminSession = {
  sub: string;
  email: string;
  role: "admin" | "employee";
  permissions: string[];
};

export async function getAdminSessionFromRequestCookies(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyAdminSession(token);
  if (!payload?.sub || typeof payload.sub !== "string") {
    return null;
  }

  return {
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
    permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
  };
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSessionFromRequestCookies();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}
