'use client'

import { useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { trpc }  from '@/utils/trpc'
import { format } from 'date-fns'

export default function Dashboard() {
    const utils = trpc.useUtils()
  /* ---------- buffer slider ---------- */
  const { data: buffer = { minutes: 15 } } = trpc.getBuffer.useQuery()
  const setBuffer = trpc.setBuffer.useMutation({
    onSuccess: () => utils.getBuffer.invalidate(),
  })
  const [pending, setPending] = useState(buffer?.minutes ?? 15)

  /* ---------- bookings list ---------- */
  const { data: bookings = [] } = trpc.listBookings.useQuery()
  const cancelBooking = trpc.cancelBooking.useMutation({
    onSuccess: () => utils.listBookings.invalidate(),
  })

  /* ---------- UI ---------- */
  return (
    <div className="mx-auto max-w-lg space-y-8 p-6">
      <section className="space-y-3">
        <h1 className="text-xl font-semibold">Buffer time (minutes)</h1>
        <Slider defaultValue={[buffer?.minutes ?? 15]} max={120} step={5}
          onValueChange={v => setPending(v[0])}
          onValueCommit={v => setBuffer.mutate({ minutes: v[0] })} />
        <span className="text-sm text-muted-foreground">
          Current: {buffer?.minutes ?? 15} Pending: {pending}
        </span>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Upcoming bookings</h2>
        <ul className="space-y-2">
          {bookings.map(b => (
            <li key={b.id} className="flex items-center justify-between border p-3 rounded">
              <span>{b.name} — {format(new Date(b.startUtc), 'PP p')}</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => cancelBooking.mutate({ id: b.id })}
              >
                Cancel
              </Button>
            </li>
          ))}
          {!bookings.length && <li className="text-muted-foreground">No future bookings</li>}
        </ul>
      </section>
    </div>
  )
}
