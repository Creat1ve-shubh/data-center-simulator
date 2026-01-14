import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Only initialize Prisma if DATABASE_URL is set
const createPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not set, Prisma client not initialized');
    return null;
  }
  
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
};

export const prisma =
  globalForPrisma.prisma ??
  createPrismaClient();

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}
