'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from './calendar';
import { TimeSlots } from './time-slots';
import { BookingForm } from './booking-form';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0
  })
};

type BookingWizardProps = {
  open: boolean;
  onClose: () => void;
};

export function BookingWizard({ open, onClose }: BookingWizardProps) {
  const [[step, direction], setStep] = useState([0, 0]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    setStep([step + newDirection, newDirection]);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    paginate(1);
  };

  const handleTimeSelect = (time: number) => {
    setSelectedTime(time);
    paginate(1);
  };

  const handleBookingSuccess = () => {
    setIsSuccess(true);
    paginate(1);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="overflow-hidden p-0 max-w-2xl w-full min-h-[500px]">
        <VisuallyHidden.Root>
          <DialogTitle>Schedule a Meeting</DialogTitle>
        </VisuallyHidden.Root>
        <VisuallyHidden.Root>
          <DialogDescription>
            Follow the steps to schedule a meeting: select a date, choose a time slot, then fill out your details.
          </DialogDescription>
        </VisuallyHidden.Root>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 text-gray-500 z-50"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        {/* Progress indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${((step + 1) / 4) * 100}%` }}
          />
        </div>

        <AnimatePresence initial={false} custom={direction}>
          {step === 0 && (
            <motion.div
              key="calendar"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);
                if (swipe < -swipeConfidenceThreshold && selectedDate) {
                  paginate(1);
                }
              }}
              className="absolute inset-0 p-6"
            >
              <h2 className="text-2xl font-semibold mb-6 text-center">Select a Date</h2>
              <Calendar onSelect={handleDateSelect} />
            </motion.div>
          )}

          {step === 1 && selectedDate && (
            <motion.div
              key="timeslots"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);
                if (swipe < -swipeConfidenceThreshold && selectedTime) {
                  paginate(1);
                } else if (swipe > swipeConfidenceThreshold) {
                  paginate(-1);
                }
              }}
              className="absolute inset-0 p-6"
            >
              <h2 className="text-2xl font-semibold mb-6 text-center">Select a Time</h2>
              <TimeSlots date={selectedDate} onSelect={handleTimeSelect} />
              <button
                onClick={() => paginate(-1)}
                className="absolute top-6 left-6 text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
            </motion.div>
          )}

          {step === 2 && selectedDate && selectedTime !== null && (
            <motion.div
              key="form"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="absolute inset-0 p-6"
            >
              <h2 className="text-2xl font-semibold mb-6 text-center">Enter Your Details</h2>
              <BookingForm
                dateISO={selectedDate}
                startMin={selectedTime}
                afterSubmit={handleBookingSuccess}
              />
              <button
                onClick={() => paginate(-1)}
                className="absolute top-6 left-6 text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
            </motion.div>
          )}

          {step === 3 && isSuccess && (
            <motion.div
              key="success"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4"
              >
                <Check className="w-8 h-8 text-green-600" />
              </motion.div>
              <h2 className="text-2xl font-semibold mb-2">Meeting Scheduled!</h2>
              <p className="text-gray-600 mb-6">
                You&apos;ll receive a confirmation email shortly.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
