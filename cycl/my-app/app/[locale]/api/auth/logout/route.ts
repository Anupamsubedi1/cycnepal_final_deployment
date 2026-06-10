import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { USER_SESSION_COOKIE } from "@/lib/user-session";
import { signOut } from "@/lib/oauth";

export async function POST(): Promise<NextResponse> {
  try {
    // 1. Clear the email/password JWT session.
    const cookieStore = await cookies();
    cookieStore.delete(USER_SESSION_COOKIE);

    // 2. Terminate any Google OAuth (NextAuth) session as well.
    //    getAuthenticatedUser() falls back to the NextAuth session when no
    //    user_session cookie is present, so without this an OAuth-signed-in
    //    user (and anyone with a lingering OAuth session) would still appear
    //    logged in after "logout" — the profile would never clear.
    try {
      await signOut({ redirect: false });
    } catch (signOutError) {
      // signOut may throw when there is no active OAuth session; that's fine —
      // the user_session cookie has already been cleared above.
      console.error("OAuth signOut during logout failed:", signOutError);
    }

    return NextResponse.json(
      { message: "Logout successful" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
