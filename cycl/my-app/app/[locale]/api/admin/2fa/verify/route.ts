import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getAdminSessionFromRequestCookies } from "@/lib/admin-auth";
import {
  verifyTotpCode,
  decryptSecret,
  generateBackupCodes,
  collectionForRole,
} from "@/lib/admin-totp";

type UserRecord = {
  _id: ObjectId;
  totpPendingSecret?: string;
};

// Finalizes enrollment: the user (admin or employee) enters the first 6-digit
// code from their authenticator. If it matches the PENDING secret, 2FA is
// switched on and we return ~10 one-time backup codes (shown once, stored only
// as hashes).
export async function POST(request: Request) {
  const session = await getAdminSessionFromRequestCookies();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
  if (!ObjectId.isValid(session.sub)) {
    return NextResponse.json({ message: "Invalid session." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code : undefined;
  if (!code) {
    return NextResponse.json({ message: "Enter the 6-digit code." }, { status: 400 });
  }

  const db = await getDb();
  const users = db.collection<UserRecord>(collectionForRole(session.role));
  const user = await users.findOne({ _id: new ObjectId(session.sub) });

  if (!user?.totpPendingSecret) {
    return NextResponse.json(
      { message: "No pending setup. Start enrollment again." },
      { status: 400 },
    );
  }

  let secret: string;
  try {
    secret = decryptSecret(user.totpPendingSecret);
  } catch {
    return NextResponse.json({ message: "Setup is corrupted. Start again." }, { status: 400 });
  }

  if (!verifyTotpCode(secret, code)) {
    return NextResponse.json(
      { message: "That code didn't match. Check your authenticator and try again." },
      { status: 400 },
    );
  }

  const { plain, hashes } = await generateBackupCodes(10);

  await users.updateOne(
    { _id: user._id },
    {
      $set: {
        totpSecret: user.totpPendingSecret, // promote pending -> active (stays encrypted)
        totpEnabled: true,
        backupCodes: hashes,
      },
      $unset: { totpPendingSecret: "" },
    },
  );

  return NextResponse.json({ ok: true, backupCodes: plain });
}
