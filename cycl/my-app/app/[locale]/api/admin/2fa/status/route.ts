import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getAdminSessionFromRequestCookies } from "@/lib/admin-auth";
import { collectionForRole } from "@/lib/admin-totp";

type UserRecord = {
  _id: ObjectId;
  totpEnabled?: boolean;
  backupCodes?: string[];
};

// Tells the Security page whether 2FA is on (and how many backup codes remain),
// and whether a master reset code is configured in the environment. Works for
// both admin and employee accounts.
export async function GET() {
  const session = await getAdminSessionFromRequestCookies();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
  if (!ObjectId.isValid(session.sub)) {
    return NextResponse.json({ message: "Invalid session." }, { status: 401 });
  }

  const db = await getDb();
  const user = await db
    .collection<UserRecord>(collectionForRole(session.role))
    .findOne({ _id: new ObjectId(session.sub) }, { projection: { totpEnabled: 1, backupCodes: 1 } });

  return NextResponse.json({
    enabled: Boolean(user?.totpEnabled),
    backupCodesRemaining: Array.isArray(user?.backupCodes) ? user.backupCodes.length : 0,
    resetCodeConfigured: Boolean(process.env.ADMIN_MFA_RESET_CODE),
  });
}
