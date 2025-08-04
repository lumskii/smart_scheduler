// Minimal socket.io server for development
const { Server } = require('socket.io');
const http = require('http');

const PORT = 4000;

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Socket.io server running');
});

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);

  // Example: echo booking:new events for testing
  socket.on('booking:new', (payload) => {
    io.emit('booking:new', payload);
  });
});

server.listen(PORT, () => {
  console.log(`Socket.io server listening on http://localhost:${PORT}`);
});
