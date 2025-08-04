import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';


export function useBookingSocket(dateISO: string) {
  const qc = useQueryClient();

  useEffect(() => {
    const socket: Socket = io('http://localhost:4000', {
      transports: ['websocket'],
    });

    socket.on('booking:new', (payload: { date: string }) => {
      if (payload.date === dateISO) {
        // invalidate only the current day’s slots
        qc.invalidateQueries({ queryKey: ['slots', { date: dateISO }] });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [dateISO, qc]);
}
