import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAuthenticatedUser } from "@/lib/user-session";
import { updateUser } from "@/services/user-service";

// Lets a signed-in applicant set (or change) an email/password credential.
// Primary use case: an account provisioned through Google OAuth has an empty
// passwordHash and therefore can't use the email/password login at all. This
// endpoint attaches a password to such an account so both methods work. It also
// doubles as a change-password endpoint for accounts that already have one.
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthenticatedUser();
    if (!user?._id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { password, currentPassword } = body;

    if (typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid input" },
        { status: 400 },
      );
    }

    // Mirror the signup policy: min 8 chars, and cap at 72 bytes because bcrypt
    // silently truncates anything longer.
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }
    if (Buffer.byteLength(password, "utf8") > 72) {
      return NextResponse.json(
        { success: false, error: "Password is too long (max 72 bytes)" },
        { status: 400 },
      );
    }

    const hasExistingPassword =
      typeof user.passwordHash === "string" && user.passwordHash.length > 0;

    // Setting a password for the first time (Google-provisioned account) needs
    // no proof. Changing an existing one requires the current password, so a
    // hijacked session can't silently lock the real owner out.
    if (hasExistingPassword) {
      if (typeof currentPassword !== "string" || currentPassword.length === 0) {
        return NextResponse.json(
          { success: false, error: "Current password is required to change it" },
          { status: 400 },
        );
      }
      const ok = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!ok) {
        return NextResponse.json(
          { success: false, error: "Current password is incorrect" },
          { status: 400 },
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await updateUser(user._id, { passwordHash });

    return NextResponse.json(
      { success: true, message: "Password set successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Set password error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
