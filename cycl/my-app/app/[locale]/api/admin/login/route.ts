import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { setAdminSessionCookie } from "@/lib/admin-auth";
import { signAdminSession } from "@/lib/admin-session";
import { signMfaChallenge } from "@/lib/admin-totp";
import { checkRateLimit, recordFailure, clearAttempts } from "@/lib/rate-limit";
import type { EmployeePermission } from "@/lib/employee-permissions";

type AdminRecord = {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  role: "admin";
  // Optional 2FA fields — absent on admins who haven't enrolled.
  totpEnabled?: boolean;
  totpSecret?: string;
  backupCodes?: string[];
};

type EmployeeRecord = {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  role: "employee";
  permissions: EmployeePermission[];
  // Optional 2FA fields — absent on employees who haven't enrolled.
  totpEnabled?: boolean;
  totpSecret?: string;
  backupCodes?: string[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: unknown;
      password?: unknown;
    };

    // Inputs must be strings — guards against NoSQL operator injection.
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : undefined;
    const password = typeof body.password === "string" ? body.password : undefined;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 },
      );
    }

    // Rate limiting / lockout (per email + client IP).
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rateKey = `admin-login:${email}:${ip}`;
    const limit = checkRateLimit(rateKey);
    if (!limit.allowed) {
      return NextResponse.json(
        { message: "Too many failed attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds ?? 900) } },
      );
    }

    const db = await getDb();

    // Check admins collection first
    const admin = await db.collection<AdminRecord>("admins").findOne({ email, role: "admin" });

    if (admin) {
      const passwordMatches = await bcrypt.compare(password, admin.passwordHash);
      if (!passwordMatches) {
        recordFailure(rateKey);
        return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
      }

      clearAttempts(rateKey);

      // 2FA gate. When enabled, the password is just step one: hand back a
      // short-lived challenge and DO NOT issue the session cookie. The client
      // completes step two at /api/admin/login/verify.
      if (admin.totpEnabled) {
        const challenge = await signMfaChallenge(admin._id.toHexString(), "admin");
        return NextResponse.json({ ok: true, mfaRequired: true, challenge });
      }

      const token = await signAdminSession({
        adminId: admin._id.toHexString(),
        email: admin.email,
        role: "admin",
      });

      const response = NextResponse.json({ ok: true, role: "admin" });
      await setAdminSessionCookie(response, token);
      return response;
    }

    // Check employees collection
    const employee = await db.collection<EmployeeRecord>("employees").findOne({ email, role: "employee" });

    if (!employee) {
      recordFailure(rateKey);
      return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
    }

    const passwordMatches = await bcrypt.compare(password, employee.passwordHash);
    if (!passwordMatches) {
      recordFailure(rateKey);
      return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
    }

    clearAttempts(rateKey);

    // 2FA gate (same as admins). When enabled, defer the session until the
    // code is verified at /api/admin/login/verify.
    if (employee.totpEnabled) {
      const challenge = await signMfaChallenge(employee._id.toHexString(), "employee");
      return NextResponse.json({ ok: true, mfaRequired: true, challenge });
    }

    const token = await signAdminSession({
      adminId: employee._id.toHexString(),
      email: employee.email,
      role: "employee",
      permissions: employee.permissions,
    });

    const response = NextResponse.json({ ok: true, role: "employee" });
    await setAdminSessionCookie(response, token);
    return response;
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }
}
