import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/user-session";

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    // A non-empty passwordHash means the account was created with email/password;
    // otherwise it was provisioned through Google OAuth.
    const loginMethod: "email" | "google" =
      user.passwordHash && user.passwordHash.length > 0 ? "email" : "google";

    return NextResponse.json(
      {
        user: {
          id: user._id?.toString(),
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          memberSince: user.createdAt,
          loginMethod,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
