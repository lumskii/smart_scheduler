import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { prisma } from "@/server/prisma/client";
import { computeOpenSlots, toUtc, dayRange } from "@/server/lib/slots";
import { differenceInMinutes } from "date-fns";
import type { Context } from "./context";
import { getIO } from "../socket";
import { calendar } from "../lib/google";
import superjson from "superjson";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

/* ---------- procedures ---------- */

const getSlots = t.procedure
  .input(z.object({ date: z.string() })) // yyyy-mm-dd
  .query(async ({ input }) => {
    const { start, end } = dayRange(input.date);

    // owner == first user row (demo assumption)
    const owner = await prisma.user.findFirst();
    if (!owner) {
      // Return default schedule if no user exists
      return Array.from({ length: 16 }, (_, i) => (9 + i/2) * 60); // 9:00 AM to 5:00 PM, 30min slots
    }

    const [rules, buffer, bookings] = await Promise.all([
      prisma.availability.findMany({ where: { userId: owner.id } }),
      prisma.bufferSetting.findUnique({ where: { userId: owner.id } }),
      prisma.booking.findMany({
        where: { userId: owner.id, startUtc: { gte: start, lte: end } },
        select: { startUtc: true, endUtc: true },
      }),
    ]);

    const open = computeOpenSlots(
      new Date(`${input.date}T00:00:00`), // Use local time instead of UTC
      rules.map((r) => ({
        weekday: r.weekday,
        startMin: r.startMin,
        endMin: r.endMin,
      })),
      bookings.map((b) => ({
        startMin: differenceInMinutes(new Date(b.startUtc), start),
        endMin: differenceInMinutes(new Date(b.endUtc), start),
      })),
      buffer?.minutes ?? 0
    );
    return open; // e.g. [540, 570, 600]  => 09:00, 09:30, 10:00
  });

const createBooking = t.procedure
  .input(
    z.object({
      date: z.string(), // yyyy-mm-dd
      startMin: z.number(),
      name: z.string(),
      email: z.email(),
      notes: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const owner = await prisma.user.findFirstOrThrow();
    // Create dates in MST (owner's timezone)
    const start = toUtc(input.date, input.startMin);
    const end = toUtc(input.date, input.startMin + 30);

    await prisma.booking.create({
      data: {
        name: input.name,
        email: input.email,
        notes: input.notes,
        startUtc: start,
        endUtc: end,
        userId: owner.id,
      },
    });

    //  io.emit setup
    getIO()?.emit("booking:new", { date: input.date });

    //  Google Calendar sync here
    await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID!,
      requestBody: {
        summary: `Meeting with ${input.name}`,
        description: input.notes ?? "",
        start: { 
          dateTime: start.toISOString(),
          timeZone: 'America/Denver'  // Always use MST
        },
        end: { 
          dateTime: end.toISOString(),
          timeZone: 'America/Denver'  // Always use MST
        },
      },
    });

    return { success: true };
  });

const getBuffer = t.procedure.query(async ({ ctx }) => {
  const owner = await prisma.user.findFirstOrThrow();
  const buffer = await prisma.bufferSetting.findUnique({
    where: { userId: owner.id },
  });
  return buffer || { minutes: 15 };
});

const setBuffer = t.procedure
  .input(z.object({ minutes: z.number().min(0).max(120) }))
  .mutation(async ({ input, ctx }) => {
    if (!ctx.user) throw new Error("unauthenticated");
    await prisma.bufferSetting.upsert({
      where: { userId: ctx.user.id },
      update: { minutes: input.minutes },
      create: { userId: ctx.user.id, minutes: input.minutes },
    });
    return { ok: true };
  });

/* ------------ list upcoming bookings ---------------- */
const listBookings = t.procedure.query(async () => {
  const owner = await prisma.user.findFirstOrThrow();
  return prisma.booking.findMany({
    where: { userId: owner.id, startUtc: { gte: new Date() } },
    orderBy: { startUtc: "asc" },
    select: { id: true, name: true, startUtc: true },
  });
});

/* ------------ cancel a booking ---------------- */
const cancelBooking = t.procedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ input }) => {
    await prisma.booking.delete({ where: { id: input.id } });
    getIO()?.emit("booking:new", { date: "" }); // refresh any grids
    return { ok: true };
  });

/* ---------- router ---------- */

export const appRouter = t.router({
  slots: getSlots,
  createBooking,
  getBuffer,
  setBuffer,
  listBookings,
  cancelBooking,
});
export type AppRouter = typeof appRouter;
