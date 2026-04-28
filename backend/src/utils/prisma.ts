import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

<<<<<<< HEAD
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
=======
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
>>>>>>> 3f8a844 (Complete backend API implementation with AWS deployment setup)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
