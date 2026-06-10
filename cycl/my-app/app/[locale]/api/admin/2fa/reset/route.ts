import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getAdminSessionFromRequestCookies } from "@/lib/admin-auth";
import { verifyTotpCode, decryptSecret, isValidResetCode, collectionForRole } from "@/lib/admin-totp";

type UserRecord = {
  _id: ObjectId;
  totpEnabled?: boolean;
  totpSecret?: string;
};

// Turns 2FA OFF for the logged-in user (admin or employee) — used both to
// "Disable 2FA" and as the first half of "Change authenticator app" (after
// which the client re-runs /api/admin/2fa/setup to enroll a new phone). To
// prevent a hijacked session from silently removing 2FA, the caller must prove
// ONE of:
//   - code:      a current valid authenticator code (they still have the phone)
//   - resetCode: the ADMIN_MFA_RESET_CODE from .env.local (lost phone / handover)
export async function POST(request: Request) {
  const session = await getAdminSessionFromRequestCookies();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
  if (!ObjectId.isValid(session.sub)) {
    return NextResponse.json({ message: "Invalid session." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { code?: unknown; resetCode?: unknown }
    | null;
  const code = typeof body?.code === "string" ? body.code : undefined;
  const resetCode = typeof body?.resetCode === "string" ? body.resetCode : undefined;

  const db = await getDb();
  const users = db.collection<UserRecord>(collectionForRole(session.role));
  const user = await users.findOne({ _id: new ObjectId(session.sub) });

  if (!user?.totpEnabled || !user.totpSecret) {
    return NextResponse.json({ message: "Two-factor authentication is not enabled." }, { status: 400 });
  }

  let authorized = false;
  if (resetCode && isValidResetCode(resetCode)) {
    authorized = true;
  } else if (code) {
    try {
      authorized = verifyTotpCode(decryptSecret(user.totpSecret), code);
    } catch {
      authorized = false;
    }
  }

  if (!authorized) {
    return NextResponse.json(
      { message: "Enter a valid authenticator code or the recovery code to continue." },
      { status: 401 },
    );
  }

  await users.updateOne(
    { _id: user._id },
    { $unset: { totpSecret: "", totpEnabled: "", backupCodes: "", totpPendingSecret: "" } },
  );

  return NextResponse.json({ ok: true });
}
