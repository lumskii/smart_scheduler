'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { trpc } from '@/utils/trpc'
import { Form, FormField, FormItem, FormLabel, FormControl,
         FormMessage } from '@/components/ui/form'
import { Input }  from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const schema = z.object({
  name:  z.string().min(2),
  email: z.email(),
  notes: z.string().optional(),
})

type FormSchema = z.infer<typeof schema>

export function BookingForm(
  { dateISO, startMin, afterSubmit }: {
    dateISO: string
    startMin: number
    afterSubmit: () => void
  }) {

  const form = useForm<FormSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      notes: '',
    },
  })
  const createBooking = trpc.createBooking.useMutation({
    onSuccess: () => { form.reset(); afterSubmit() }
  })

  function onSubmit(values: FormSchema) {
    createBooking.mutate({ ...values, date: dateISO, startMin })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField control={form.control} name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
              <FormMessage/>
            </FormItem>
          )}/>
        <FormField control={form.control} name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" placeholder="jane@email.com" {...field} /></FormControl>
              <FormMessage/>
            </FormItem>
          )}/>
        <FormField control={form.control} name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl><Input placeholder="Optional" {...field} /></FormControl>
            </FormItem>
          )}/>
        <Button type="submit" disabled={createBooking.status === 'pending'}>
          {createBooking.status === 'pending' ? 'Saving…' : 'Confirm'}
        </Button>
      </form>
    </Form>
  )
}
