import { PrismaClient } from "@prisma/client";

// Ein PrismaClient pro Prozess (Hot-Reload in dev erzeugt sonst viele Verbindungen)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
