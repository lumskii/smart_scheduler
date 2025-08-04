import { initTRPC } from '@trpc/server';
import { z }          from 'zod';
import { prisma }     from '@/server/prisma/client';
import { computeOpenSlots, toUtc, dayRange } from '@/server/lib/slots';
import { differenceInMinutes } from 'date-fns';
import type { Context } from './context';

const t = initTRPC.context<Context>().create();

/* ---------- procedures ---------- */

const getSlots = t.procedure
  .input(z.object({ date: z.string() }))              // yyyy-mm-dd
  .query(async ({ input }) => {
    const { start, end } = dayRange(input.date);

    // owner == first user row (demo assumption)
    const owner = await prisma.user.findFirstOrThrow();
    const [ rules, buffer, bookings ] = await Promise.all([
      prisma.availability.findMany({ where: { userId: owner.id } }),
      prisma.bufferSetting.findUnique({ where: { userId: owner.id } }),
      prisma.booking.findMany({
        where: { userId: owner.id, startUtc: { gte: start, lte: end } },
        select: { startUtc: true, endUtc: true }
      })
    ]);

    const open = computeOpenSlots(
      new Date(input.date + 'T00:00:00Z'),
      rules.map(r => ({ weekday: r.weekday, startMin: r.startMin, endMin: r.endMin })),
      bookings.map(b => ({
        startMin: differenceInMinutes(b.startUtc, start),
        endMin:   differenceInMinutes(b.endUtc,   start)
      })),
      buffer?.minutes ?? 0
    );
    return open;               // e.g. [540, 570, 600]  => 09:00, 09:30, 10:00
  });

const createBooking = t.procedure
  .input(z.object({
    date:     z.string(),      // yyyy-mm-dd
    startMin: z.number(),
    name:     z.string(),
    email:    z.email(),
    notes:    z.string().optional()
  }))
  .mutation(async ({ input }) => {
    const owner = await prisma.user.findFirstOrThrow();
    const startUtc = toUtc(input.date, input.startMin);
    const endUtc   = toUtc(input.date, input.startMin + 30);

    await prisma.booking.create({
      data: { ...input, startUtc, endUtc, userId: owner.id }
    });

    // TODO 1:  io.emit('booking:new', { date: input.date });
    // TODO 2:  enqueue Google Calendar sync here

    return { success: true };
  });

const setBuffer = t.procedure
  .input(z.object({ minutes: z.number().min(0).max(120) }))
  .mutation(async ({ input, ctx }) => {
    if (!ctx.user) throw new Error('unauthenticated');
    await prisma.bufferSetting.upsert({
      where: { userId: ctx.user.id },
      update: { minutes: input.minutes },
      create: { userId: ctx.user.id, minutes: input.minutes }
    });
    return { ok: true };
  });

/* ---------- router ---------- */

export const appRouter = t.router({
  slots:        getSlots,
  createBooking,
  setBuffer
});
export type AppRouter = typeof appRouter;
