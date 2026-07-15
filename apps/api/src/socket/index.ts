import { Server, Socket } from 'socket.io';

export function setupSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join_room', ({ room }: { room: string }) => {
      socket.join(room);
      socket.to(room).emit('user_joined', { socketId: socket.id, room });
    });

    socket.on('leave_room', ({ room }: { room: string }) => {
      socket.leave(room);
      socket.to(room).emit('user_left', { socketId: socket.id, room });
    });

    socket.on('message', ({ room, text, userId }: { room: string; text: string; userId: string }) => {
      io.to(room).emit('message', { text, userId, timestamp: new Date().toISOString() });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}
