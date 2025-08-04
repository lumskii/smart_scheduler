'use client'

import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'          // shadcn
import { Button }   from '@/components/ui/button'
import { trpc }     from '@/utils/trpc'
import { BookingForm } from './components/booking-form'
import { useBookingSocket } from '@/hooks/useBookingSocket'
import { format }   from 'date-fns'

export default function Page() {
  const [date, setDate] = useState<Date | undefined>()
  const [slot, setSlot] = useState<number | null>(null)      // minutes
  const dateISO = date ? format(date, 'yyyy-MM-dd') : ''

  // live-invalidate when another user books
  useBookingSocket(dateISO)

  const { data: slots = [], isFetching } =
    trpc.slots.useQuery({ date: dateISO }, { enabled: !!date })

  return (
    <div className="mx-auto max-w-md space-y-6 p-4">
      <Calendar mode="single" selected={date} onSelect={setDate} />

      {date && (
        <div className="grid grid-cols-3 gap-2">
          {slots.map(m => (
            <Button key={m} variant={slot === m ? 'default' : 'outline'}
                    onClick={() => setSlot(m)}>
              {`${Math.floor(m / 60)
                .toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`}
            </Button>
          ))}
          {isFetching && 'Loading…'}
        </div>
      )}

      {slot !== null && (
        <BookingForm
          dateISO={dateISO}
          startMin={slot}
          afterSubmit={() => { setSlot(null); }}
        />
      )}
    </div>
  )
}
