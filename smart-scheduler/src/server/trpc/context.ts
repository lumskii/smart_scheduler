import { prisma } from '@/server/prisma/client';
import { currentUser } from '@clerk/nextjs/server';

export async function createContext() {
  const user = await currentUser().catch(() => null);
  return { prisma, user };
}
export type Context = Awaited<ReturnType<typeof createContext>>;
