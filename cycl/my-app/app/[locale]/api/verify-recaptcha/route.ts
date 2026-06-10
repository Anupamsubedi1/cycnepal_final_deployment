// app/api/verify-recaptcha/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, token } = await request.json();

    if (!token) {
      return NextResponse.json({ success: false, message: "Token missing" }, { status: 400 });
    }

    // Google's validation endpoint
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY!,
        response: token,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      return NextResponse.json(
        { success: false, message: "Invalid CAPTCHA", errors: data["error-codes"] },
        { status: 400 }
      );
    }

    // Process valid user here
    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}