import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import QRCode from "qrcode";
import { getDb } from "@/lib/mongodb";
import { getAdminSessionFromRequestCookies } from "@/lib/admin-auth";
import { generateTotpSecret, encryptSecret, collectionForRole } from "@/lib/admin-totp";

// Begins 2FA enrollment for the logged-in user (admin or employee). Generates a
// fresh secret, stores it as PENDING (not yet active), and returns a QR code +
// manual key for the authenticator app. Enrollment is only finalized by
// /api/admin/2fa/verify once the user proves they scanned it with a valid code.
export async function POST() {
  const session = await getAdminSessionFromRequestCookies();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
  if (!ObjectId.isValid(session.sub)) {
    return NextResponse.json({ message: "Invalid session." }, { status: 401 });
  }

  const { secret, uri } = generateTotpSecret(session.email);
  const qr = await QRCode.toDataURL(uri);

  const db = await getDb();
  await db
    .collection(collectionForRole(session.role))
    .updateOne(
      { _id: new ObjectId(session.sub), role: session.role },
      { $set: { totpPendingSecret: encryptSecret(secret) } },
    );

  // `manualKey` lets the admin type the secret if their camera can't scan.
  return NextResponse.json({ qr, manualKey: secret });
}
