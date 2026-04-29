"use server";

import { redirect } from "next/navigation";
import { prisma } from "@ten/database";
import { signUpSchema, loginSchema } from "@ten/shared";
import { hashPassword, verifyPassword, createSession, destroySession } from "@/lib/auth";

export async function signUpAction(formData: FormData) {
  const raw = {
    email: String(formData.get("email") ?? "").toLowerCase().trim(),
    password: String(formData.get("password") ?? ""),
    firstName: String(formData.get("firstName") ?? "").trim(),
    dateOfBirth: String(formData.get("dateOfBirth") ?? ""),
    gender: formData.get("gender"),
    interestedIn: formData.get("interestedIn"),
    locationCity: formData.get("locationCity") ?? undefined,
  };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      firstName: parsed.data.firstName,
      dateOfBirth: parsed.data.dateOfBirth,
      gender: parsed.data.gender,
      interestedIn: parsed.data.interestedIn,
      locationCity: parsed.data.locationCity,
      profile: { create: {} },
      wallet: { create: { rewinds: 1 } },
    },
  });

  await createSession({ userId: user.id, role: user.role });
  redirect("/onboarding");
}

export async function loginAction(formData: FormData) {
  const raw = {
    email: String(formData.get("email") ?? "").toLowerCase().trim(),
    password: String(formData.get("password") ?? ""),
  };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || user.isBanned) {
    return { error: "Invalid email or password." };
  }
  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    return { error: "Invalid email or password." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastActiveAt: new Date() },
  });
  await createSession({ userId: user.id, role: user.role });

  if (user.role === "admin") redirect("/admin");
  redirect("/app");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
