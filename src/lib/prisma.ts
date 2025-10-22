import { PrismaClient } from '@prisma/client';

// Evita múltiples instancias de PrismaClient durante el desarrollo (hot reload)
const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'], // puedes agregar 'query' si quieres depurar
  });

// Guarda la instancia global en desarrollo
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
