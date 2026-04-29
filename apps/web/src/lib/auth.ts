import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@ten/database";
import type { Role } from "@ten/database";

const SESSION_COOKIE = "ten_session";
const SESSION_TTL = 60 * 60 * 24 * 30;

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  role: Role;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL}s`)
    .sign(getSecret());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.userId !== "string" || typeof payload.role !== "string") {
      return null;
    }
    return { userId: payload.userId, role: payload.role as Role };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      profile: true,
      photos: { orderBy: { order: "asc" } },
      wallet: true,
      promptAnswers: { include: { prompt: true } },
    },
  });

  if (!user || user.isBanned) return null;
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}
