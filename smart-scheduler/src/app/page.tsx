'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BookingWizard } from './components/booking-wizard'

export default function Page() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mx-auto max-w-lg p-8 text-center">
      <h1 className="text-4xl font-bold mb-6">Schedule a Meeting</h1>
      <p className="text-gray-600 mb-8">
        Choose a convenient time for your meeting and I&apos;ll make it happen.
      </p>
      <Button 
        size="lg"
        onClick={() => setIsOpen(true)}
        className="animate-pulse hover:animate-none"
      >
        Book Now
      </Button>

      {isOpen && (
        <BookingWizard open={isOpen} onClose={() => setIsOpen(false)} />
      )}
    </div>
  )
}
