import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto";
import { SignJWT, jwtVerify } from "jose";
import * as OTPAuth from "otpauth";
import bcrypt from "bcryptjs";

// What the authenticator app shows as the account name / issuer.
const ISSUER = "CYC Nepal Admin";
const ALGORITHM = "SHA1"; // What Google Authenticator etc. expect by default.
const DIGITS = 6;
const PERIOD = 30; // seconds per code

// ---------------------------------------------------------------------------
// Encryption at rest for the TOTP secret.
// The secret is what lets anyone generate valid codes, so we never store it in
// plaintext. We derive a stable AES-256 key from AUTH_SECRET (same input always
// yields the same key, so previously-stored values stay decryptable) and use
// AES-256-GCM, which is authenticated (tampering is detected on decrypt).
// ---------------------------------------------------------------------------
function getEncryptionKey(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Missing AUTH_SECRET environment variable.");
  }
  // Fixed salt keeps key derivation deterministic across restarts.
  return scryptSync(secret, "admin-totp-key-v1", 32);
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Store as iv:tag:ciphertext, all base64.
  return [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(":");
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Malformed encrypted secret.");
  }
  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

// ---------------------------------------------------------------------------
// TOTP secret generation + verification.
// ---------------------------------------------------------------------------
function buildTotp(secretBase32: string, label: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label,
    algorithm: ALGORITHM,
    digits: DIGITS,
    period: PERIOD,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
}

// Returns the raw base32 secret (to store, encrypted) and the otpauth:// URI
// (to render as a QR code for the authenticator app to scan).
export function generateTotpSecret(accountLabel: string): { secret: string; uri: string } {
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = buildTotp(secret.base32, accountLabel);
  return { secret: secret.base32, uri: totp.toString() };
}

// Verifies a 6-digit code against the secret. `window: 1` accepts the previous
// and next 30s codes too, so a slightly out-of-sync phone clock is tolerated.
export function verifyTotpCode(secretBase32: string, token: string): boolean {
  const cleaned = (token || "").replace(/\D/g, "");
  if (cleaned.length !== DIGITS) return false;
  const totp = buildTotp(secretBase32, ISSUER);
  const delta = totp.validate({ token: cleaned, window: 1 });
  return delta !== null;
}

// ---------------------------------------------------------------------------
// One-time backup codes (the "lost my phone" escape hatch).
// We show them ONCE in plaintext and store only bcrypt hashes.
// ---------------------------------------------------------------------------
function canonicalBackup(code: string): string {
  // Compare on alphanumerics only, so dashes/spaces/casing don't matter.
  return code.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

export async function generateBackupCodes(
  count = 10,
): Promise<{ plain: string[]; hashes: string[] }> {
  const plain: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = randomBytes(5).toString("hex"); // 10 hex chars
    plain.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 10)}`);
  }
  const hashes = await Promise.all(plain.map((code) => bcrypt.hash(canonicalBackup(code), 10)));
  return { plain, hashes };
}

// Checks a typed backup code against the stored hashes. On success returns the
// remaining hashes (the used one removed) so the caller can persist them —
// each backup code works exactly once.
export async function consumeBackupCode(
  input: string,
  hashes: string[],
): Promise<{ matched: boolean; remainingHashes: string[] }> {
  const candidate = canonicalBackup(input);
  if (!candidate) return { matched: false, remainingHashes: hashes };

  for (let i = 0; i < hashes.length; i++) {
    if (await bcrypt.compare(candidate, hashes[i])) {
      const remainingHashes = [...hashes.slice(0, i), ...hashes.slice(i + 1)];
      return { matched: true, remainingHashes };
    }
  }
  return { matched: false, remainingHashes: hashes };
}

// ---------------------------------------------------------------------------
// Account role <-> Mongo collection. 2FA works identically for admins and
// employees; the only difference is which collection holds the TOTP fields.
// ---------------------------------------------------------------------------
export type MfaRole = "admin" | "employee";

export function collectionForRole(role: MfaRole): "admins" | "employees" {
  return role === "admin" ? "admins" : "employees";
}

// ---------------------------------------------------------------------------
// MFA challenge ticket.
// Issued after the password step passes but before the code is verified. It
// proves "this person knows the password" and nothing more — it is NOT a
// session and cannot be used as one (verifyAdminSession rejects it because it
// has no admin/employee role). Short-lived so a stolen ticket is near useless.
// The role is embedded so the verify step knows which collection to look in.
// ---------------------------------------------------------------------------
function getSigningKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Missing AUTH_SECRET environment variable.");
  }
  return new TextEncoder().encode(secret);
}

const MFA_CHALLENGE_TTL_SECONDS = 5 * 60;

export async function signMfaChallenge(userId: string, role: MfaRole): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ typ: "mfa_challenge", role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt(now)
    .setExpirationTime(now + MFA_CHALLENGE_TTL_SECONDS)
    .sign(getSigningKey());
}

export async function verifyMfaChallenge(
  token: string,
): Promise<{ sub: string; role: MfaRole } | null> {
  try {
    const { payload } = await jwtVerify(token, getSigningKey(), { algorithms: ["HS256"] });
    if (payload.typ !== "mfa_challenge" || typeof payload.sub !== "string") {
      return null;
    }
    // Default to "admin" for challenges minted before the role was embedded.
    const role: MfaRole = payload.role === "employee" ? "employee" : "admin";
    return { sub: payload.sub, role };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Master reset code (for device hand-over / lost authenticator).
// Lets an admin wipe their TOTP enrollment using a secret value kept only in
// .env.local, so a new phone can be enrolled. Compared in constant time.
// ---------------------------------------------------------------------------
export function isValidResetCode(input: unknown): boolean {
  const expected = process.env.ADMIN_MFA_RESET_CODE;
  if (!expected || typeof input !== "string" || input.length === 0) {
    return false;
  }
  // Constant-time-ish comparison to avoid leaking length/content via timing.
  if (input.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}
