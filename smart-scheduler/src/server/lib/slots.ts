import { addMinutes, differenceInMinutes, startOfDay, endOfDay } from 'date-fns';

export type Rule  = { weekday: number; startMin: number; endMin: number };
export type Block = { startMin: number; endMin: number };

export function computeOpenSlots(
  date: Date,
  rules: Rule[],
  bookings: Block[],
  buffer: number,                // minutes
  slotLength = 30
) {
  const weekday = date.getDay();
  const rule = rules.find(r => r.weekday === weekday);
  if (!rule) return [];

  // Build full-day grid
  const slots: number[] = [];
  for (let m = rule.startMin; m + slotLength <= rule.endMin; m += slotLength) {
    slots.push(m);
  }

  // Remove slots that collide with bookings ± buffer
  const blocked = new Set<number>();
  bookings.forEach(b => {
    const start = b.startMin - buffer;
    const end   = b.endMin   + buffer;
    for (const m of slots) {
      if (m < end && m + slotLength > start) blocked.add(m);
    }
  });

  return slots.filter(m => !blocked.has(m));
}

export function toUtc(dateISO: string, minutes: number) {
  // Simply create the date in owner's timezone (MST)
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return new Date(`${dateISO}T${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`);
}

export function dayRange(dateISO: string) {
  const d = new Date(`${dateISO}T00:00:00`);
  return { start: startOfDay(d), end: endOfDay(d) };
}
