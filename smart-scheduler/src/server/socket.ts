import { Server as IOServer } from 'socket.io';

declare global {
  // Extend the global object to include 'io'
  // eslint-disable-next-line no-var
  var io: IOServer | undefined;
}

export const getIO = (): IOServer | null =>
  global.io ? (global.io as IOServer) : null;
