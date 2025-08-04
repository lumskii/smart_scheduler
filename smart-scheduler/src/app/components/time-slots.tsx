import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';

type TimeSlotsProps = {
  date: string;
  onSelect: (time: number) => void;
};

export function TimeSlots({ date, onSelect }: TimeSlotsProps) {
  const { data: slots = [], isLoading } = trpc.slots.useQuery({ date });

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading available times...
      </div>
    );
  }

  if (!slots.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No available time slots for this date.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-4">
      {slots.map((minutes, i) => {
        const time = new Date(2000, 1, 1, Math.floor(minutes / 60), minutes % 60);
        
        return (
          <motion.div
            key={minutes}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: { delay: i * 0.05 }
            }}
          >
            <Button
              variant="outline"
              onClick={() => onSelect(minutes)}
              className="w-full"
            >
              {format(time, 'h:mm a')}
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
}
