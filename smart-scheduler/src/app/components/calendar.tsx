import { motion } from 'framer-motion';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { format } from 'date-fns';

type CalendarProps = {
  onSelect: (date: string) => void;
};

export function Calendar({ onSelect }: CalendarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="flex justify-center p-4"
    >
      <CalendarUI
        mode="single"
        selected={undefined}
        onSelect={(date) => {
          if (date) {
            onSelect(format(date, 'yyyy-MM-dd'));
          }
        }}
        disabled={{ before: new Date() }}
        modifiers={{
          available: (date) => {
            const day = date.getDay();
            return day !== 0 && day !== 6; // Disable weekends
          }
        }}
      />
    </motion.div>
  );
}
