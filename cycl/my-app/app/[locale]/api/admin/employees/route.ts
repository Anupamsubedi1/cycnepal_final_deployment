import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getAdminSessionFromRequestCookies } from "@/lib/admin-auth";
import { createEmployee, listEmployees } from "@/services/employee-service";
import { emailRegex } from "@/lib/validation";
import type { EmployeePermission } from "@/lib/employee-permissions";

export async function GET() {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    if (session.role !== "admin") {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    const employees = await listEmployees();
    return NextResponse.json({ employees });
  } catch {
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    if (session.role !== "admin") {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    const body = (await request.json()) as {
      fullName?: string;
      email?: string;
      password?: string;
      permissions?: EmployeePermission[];
    };

    const { fullName, email, password, permissions } = body;

    if (!fullName?.trim() || !email?.trim() || !password || !Array.isArray(permissions)) {
      return NextResponse.json(
        { message: "Full name, email, password, and permissions are required." },
        { status: 400 },
      );
    }

    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }
    if (Buffer.byteLength(password, "utf8") > 72) {
      return NextResponse.json(
        { message: "Password is too long (max 72 bytes)." },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = await createEmployee({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      permissions,
    });

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error.";
    // MongoDB duplicate key error
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: number }).code === 11000) {
      return NextResponse.json({ message: "An employee with this email already exists." }, { status: 409 });
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}
