// Server-side validation for application submissions.
//
// The 7-step wizard validates on the client (`lib/validation.ts`), but a crafted
// multipart POST could bypass that entirely. These helpers re-assert the core
// identity fields and compute experience defensively so the server never trusts
// client-only validation.

import {
  englishNameRegex,
  emailRegex,
  phoneRegex,
  citizenshipRegex,
} from "@/lib/validation";

/** Per-field length cap to bound storage / guard against oversized payloads. */
export const MAX_FIELD_LEN = 300;

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Validates the core required identity fields of an application. Returns an
 * error message (for a 400) or `null` when valid. Intentionally validates only
 * the universally-required fields (name, DOB, citizenship, email, mobile) so it
 * mirrors what the client already requires without over-rejecting the long
 * bilingual address set.
 */
export function validateApplicationFields(
  personal: Record<string, unknown>,
  contact: Record<string, unknown>,
): string | null {
  const firstName = str(personal.firstName);
  const lastName = str(personal.lastName);
  const dobAD = str(personal.dobAD);
  const citizenshipNumber = str(personal.citizenshipNumber);
  const email = str(contact.email);
  const mobile = str(contact.mobile);

  if (!firstName || !lastName) {
    return "First and last name are required.";
  }
  if (firstName.length > MAX_FIELD_LEN || lastName.length > MAX_FIELD_LEN) {
    return "Name is too long.";
  }
  if (!englishNameRegex.test(firstName) || !englishNameRegex.test(lastName)) {
    return "Names must contain letters only (letters, spaces and hyphens).";
  }

  // DOB is always required (admit card depends on it) — this also closes the
  // "omit dobAD to skip the age check" bypass.
  if (!dobAD) {
    return "Date of birth is required.";
  }
  const dob = new Date(dobAD);
  if (Number.isNaN(dob.getTime())) {
    return "Date of birth is invalid.";
  }
  if (dob.getTime() > Date.now()) {
    return "Date of birth cannot be in the future.";
  }

  if (!citizenshipNumber || !citizenshipRegex.test(citizenshipNumber)) {
    return "A valid citizenship number is required.";
  }
  if (citizenshipNumber.length > MAX_FIELD_LEN) {
    return "Citizenship number is too long.";
  }

  if (!email || !emailRegex.test(email) || email.length > MAX_FIELD_LEN) {
    return "A valid email address is required.";
  }
  if (!mobile || !phoneRegex.test(mobile) || mobile.length > MAX_FIELD_LEN) {
    return "A valid mobile number is required.";
  }

  return null;
}

/**
 * Total years of experience computed from non-overlapping service intervals.
 * Overlapping ranges are merged so concurrent jobs are not double-counted, and
 * inverted/invalid ranges are ignored.
 */
export function computeTotalExperienceYears(
  experience: Array<{ serviceFrom?: unknown; serviceTo?: unknown }>,
): number {
  const intervals: Array<[number, number]> = [];

  for (const exp of Array.isArray(experience) ? experience : []) {
    const from = new Date(str(exp?.serviceFrom)).getTime();
    const to = new Date(str(exp?.serviceTo)).getTime();
    if (Number.isNaN(from) || Number.isNaN(to) || to <= from) {
      continue;
    }
    intervals.push([from, to]);
  }

  if (intervals.length === 0) {
    return 0;
  }

  intervals.sort((a, b) => a[0] - b[0]);

  let totalMs = 0;
  let [curStart, curEnd] = intervals[0];
  for (let i = 1; i < intervals.length; i++) {
    const [start, end] = intervals[i];
    if (start <= curEnd) {
      curEnd = Math.max(curEnd, end);
    } else {
      totalMs += curEnd - curStart;
      curStart = start;
      curEnd = end;
    }
  }
  totalMs += curEnd - curStart;

  return totalMs / (1000 * 60 * 60 * 24 * 365.25);
}
