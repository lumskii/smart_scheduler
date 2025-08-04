import type { NextApiRequest, NextApiResponse } from 'next';
import { Server as IOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

declare global {
  // Extend NodeJS.Global to include 'io' property
  // eslint-disable-next-line no-var
  var io: IOServer | undefined;
}

export const config = { api: { bodyParser: false } }; // disable parsing

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!res.socket) {
    res.status(500).end();
    return;
  }
  const httpServer = (res.socket as unknown as { server: HTTPServer }).server as HTTPServer & { io?: IOServer };

  if (!httpServer.io) {
    // Initialize Socket.IO server if not already initialized
    const io = new IOServer(httpServer, {
      path: "/api/socket_io",
      addTrailingSlash: false,
    });
    httpServer.io = io;
    global.io = io;
    io.on('connection', (socket) => console.log('🔌  Socket connected', socket.id));
  }

  res.end(); // Socket.IO handles the actual upgrade
}
