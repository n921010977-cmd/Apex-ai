/**
 * Prisma client singleton — safe for Next.js hot-reload in development.
 *
 * In production a single instance is created for the process lifetime.
 * In development the instance is stored on `globalThis` to survive HMR.
 */

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined;
}

function buildClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
    errorFormat: "minimal",
  });
}

export const db: PrismaClient =
  globalThis._prisma ?? (globalThis._prisma = buildClient());

if (process.env.NODE_ENV !== "production") {
  globalThis._prisma = db;
}
