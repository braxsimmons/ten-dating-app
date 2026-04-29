import { PrismaClient } from "@prisma/client";

declare global {

  var __ten_prisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__ten_prisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__ten_prisma__ = prisma;
}

export * from "@prisma/client";
