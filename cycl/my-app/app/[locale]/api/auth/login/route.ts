import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/services/user-service";
import { signUserSession, USER_SESSION_COOKIE } from "@/lib/user-session";
import { checkRateLimit, recordFailure, clearAttempts } from "@/lib/rate-limit";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email, password, token } = body;

    // 1. Verify reCAPTCHA Token
    if (!token) {
      return NextResponse.json({ success: false, error: "Captcha token is missing" }, { status: 400 });
    }

    const recaptchaRes = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
      { method: "POST" }
    );
    const recaptchaData = await recaptchaRes.json();

    if (!recaptchaData.success) {
      return NextResponse.json({ success: false, error: "reCAPTCHA verification failed" }, { status: 400 });
    }

    // 2. Validate required fields (must be strings — guards NoSQL injection)
    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
    }

    // Rate limiting / lockout (per email + client IP) — defense against
    // credential brute force, in addition to the reCAPTCHA above.
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rateKey = `user-login:${email.trim().toLowerCase()}:${ip}`;
    const limit = checkRateLimit(rateKey);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many failed attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds ?? 900) } },
      );
    }

    // 3. Find user by email
    const user = await getUserByEmail(email);
    if (!user) {
      recordFailure(rateKey);
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    // 4. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      recordFailure(rateKey);
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    clearAttempts(rateKey);

    // 5. Create session
    const sessionToken = await signUserSession({
      userId: user._id!.toString(),
      email: user.email,
      fullName: user.fullName,
    });

    // 6. Set cookie & Success Response
    const response = NextResponse.json(
      {
        success: true, // Crucial for handleCaptchaSubmit utility
        message: "Login successful",
        redirectTo: "/dashboard",
        user: {
          id: user._id?.toString(),
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
        },
      },
      { status: 200 },
    );

    response.cookies.set(USER_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}