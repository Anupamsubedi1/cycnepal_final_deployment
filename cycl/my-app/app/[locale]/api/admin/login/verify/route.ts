import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { setAdminSessionCookie } from "@/lib/admin-auth";
import { signAdminSession } from "@/lib/admin-session";
import {
  verifyMfaChallenge,
  verifyTotpCode,
  decryptSecret,
  consumeBackupCode,
  isValidResetCode,
  collectionForRole,
} from "@/lib/admin-totp";
import { checkRateLimit, recordFailure, clearAttempts } from "@/lib/rate-limit";
import type { EmployeePermission } from "@/lib/employee-permissions";

// Step two of login (admins and employees). Reached only after /api/admin/login
// verified the password and returned a short-lived `challenge`. This route is
// intentionally under /api/admin/login/* so the middleware treats it as public
// (the user has no session cookie yet). It accepts ONE of:
//   - code:      a 6-digit authenticator code
//   - backupCode: a one-time backup code
//   - resetCode:  the ADMIN_MFA_RESET_CODE from .env.local (device hand-over /
//                 lost authenticator) — this also DISABLES 2FA so a new phone
//                 can be enrolled afterward.
// On success it issues the real admin_session cookie.
type UserRecord = {
  _id: ObjectId;
  email: string;
  totpEnabled?: boolean;
  totpSecret?: string;
  backupCodes?: string[];
  // Employees only.
  permissions?: EmployeePermission[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      challenge?: unknown;
      code?: unknown;
      backupCode?: unknown;
      resetCode?: unknown;
    };

    const challenge = typeof body.challenge === "string" ? body.challenge : undefined;
    if (!challenge) {
      return NextResponse.json({ message: "Missing challenge." }, { status: 400 });
    }

    const verified_challenge = await verifyMfaChallenge(challenge);
    if (!verified_challenge) {
      // Expired or tampered — make them restart from the password step.
      return NextResponse.json(
        { message: "Your verification session expired. Please log in again." },
        { status: 401 },
      );
    }
    const { sub: userId, role } = verified_challenge;

    // Brute-force protection: a 6-digit code has only a million possibilities,
    // so the second factor must be rate limited just like the password step.
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rateKey = `admin-mfa:${userId}:${ip}`;
    const limit = checkRateLimit(rateKey);
    if (!limit.allowed) {
      return NextResponse.json(
        { message: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds ?? 900) } },
      );
    }

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ message: "Invalid session." }, { status: 401 });
    }

    const db = await getDb();
    const users = db.collection<UserRecord>(collectionForRole(role));
    const user = await users.findOne({ _id: new ObjectId(userId), role });

    if (!user || !user.totpEnabled || !user.totpSecret) {
      // 2FA isn't actually enabled (or the user vanished) — nothing to verify.
      return NextResponse.json({ message: "Invalid session." }, { status: 401 });
    }

    const code = typeof body.code === "string" ? body.code : undefined;
    const backupCode = typeof body.backupCode === "string" ? body.backupCode : undefined;
    const resetCode = typeof body.resetCode === "string" ? body.resetCode : undefined;

    let verified = false;
    let disabledViaReset = false;

    if (resetCode) {
      // Master reset: wipe TOTP enrollment so a new authenticator can be set up.
      if (!isValidResetCode(resetCode)) {
        recordFailure(rateKey);
        return NextResponse.json({ message: "Invalid recovery code." }, { status: 401 });
      }
      await users.updateOne(
        { _id: user._id },
        { $unset: { totpSecret: "", totpEnabled: "", backupCodes: "", totpPendingSecret: "" } },
      );
      verified = true;
      disabledViaReset = true;
    } else if (code) {
      let secret: string;
      try {
        secret = decryptSecret(user.totpSecret);
      } catch {
        return NextResponse.json({ message: "Could not verify code. Contact support." }, { status: 500 });
      }
      verified = verifyTotpCode(secret, code);
      if (!verified) {
        recordFailure(rateKey);
        return NextResponse.json({ message: "Invalid code." }, { status: 401 });
      }
    } else if (backupCode) {
      const { matched, remainingHashes } = await consumeBackupCode(
        backupCode,
        Array.isArray(user.backupCodes) ? user.backupCodes : [],
      );
      if (!matched) {
        recordFailure(rateKey);
        return NextResponse.json({ message: "Invalid backup code." }, { status: 401 });
      }
      // Persist the used code as spent (each works only once).
      await users.updateOne({ _id: user._id }, { $set: { backupCodes: remainingHashes } });
      verified = true;
    } else {
      return NextResponse.json({ message: "Enter a code to continue." }, { status: 400 });
    }

    if (!verified) {
      recordFailure(rateKey);
      return NextResponse.json({ message: "Verification failed." }, { status: 401 });
    }

    clearAttempts(rateKey);

    const token = await signAdminSession({
      adminId: user._id.toHexString(),
      email: user.email,
      role,
      // Employees carry their permission set in the session; admins don't.
      permissions: role === "employee" ? user.permissions : undefined,
    });

    const response = NextResponse.json({
      ok: true,
      role,
      // Signals the client to send the user to the Security page to enroll a
      // new authenticator, since reset turned 2FA off.
      twoFactorReset: disabledViaReset,
    });
    await setAdminSessionCookie(response, token);
    return response;
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }
}
