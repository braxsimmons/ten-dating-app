import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@ten/database";
import type { Role } from "@ten/database";

const SESSION_COOKIE = "ten_session";
const IMPERSONATE_COOKIE = "ten_impersonate";
const SESSION_TTL = 60 * 60 * 24 * 30;
const IMPERSONATE_TTL = 60 * 60 * 2;

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

  const impersonatedId = await getImpersonatedId();
  const effectiveId = impersonatedId ?? session.userId;

  const user = await prisma.user.findUnique({
    where: { id: effectiveId },
    include: {
      profile: true,
      photos: { orderBy: { order: "asc" } },
      wallet: true,
      promptAnswers: { include: { prompt: true } },
    },
  });

  if (!user) return null;
  if (user.isBanned && !impersonatedId) return null;
  return user;
}

export async function getImpersonationContext(): Promise<{ adminId: string; targetUserId: string } | null> {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  const targetUserId = await getImpersonatedId();
  if (!targetUserId) return null;
  return { adminId: session.userId, targetUserId };
}

async function getImpersonatedId(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  const store = await cookies();
  const token = store.get(IMPERSONATE_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.targetUserId !== "string" || payload.adminId !== session.userId) return null;
    return payload.targetUserId;
  } catch {
    return null;
  }
}

export async function startImpersonation(targetUserId: string) {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("FORBIDDEN");
  const token = await new SignJWT({ targetUserId, adminId: session.userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${IMPERSONATE_TTL}s`)
    .sign(getSecret());
  const store = await cookies();
  store.set(IMPERSONATE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: IMPERSONATE_TTL,
  });
}

export async function stopImpersonation() {
  const store = await cookies();
  store.delete(IMPERSONATE_COOKIE);
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
