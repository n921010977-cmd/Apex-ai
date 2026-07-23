import { PrismaClient } from "@prisma/client";

// Single PrismaClient for the process (avoids exhausting the connection pool).
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}
