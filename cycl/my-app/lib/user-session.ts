import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { auth } from "@/lib/oauth";
import { createUser, getUserByEmail, getUserById, type User } from "@/services/user-service";

export const USER_SESSION_COOKIE = "user_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type UserSessionPayload = JWTPayload & {
  role: "user";
  email: string;
  fullName: string;
};

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("Missing AUTH_SECRET environment variable.");
  }

  return new TextEncoder().encode(secret);
}

export async function signUserSession(input: {
  userId: string;
  email: string;
  fullName: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({ role: "user", email: input.email, fullName: input.fullName })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.userId)
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_DURATION_SECONDS)
    .sign(getAuthSecret());
}

export async function verifyUserSession(
  token: string,
): Promise<UserSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret(), {
      algorithms: ["HS256"],
    });

    if (
      payload.role !== "user" ||
      typeof payload.email !== "string" ||
      typeof payload.fullName !== "string"
    ) {
      return null;
    }

    return payload as UserSessionPayload;
  } catch {
    return null;
  }
}

export async function getUserFromSession(cookies: {
  [key: string]: string;
}): Promise<(UserSessionPayload & { sub: string }) | null> {
  const token = cookies[USER_SESSION_COOKIE];

  if (!token) {
    return null;
  }

  const session = await verifyUserSession(token);

  if (!session || !session.sub) {
    return null;
  }

  return { ...session, sub: session.sub };
}

export async function getAuthenticatedUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(USER_SESSION_COOKIE)?.value;

  if (token) {
    const session = await verifyUserSession(token);
    if (session?.sub) {
      const user = await getUserById(session.sub);
      if (user) {
        return user;
      }
    }
  }

  const nextAuthSession = await auth();
  const email = nextAuthSession?.user?.email?.trim();

  if (!email) {
    return null;
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return existingUser;
  }

  const fullName = nextAuthSession?.user?.name?.trim() || email.split("@")[0] || email;
  return await createUser({
    fullName,
    email,
    phone: "",
    passwordHash: "",
  });
}
